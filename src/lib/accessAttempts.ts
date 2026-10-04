import "server-only";

import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { MAX_ANALYTICS_ATTEMPTS } from "@/lib/analyticsAuth";

const WINDOW_MS = 60 * 60 * 1000;

function attemptRef(req: NextRequest) {
  const ip = req.headers.get("x-vercel-forwarded-for") ||
    req.headers.get("x-forwarded-for") || "unknown";
  const id = createHash("sha256").update(ip.split(",")[0].trim()).digest("hex");
  return db.collection("access_attempts").doc(id);
}

function recentCount(data: FirebaseFirestore.DocumentData | undefined, now: number) {
  const windowStart = data?.windowStart?.toMillis?.();
  return typeof windowStart === "number" && now - windowStart < WINDOW_MS
    ? Number(data?.count) || 0
    : 0;
}

export async function getAttemptStatus(req: NextRequest) {
  const snapshot = await attemptRef(req).get();
  const count = recentCount(snapshot.data(), Date.now());
  return {
    locked: count >= MAX_ANALYTICS_ATTEMPTS,
    attemptsRemaining: Math.max(0, MAX_ANALYTICS_ATTEMPTS - count),
  };
}

export async function recordAttempt(req: NextRequest, valid: boolean) {
  const ref = attemptRef(req);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const now = Date.now();
    const count = recentCount(snapshot.data(), now);
    if (count >= MAX_ANALYTICS_ATTEMPTS) {
      return { success: false, locked: true, attemptsRemaining: 0 };
    }
    if (valid) {
      transaction.delete(ref);
      return { success: true, locked: false, attemptsRemaining: MAX_ANALYTICS_ATTEMPTS };
    }
    const nextCount = count + 1;
    transaction.set(ref, {
      count: nextCount,
      windowStart: count ? snapshot.data()?.windowStart : new Date(now),
    });
    return {
      success: false,
      locked: nextCount >= MAX_ANALYTICS_ATTEMPTS,
      attemptsRemaining: MAX_ANALYTICS_ATTEMPTS - nextCount,
    };
  });
}
