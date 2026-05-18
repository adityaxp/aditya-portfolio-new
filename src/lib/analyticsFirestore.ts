import type { Timestamp } from "firebase-admin/firestore";
import type { AnalyticsRecord } from "@/lib/analyticsTypes";

type FirestoreAnalyticsDoc = {
  ip?: string;
  country?: string;
  city?: string;
  browser?: string;
  os?: string;
  timezone?: string;
  language?: string;
  utmSource?: string;
  deviceType?: string;
  userAgent?: string;
  timestamp?: Timestamp | Date;
};

function toIsoString(value: Timestamp | Date | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof (value as Timestamp).toDate === "function") {
    return (value as Timestamp).toDate().toISOString();
  }
  return null;
}

export function mapAnalyticsDoc(
  id: string,
  data: FirestoreAnalyticsDoc,
): AnalyticsRecord {
  return {
    id,
    ip: data.ip ?? "—",
    country: data.country ?? "—",
    city: data.city ?? "—",
    browser: data.browser ?? "—",
    os: data.os ?? "—",
    timezone: data.timezone ?? "—",
    language: data.language ?? "—",
    utmSource: data.utmSource ?? "—",
    deviceType: data.deviceType ?? "—",
    timestamp: toIsoString(data.timestamp),
  };
}
