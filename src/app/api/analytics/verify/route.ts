import { NextRequest, NextResponse } from "next/server";
import {
  ANALYTICS_AUTH_COOKIE,
  ANALYTICS_CODE_LENGTH,
  ANALYTICS_FAILURES_COOKIE,
  MAX_ANALYTICS_ATTEMPTS,
  getFailureCount,
  isAccessCodeValid,
  isLockedOut,
  signSessionToken,
} from "@/lib/analyticsAuth";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function POST(req: NextRequest) {
  try {
    const failures = await getFailureCount();

    if (isLockedOut(failures)) {
      return NextResponse.json(
        {
          success: false,
          locked: true,
          message: "Maximum tries exhausted. Access is temporarily blocked.",
        },
        { status: 403 },
      );
    }

    const body = (await req.json()) as { code?: string };
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (code.length !== ANALYTICS_CODE_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Enter a ${ANALYTICS_CODE_LENGTH}-digit code.`,
        },
        { status: 400 },
      );
    }

    if (!process.env.ANALYTICS_ACCESS_KEY) {
      return NextResponse.json(
        { success: false, message: "Analytics access is not configured." },
        { status: 503 },
      );
    }

    if (!isAccessCodeValid(code)) {
      const nextFailures = failures + 1;
      const locked = isLockedOut(nextFailures);
      const res = NextResponse.json(
        {
          success: false,
          locked,
          attemptsRemaining: Math.max(0, MAX_ANALYTICS_ATTEMPTS - nextFailures),
          message: locked
            ? "Maximum tries exhausted. Access is temporarily blocked."
            : "Invalid code. Please try again.",
        },
        { status: locked ? 403 : 401 },
      );

      res.cookies.set(ANALYTICS_FAILURES_COOKIE, String(nextFailures), {
        ...COOKIE_OPTIONS,
        maxAge: 60 * 60,
      });

      return res;
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set(ANALYTICS_AUTH_COOKIE, signSessionToken(), {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 12,
    });
    res.cookies.delete(ANALYTICS_FAILURES_COOKIE);
    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 500 },
    );
  }
}

export async function GET() {
  const failures = await getFailureCount();
  return NextResponse.json({
    locked: isLockedOut(failures),
    attemptsRemaining: Math.max(0, MAX_ANALYTICS_ATTEMPTS - failures),
  });
}
