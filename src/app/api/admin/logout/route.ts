import { NextRequest, NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE, clearAdminSessionCookie, revokeAdminSession } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.get("host")) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    } catch {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
  }

  try {
    await revokeAdminSession(req.cookies.get(ADMIN_AUTH_COOKIE)?.value);
    const response = NextResponse.json({ success: true });
    clearAdminSessionCookie(response);
    return response;
  } catch {
    return NextResponse.json({ error: "Could not sign out" }, { status: 500 });
  }
}
