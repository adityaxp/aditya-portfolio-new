import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { isLocalAnalyticsRequest } from "@/lib/localAnalytics";

const types = new Set(["project_open", "outbound_click", "scroll", "engagement"]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (isLocalAnalyticsRequest(req, body.referrer)) return NextResponse.json({ success: true, ignored: true });
    if (!types.has(body.type) || typeof body.sessionId !== "string" || !/^[\w-]{16,64}$/.test(body.sessionId)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }
    const origin = req.headers.get("origin");
    if (origin && new URL(origin).host !== req.headers.get("host")) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
    await db.collection("portfolio_events").add({
      type: body.type,
      sessionId: body.sessionId,
      target: typeof body.target === "string" ? body.target.slice(0, 300) : null,
      path: typeof body.path === "string" ? body.path.slice(0, 200) : "/",
      durationMs: typeof body.durationMs === "number" && Number.isFinite(body.durationMs) ? Math.max(0, Math.min(body.durationMs, 86_400_000)) : null,
      timestamp: new Date(),
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not record event" }, { status: 500 });
  }
}
