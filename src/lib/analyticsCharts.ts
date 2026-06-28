import type { AnalyticsRecord } from "@/lib/analyticsTypes";
import {
  filterRecordsByPeriod,
  startOfWeek,
  type TimePeriod,
} from "@/lib/analyticsStats";

export type TrafficPoint = {
  label: string;
  visits: number;
  downloads: number;
};

export type CategoryPoint = {
  name: string;
  value: number;
};

export const analyticsChartPalette = [
  "#F37338",
  "#CF4500",
  "#141413",
  "#696969",
  "#3860BE",
  "#9A3A0A",
  "#D1CDC7",
  "#555555",
] as const;

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

function dayKey(date: Date): number {
  return startOfDay(date).getTime();
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

function weekBucketKey(date: Date): number {
  return startOfWeek(date).getTime();
}

export function countByField(
  records: AnalyticsRecord[],
  field: keyof AnalyticsRecord,
  limit = 6,
): CategoryPoint[] {
  const counts = new Map<string, number>();

  for (const record of records) {
    const raw = String(record[field] ?? "").trim();
    const name =
      raw && raw !== "—" && raw !== "unknown" && raw !== "Unknown"
        ? raw
        : "Unknown";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));
}

export function countByUtmSource(
  records: AnalyticsRecord[],
  limit = 6,
): CategoryPoint[] {
  const counts = new Map<string, number>();

  for (const record of records) {
    const raw = String(record.utmSource ?? "").trim();
    const name =
      raw && raw !== "—" && raw !== "unknown" && raw !== "Unknown"
        ? raw
        : "direct";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));
}

function incrementTraffic(
  map: Map<number, TrafficPoint>,
  key: number,
  label: string,
  field: "visits" | "downloads",
) {
  const existing = map.get(key);
  if (existing) {
    existing[field] += 1;
    return;
  }
  map.set(key, { label, visits: 0, downloads: 0, [field]: 1 });
}

function sortedTrafficPoints(map: Map<number, TrafficPoint>): TrafficPoint[] {
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, point]) => point);
}

function buildTodaySeries(
  visits: AnalyticsRecord[],
  downloads: AnalyticsRecord[],
): TrafficPoint[] {
  const map = new Map<number, TrafficPoint>();

  for (let hour = 0; hour < 24; hour += 1) {
    map.set(hour, {
      label: `${hour.toString().padStart(2, "0")}:00`,
      visits: 0,
      downloads: 0,
    });
  }

  for (const record of visits) {
    const date = parseRecordDate(record.timestamp);
    if (!date) continue;
    const bucket = map.get(date.getHours());
    if (bucket) bucket.visits += 1;
  }

  for (const record of downloads) {
    const date = parseRecordDate(record.timestamp);
    if (!date) continue;
    const bucket = map.get(date.getHours());
    if (bucket) bucket.downloads += 1;
  }

  return sortedTrafficPoints(map);
}

function buildWeekSeries(
  visits: AnalyticsRecord[],
  downloads: AnalyticsRecord[],
): TrafficPoint[] {
  const weekStart = startOfWeek(new Date());
  const map = new Map<number, TrafficPoint>();

  for (let index = 0; index < 7; index += 1) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    const key = dayKey(day);
    map.set(key, {
      label: day.toLocaleDateString("en-IN", { weekday: "short" }),
      visits: 0,
      downloads: 0,
    });
  }

  for (const record of visits) {
    const date = parseRecordDate(record.timestamp);
    if (!date) continue;
    const key = dayKey(date);
    const bucket = map.get(key);
    if (bucket) bucket.visits += 1;
  }

  for (const record of downloads) {
    const date = parseRecordDate(record.timestamp);
    if (!date) continue;
    const key = dayKey(date);
    const bucket = map.get(key);
    if (bucket) bucket.downloads += 1;
  }

  return sortedTrafficPoints(map);
}

function buildAllTimeSeries(
  visits: AnalyticsRecord[],
  downloads: AnalyticsRecord[],
): TrafficPoint[] {
  const dates = [...visits, ...downloads]
    .map((record) => parseRecordDate(record.timestamp))
    .filter((date): date is Date => date !== null);

  if (dates.length === 0) return [];

  const min = startOfDay(
    new Date(Math.min(...dates.map((date) => date.getTime()))),
  );
  const max = startOfDay(
    new Date(Math.max(...dates.map((date) => date.getTime()))),
  );
  const spanDays =
    Math.floor((max.getTime() - min.getTime()) / 86_400_000) + 1;

  const map = new Map<number, TrafficPoint>();

  if (spanDays <= 31) {
    for (
      let cursor = new Date(min);
      cursor <= max;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const key = dayKey(cursor);
      map.set(key, { label: formatShortDate(cursor), visits: 0, downloads: 0 });
    }

    for (const record of visits) {
      const date = parseRecordDate(record.timestamp);
      if (!date) continue;
      const bucket = map.get(dayKey(date));
      if (bucket) bucket.visits += 1;
    }

    for (const record of downloads) {
      const date = parseRecordDate(record.timestamp);
      if (!date) continue;
      const bucket = map.get(dayKey(date));
      if (bucket) bucket.downloads += 1;
    }

    return sortedTrafficPoints(map);
  }

  if (spanDays <= 120) {
    for (const record of visits) {
      const date = parseRecordDate(record.timestamp);
      if (!date) continue;
      const key = weekBucketKey(date);
      incrementTraffic(
        map,
        key,
        `Wk ${formatShortDate(startOfWeek(date))}`,
        "visits",
      );
    }

    for (const record of downloads) {
      const date = parseRecordDate(record.timestamp);
      if (!date) continue;
      const key = weekBucketKey(date);
      incrementTraffic(
        map,
        key,
        `Wk ${formatShortDate(startOfWeek(date))}`,
        "downloads",
      );
    }

    return sortedTrafficPoints(map);
  }

  for (const record of visits) {
    const date = parseRecordDate(record.timestamp);
    if (!date) continue;
    const key = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
    incrementTraffic(map, key, formatMonth(date), "visits");
  }

  for (const record of downloads) {
    const date = parseRecordDate(record.timestamp);
    if (!date) continue;
    const key = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
    incrementTraffic(map, key, formatMonth(date), "downloads");
  }

  return sortedTrafficPoints(map);
}

export function buildTrafficSeries(
  pageVisits: AnalyticsRecord[],
  cvDownloads: AnalyticsRecord[],
  period: TimePeriod,
): TrafficPoint[] {
  const visits = filterRecordsByPeriod(pageVisits, period);
  const downloads = filterRecordsByPeriod(cvDownloads, period);

  if (period === "today") return buildTodaySeries(visits, downloads);
  if (period === "week") return buildWeekSeries(visits, downloads);
  return buildAllTimeSeries(visits, downloads);
}

export function hasChartData(points: CategoryPoint[] | TrafficPoint[]): boolean {
  if (points.length === 0) return false;

  if ("visits" in points[0]) {
    return (points as TrafficPoint[]).some(
      (point) => point.visits > 0 || point.downloads > 0,
    );
  }

  return (points as CategoryPoint[]).some((point) => point.value > 0);
}
