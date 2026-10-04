import "server-only";

import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { userAgent, type NextRequest, type NextResponse } from "next/server";

const VISITOR_COOKIE = "hosted_visitor";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function recordHostedDownload(
  req: NextRequest,
  response: NextResponse,
  ref: FirebaseFirestore.DocumentReference,
  kind: "file" | "folder",
  path: string | null,
) {
  const existing = req.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = existing && /^[a-f0-9]{32}$/.test(existing)
    ? existing
    : randomBytes(16).toString("hex");
  const countryHeader = req.headers.get("x-vercel-ip-country");
  const country = countryHeader && /^[A-Z]{2}$/.test(countryHeader)
    ? countryHeader
    : null;
  const forwardedFor = req.headers.get("x-vercel-forwarded-for") ||
    req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0].trim() || null;
  const cityHeader = req.headers.get("x-vercel-ip-city");
  let city: string | null = null;
  if (cityHeader) {
    try {
      city = decodeURIComponent(cityHeader).slice(0, 120);
    } catch {
      city = cityHeader.slice(0, 120);
    }
  }
  const parsedAgent = userAgent(req);
  const deviceType = parsedAgent.device.type || "desktop";

  const batch = ref.firestore.batch();
  batch.create(ref.collection("downloads").doc(), {
    kind,
    path,
    visitorId,
    ip,
    country,
    city,
    browser: parsedAgent.browser.name || null,
    os: parsedAgent.os.name || null,
    deviceType,
    deviceModel: parsedAgent.device.model || null,
    createdAt: new Date(),
  });
  batch.update(ref, { downloadCount: FieldValue.increment(1) });
  await batch.commit();

  if (visitorId !== existing) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/hosted",
      maxAge: ONE_YEAR,
    });
  }
}
