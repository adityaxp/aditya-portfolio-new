import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSession,
  getAdminSessionStatus,
  isAdminAuthConfigured,
  matchingTotpStep,
  setAdminSessionCookie,
} from "@/lib/adminAuth";
import { getAttemptStatus, recordAttempt } from "@/lib/adminAccessAttempts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (origin && new URL(origin).host !== req.headers.get("host")) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    if (!isAdminAuthConfigured()) {
      return NextResponse.json(
        { success: false, message: "Admin authentication is not configured." },
        { status: 503 },
      );
    }

    const body = (await req.json().catch(() => null)) as { totp?: unknown } | null;
    const totp = typeof body?.totp === "string" ? body.totp : "";

    const attempt = await recordAttempt(req, matchingTotpStep(totp));
    if (!attempt.success) {
      return NextResponse.json(
        {
          ...attempt,
          message: attempt.locked
            ? "Maximum tries exhausted. Access is temporarily blocked."
            : "Invalid authenticator code. Please try again.",
        },
        { status: attempt.locked ? 403 : 401 },
      );
    }

    const session = await createAdminSession();
    const response = NextResponse.json({ success: true, reauthAt: session.reauthAt });
    setAdminSessionCookie(response, session.token);
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
    const [attempts, session] = await Promise.all([getAttemptStatus(req), getAdminSessionStatus(req.cookies.get("portfolio_admin_session")?.value)]);
    return NextResponse.json({ ...attempts, ...session, authenticated: session.state === "active", serverNow: Date.now() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Session check failed" }, { status: 500 });
  }
}
