import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { isLocalAnalyticsRequest } from "@/lib/localAnalytics";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (isLocalAnalyticsRequest(req, body.referrer)) return NextResponse.json({ success: true, ignored: true });
    const userAgent = req.headers.get("user-agent") || "unknown";

    const forwardedFor = req.headers.get("x-forwarded-for");

    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";

    const country = req.headers.get("x-vercel-ip-country") || "unknown";

    const city = req.headers.get("x-vercel-ip-city") || "unknown";

    let deviceType = "desktop";

    if (/mobile/i.test(userAgent)) {
      deviceType = "mobile";
    }

    if (/tablet/i.test(userAgent)) {
      deviceType = "tablet";
    }

    await db.collection("page_visits").add({
      ip,
      country,
      city,

      browser: body.browser,
      os: body.os,
      timezone: body.timezone,
      language: body.language,
      utmSource: body.utmSource,

      deviceType,
      path: typeof body.path === "string" ? body.path.slice(0, 200) : "/",
      referrer: typeof body.referrer === "string" ? body.referrer.slice(0, 300) : "direct",
      sessionId: typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : null,
      userAgent,

      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
