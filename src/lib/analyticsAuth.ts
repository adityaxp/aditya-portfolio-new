import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ANALYTICS_AUTH_COOKIE = "portfolio_analytics_session";
export const ANALYTICS_FAILURES_COOKIE = "portfolio_analytics_failures";
export const MAX_ANALYTICS_ATTEMPTS = 4;
export const ANALYTICS_CODE_LENGTH = 6;
const SESSION_DURATION_SEC = 60 * 60 * 12;

function getSecret(): string {
  const secret = process.env.ANALYTICS_ACCESS_KEY;
  if (!secret) {
    throw new Error("ANALYTICS_ACCESS_KEY is not configured");
  }
  return secret;
}

export function signSessionToken(): string {
  const exp = Date.now() + SESSION_DURATION_SEC * 1000;
  const payload = String(exp);
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): boolean {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;

  const exp = Number(payload);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;

  const expected = createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function isAccessCodeValid(code: string): boolean {
  const expected = process.env.ANALYTICS_ACCESS_KEY;
  if (!expected || code.length !== ANALYTICS_CODE_LENGTH) return false;

  if (code.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(code), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function isAnalyticsAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ANALYTICS_AUTH_COOKIE)?.value;
  return token ? verifySessionToken(token) : false;
}

export async function getFailureCount(): Promise<number> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ANALYTICS_FAILURES_COOKIE)?.value;
  const count = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(count) ? count : 0;
}

export function isLockedOut(failureCount: number): boolean {
  return failureCount >= MAX_ANALYTICS_ATTEMPTS;
}
