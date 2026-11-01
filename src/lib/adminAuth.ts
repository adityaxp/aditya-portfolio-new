import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const ADMIN_AUTH_COOKIE = "portfolio_admin_session";
export const MAX_ADMIN_ATTEMPTS = 4;
export const ADMIN_SESSION_INTERVAL_MS = 60 * 60 * 1000;
export const ADMIN_REAUTH_WINDOW_MS = 20 * 1000;
export const MAX_REAUTH_ATTEMPTS = 2;
export const ADMIN_COOKIE_MAX_AGE_SEC = (ADMIN_SESSION_INTERVAL_MS + ADMIN_REAUTH_WINDOW_MS) / 1000;

export type AdminSessionStatus = {
  state: "none" | "active" | "reauth" | "expired";
  reauthAt?: number;
  graceUntil?: number;
  reauthAttemptsRemaining?: number;
};

function getSessionSecret(): Buffer {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !/^[a-fA-F0-9]{64}$/.test(secret)) {
    throw new Error("ADMIN_SESSION_SECRET must be a random 32-byte hex secret");
  }
  return Buffer.from(secret, "hex");
}

function getTotpSecret(): Buffer {
  const encoded = process.env.ADMIN_TOTP_SECRET?.toUpperCase();
  if (!encoded || !/^[A-Z2-7]{32,}$/.test(encoded)) {
    throw new Error("ADMIN_TOTP_SECRET must be a Base32 key of at least 32 characters");
  }

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of encoded) {
    value = (value << 5) | alphabet.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits -= 8)) & 0xff);
      value &= (1 << bits) - 1;
    }
  }
  return Buffer.from(bytes);
}

export function isAdminAuthConfigured(): boolean {
  try {
    return getTotpSecret().length >= 20 &&
      Boolean(getSessionSecret());
  } catch {
    return false;
  }
}

function sessionRef(token: string) {
  const id = createHmac("sha256", getSessionSecret()).update(token).digest("hex");
  return db.collection("admin_sessions").doc(id);
}

export async function createAdminSession() {
  const token = randomBytes(32).toString("hex");
  const now = Date.now();
  const reauthAt = now + ADMIN_SESSION_INTERVAL_MS;
  const graceUntil = reauthAt + ADMIN_REAUTH_WINDOW_MS;
  await sessionRef(token).create({ createdAt: new Date(now), reauthAt, graceUntil, reauthFailures: 0, expiresAt: new Date(graceUntil) });
  return { token, reauthAt, graceUntil };
}

export async function getAdminSessionStatus(token?: string): Promise<AdminSessionStatus> {
  const sessionToken = token ?? (await cookies()).get(ADMIN_AUTH_COOKIE)?.value;
  if (!sessionToken || !/^[a-f0-9]{64}$/.test(sessionToken)) return { state: "none" };
  const snapshot = await sessionRef(sessionToken).get();
  if (!snapshot.exists) return { state: "none" };
  const createdAt = snapshot.get("createdAt")?.toMillis?.();
  const reauthAt = Math.min(Number(snapshot.get("reauthAt")), typeof createdAt === "number" ? createdAt + ADMIN_SESSION_INTERVAL_MS : Infinity);
  const graceUntil = reauthAt + ADMIN_REAUTH_WINDOW_MS;
  if (!Number.isFinite(reauthAt) || !Number.isFinite(graceUntil)) return { state: "none" };
  const now = Date.now();
  if (now >= graceUntil) return { state: "expired", reauthAt, graceUntil };
  return { state: now >= reauthAt ? "reauth" : "active", reauthAt, graceUntil, reauthAttemptsRemaining: Math.max(0, MAX_REAUTH_ATTEMPTS - Number(snapshot.get("reauthFailures") ?? 0)) };
}

export async function recordAdminReauthFailure(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return { expired: true, attemptsRemaining: 0 };
  const ref = sessionRef(token);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return { expired: true, attemptsRemaining: 0 };
    const createdAt = snapshot.get("createdAt")?.toMillis?.();
    const reauthAt = Math.min(Number(snapshot.get("reauthAt")), typeof createdAt === "number" ? createdAt + ADMIN_SESSION_INTERVAL_MS : Infinity);
    if (Date.now() >= reauthAt + ADMIN_REAUTH_WINDOW_MS) {
      transaction.delete(ref);
      return { expired: true, attemptsRemaining: 0 };
    }
    const attemptsRemaining = Math.max(0, MAX_REAUTH_ATTEMPTS - Number(snapshot.get("reauthFailures") ?? 0) - 1);
    if (attemptsRemaining === 0) transaction.delete(ref);
    else transaction.update(ref, { reauthFailures: MAX_REAUTH_ATTEMPTS - attemptsRemaining });
    return { expired: attemptsRemaining === 0, attemptsRemaining };
  });
}

export async function renewAdminSession(oldToken: string) {
  if (!/^[a-f0-9]{64}$/.test(oldToken)) return null;
  const token = randomBytes(32).toString("hex");
  const oldRef = sessionRef(oldToken);
  const newRef = sessionRef(token);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(oldRef);
    if (!snapshot.exists) return null;
    const now = Date.now();
    const createdAt = snapshot.get("createdAt")?.toMillis?.();
    const oldReauthAt = Math.min(Number(snapshot.get("reauthAt")), typeof createdAt === "number" ? createdAt + ADMIN_SESSION_INTERVAL_MS : Infinity);
    const oldGraceUntil = oldReauthAt + ADMIN_REAUTH_WINDOW_MS;
    if (now < oldReauthAt || now >= oldGraceUntil) return null;
    const reauthAt = now + ADMIN_SESSION_INTERVAL_MS;
    const graceUntil = reauthAt + ADMIN_REAUTH_WINDOW_MS;
    transaction.create(newRef, { createdAt: new Date(now), reauthAt, graceUntil, reauthFailures: 0, expiresAt: new Date(graceUntil) });
    transaction.delete(oldRef);
    return { token, reauthAt, graceUntil };
  });
}

export async function revokeAdminSession(token: string | undefined) {
  if (token && /^[a-f0-9]{64}$/.test(token)) await sessionRef(token).delete();
}

export function setAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE_SEC,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function totpAtStep(secret: Buffer, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac("sha1", secret).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const value = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(value).padStart(6, "0");
}

/** Return the matching 30-second step, so it can be consumed once in Firestore. */
export function matchingTotpStep(code: string, now = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const secret = getTotpSecret();
  const current = Math.floor(now / 30_000);
  for (const step of [current, current - 1, current + 1]) {
    if (step < 0) continue;
    if (timingSafeEqual(Buffer.from(code), Buffer.from(totpAtStep(secret, step)))) {
      return step;
    }
  }
  return null;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getAdminSessionStatus()).state === "active";
}
