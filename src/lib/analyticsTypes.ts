export type AnalyticsRecord = {
  id: string;
  ip: string;
  country: string;
  city: string;
  browser: string;
  os: string;
  timezone: string;
  language: string;
  utmSource: string;
  deviceType: string;
  timestamp: string | null;
};

export function formatAnalyticsDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
