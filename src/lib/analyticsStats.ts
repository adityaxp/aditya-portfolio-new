import type { AnalyticsRecord } from "@/lib/analyticsTypes";

export type TimePeriod = "all" | "today" | "week";

export type AnalyticsSummary = {
  visitorsThisWeek: number;
  visitsThisWeek: number;
  cvDownloadsThisWeek: number;
  uniqueVisitorsAllTime: number;
  totalVisitsAllTime: number;
  totalCvDownloadsAllTime: number;
};

function parseRecordDate(iso: string | null): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Week starts Monday (local time). */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function isInPeriod(iso: string | null, period: TimePeriod): boolean {
  if (period === "all") return true;

  const date = parseRecordDate(iso);
  if (!date) return false;

  const now = new Date();

  if (period === "today") {
    return date >= startOfDay(now);
  }

  return date >= startOfWeek(now);
}

export function filterRecordsByPeriod(
  records: AnalyticsRecord[],
  period: TimePeriod,
): AnalyticsRecord[] {
  return records.filter((r) => isInPeriod(r.timestamp, period));
}

export function countUniqueVisitors(records: AnalyticsRecord[]): number {
  const ips = new Set<string>();
  for (const record of records) {
    const ip = record.ip?.trim();
    if (ip && ip !== "—" && ip !== "unknown") {
      ips.add(ip);
    }
  }
  return ips.size;
}

export function computeSummary(
  pageVisits: AnalyticsRecord[],
  cvDownloads: AnalyticsRecord[],
): AnalyticsSummary {
  const weekVisits = filterRecordsByPeriod(pageVisits, "week");
  const weekDownloads = filterRecordsByPeriod(cvDownloads, "week");

  return {
    visitorsThisWeek: countUniqueVisitors(weekVisits),
    visitsThisWeek: weekVisits.length,
    cvDownloadsThisWeek: weekDownloads.length,
    uniqueVisitorsAllTime: countUniqueVisitors(pageVisits),
    totalVisitsAllTime: pageVisits.length,
    totalCvDownloadsAllTime: cvDownloads.length,
  };
}

export function periodLabel(period: TimePeriod): string {
  switch (period) {
    case "today":
      return "Today";
    case "week":
      return "This week";
    default:
      return "All time";
  }
}
