import "server-only";

import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { MAX_ADMIN_ATTEMPTS } from "@/lib/adminAuth";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_GLOBAL_ATTEMPTS = 30;

function authStateRef() {
  return db.collection("admin_auth_state").doc("admin_totp");
}

function attemptRef(req: NextRequest) {
  const ip = req.headers.get("x-vercel-forwarded-for") ||
    req.headers.get("x-forwarded-for") || "unknown";
  const id = createHash("sha256").update(ip.split(",")[0].trim()).digest("hex");
  return db.collection("admin_access_attempts").doc(id);
}

function recentCount(data: FirebaseFirestore.DocumentData | undefined, now: number, field = "count") {
  const windowStart = data?.windowStart?.toMillis?.();
  return typeof windowStart === "number" && now - windowStart < WINDOW_MS
    ? Number(data?.[field]) || 0
    : 0;
}

export async function getAttemptStatus(req: NextRequest) {
  const [snapshot, globalSnapshot] = await Promise.all([
    attemptRef(req).get(),
    authStateRef().get(),
  ]);
  const now = Date.now();
  const count = recentCount(snapshot.data(), now);
  const globalCount = recentCount(globalSnapshot.data(), now, "failedCount");
  return {
    locked: count >= MAX_ADMIN_ATTEMPTS || globalCount >= MAX_GLOBAL_ATTEMPTS,
    attemptsRemaining: Math.max(0, Math.min(
      MAX_ADMIN_ATTEMPTS - count,
      MAX_GLOBAL_ATTEMPTS - globalCount,
    )),
  };
}

export async function recordAttempt(req: NextRequest, totpStep: number | null) {
  const ref = attemptRef(req);
  const totpRef = authStateRef();
  return db.runTransaction(async (transaction) => {
    const [snapshot, globalSnapshot] = await Promise.all([
      transaction.get(ref),
      transaction.get(totpRef),
    ]);
    const now = Date.now();
    const count = recentCount(snapshot.data(), now);
    const globalCount = recentCount(globalSnapshot.data(), now, "failedCount");
    if (count >= MAX_ADMIN_ATTEMPTS || globalCount >= MAX_GLOBAL_ATTEMPTS) {
      return { success: false, locked: true, attemptsRemaining: 0 };
    }
    const valid = totpStep !== null &&
      totpStep > Number(globalSnapshot.data()?.lastUsedStep ?? -1);
    if (valid) {
      transaction.set(totpRef, { lastUsedStep: totpStep, failedCount: 0, windowStart: new Date(now) }, { merge: true });
      transaction.delete(ref);
      return { success: true, locked: false, attemptsRemaining: MAX_ADMIN_ATTEMPTS };
    }
    const nextCount = count + 1;
    const nextGlobalCount = globalCount + 1;
    transaction.set(ref, {
      count: nextCount,
      windowStart: count ? snapshot.data()?.windowStart : new Date(now),
    });
    transaction.set(totpRef, {
      failedCount: nextGlobalCount,
      windowStart: globalCount ? globalSnapshot.data()?.windowStart : new Date(now),
    }, { merge: true });
    return {
      success: false,
      locked: nextCount >= MAX_ADMIN_ATTEMPTS || nextGlobalCount >= MAX_GLOBAL_ATTEMPTS,
      attemptsRemaining: Math.min(
        MAX_ADMIN_ATTEMPTS - nextCount,
        MAX_GLOBAL_ATTEMPTS - nextGlobalCount,
      ),
    };
  });
}
