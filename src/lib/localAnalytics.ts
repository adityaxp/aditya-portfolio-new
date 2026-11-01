import type { AnalyticsRecord } from "@/lib/analyticsTypes";
import type { NextRequest } from "next/server";

export function isLocalAnalyticsHost(value: string | null | undefined): boolean {
  if (!value) return false;
  let host = value.trim().toLowerCase();
  if (host.startsWith("[")) host = host.slice(1).split("]")[0];
  else if (!host.includes("::")) host = host.split(":")[0];

  return host === "localhost" || host.endsWith(".localhost") || host === "::1" || host === "0.0.0.0" || /^127(?:\.\d{1,3}){3}$/.test(host);
}

export function isLocalAnalyticsRecord(record: AnalyticsRecord): boolean {
  return isLocalAnalyticsHost(record.referrer) || isLocalAnalyticsHost(record.ip) || record.ip.toLowerCase().endsWith(":127.0.0.1");
}

export function isLocalAnalyticsRequest(req: NextRequest, referrer?: unknown): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return isLocalAnalyticsHost(req.nextUrl.hostname) ||
    isLocalAnalyticsHost(req.headers.get("host")) ||
    isLocalAnalyticsHost(ip) ||
    isLocalAnalyticsHost(typeof referrer === "string" ? referrer : null);
}
