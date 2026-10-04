import { NextRequest, NextResponse } from "next/server";
import {
  ANALYTICS_AUTH_COOKIE,
  ANALYTICS_CODE_LENGTH,
  isAccessCodeValid,
  isAnalyticsAuthenticated,
  signSessionToken,
} from "@/lib/analyticsAuth";
import { getAttemptStatus, recordAttempt } from "@/lib/accessAttempts";

export const runtime = "nodejs";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANALYTICS_ACCESS_KEY) {
      return NextResponse.json(
        { success: false, message: "Analytics access is not configured." },
        { status: 503 },
      );
    }

    const body = (await req.json()) as { code?: string };
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (code.length !== ANALYTICS_CODE_LENGTH) {
      return NextResponse.json(
        { success: false, message: `Enter a ${ANALYTICS_CODE_LENGTH}-digit code.` },
        { status: 400 },
      );
    }

    const attempt = await recordAttempt(req, isAccessCodeValid(code));
    if (!attempt.success) {
      return NextResponse.json(
        {
          ...attempt,
          message: attempt.locked
            ? "Maximum tries exhausted. Access is temporarily blocked."
            : "Invalid code. Please try again.",
        },
        { status: attempt.locked ? 403 : 401 },
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ANALYTICS_AUTH_COOKIE, signSessionToken(), {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 12,
    });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const status = await getAttemptStatus(req);
    return NextResponse.json({
      ...status,
      authenticated: !status.locked && await isAnalyticsAuthenticated(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Session check failed" }, { status: 500 });
  }
}
