import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
