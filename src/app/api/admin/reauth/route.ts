import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_AUTH_COOKIE,
  clearAdminSessionCookie,
  getAdminSessionStatus,
  matchingTotpStep,
  recordAdminReauthFailure,
  renewAdminSession,
  revokeAdminSession,
  setAdminSessionCookie,
} from "@/lib/adminAuth";
import { recordAttempt } from "@/lib/adminAccessAttempts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  try {
    if (origin && new URL(origin).host !== req.headers.get("host")) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const token = req.cookies.get(ADMIN_AUTH_COOKIE)?.value;
    const status = await getAdminSessionStatus(token);
    if (status.state !== "reauth" || !token) {
      const response = NextResponse.json({ success: false, expired: true }, { status: 401 });
      if (status.state === "expired") {
        await revokeAdminSession(token);
        clearAdminSessionCookie(response);
      }
      return response;
    }

    const body = (await req.json().catch(() => null)) as { totp?: unknown } | null;
    const code = typeof body?.totp === "string" ? body.totp : "";
    const attempt = await recordAttempt(req, matchingTotpStep(code));
    if (!attempt.success) {
      const failure = await recordAdminReauthFailure(token);
      const response = NextResponse.json({
        success: false,
        ...failure,
        message: failure.expired ? "Session expired." : "Invalid code. One attempt remaining.",
      }, { status: 401 });
      if (failure.expired) clearAdminSessionCookie(response);
      return response;
    }

    const renewed = await renewAdminSession(token);
    if (!renewed) {
      const response = NextResponse.json({ success: false, expired: true }, { status: 401 });
      clearAdminSessionCookie(response);
      return response;
    }
    const response = NextResponse.json({ success: true, reauthAt: renewed.reauthAt, serverNow: Date.now() });
    setAdminSessionCookie(response, renewed.token);
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Reauthentication unavailable" }, { status: 500 });
  }
}
