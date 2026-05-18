"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  computeSummary,
  filterRecordsByPeriod,
  periodLabel,
  type TimePeriod,
} from "@/lib/analyticsStats";
import {
  formatAnalyticsDate,
  type AnalyticsRecord,
} from "@/lib/analyticsTypes";

type DataSource = "page-visits" | "cv-downloads";

const TABLE_COLUMNS: { key: keyof AnalyticsRecord; label: string }[] = [
  { key: "timestamp", label: "Date" },
  { key: "ip", label: "IP" },
  { key: "country", label: "Country" },
  { key: "city", label: "City" },
  { key: "browser", label: "Browser" },
  { key: "os", label: "OS" },
  { key: "deviceType", label: "Device" },
  { key: "language", label: "Language" },
  { key: "utmSource", label: "UTM" },
];

const PERIOD_OPTIONS: TimePeriod[] = ["today", "week", "all"];

type AnalyticsDashboardProps = {
  initialSource?: DataSource;
};

export default function AnalyticsDashboard({
  initialSource = "page-visits",
}: AnalyticsDashboardProps) {
  const [source, setSource] = useState<DataSource>(initialSource);
  const [period, setPeriod] = useState<TimePeriod>("today");
  const [pageVisits, setPageVisits] = useState<AnalyticsRecord[]>([]);
  const [cvDownloads, setCvDownloads] = useState<AnalyticsRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [visitsRes, downloadsRes] = await Promise.all([
        fetch("/api/analytics/page-visits", { credentials: "include" }),
        fetch("/api/analytics/cv-downloads", { credentials: "include" }),
      ]);

      if (visitsRes.status === 401 || downloadsRes.status === 401) {
        window.location.reload();
        return;
      }

      if (!visitsRes.ok || !downloadsRes.ok) {
        throw new Error("Failed to load data");
      }

      const visitsData = (await visitsRes.json()) as {
        records: AnalyticsRecord[];
      };
      const downloadsData = (await downloadsRes.json()) as {
        records: AnalyticsRecord[];
      };

      setPageVisits(visitsData.records ?? []);
      setCvDownloads(downloadsData.records ?? []);
    } catch {
      setError("Could not load analytics. Please refresh.");
      setPageVisits([]);
      setCvDownloads([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const summary = useMemo(
    () => computeSummary(pageVisits, cvDownloads),
    [pageVisits, cvDownloads],
  );

  const activeRecords = source === "page-visits" ? pageVisits : cvDownloads;

  const filteredRecords = useMemo(
    () => filterRecordsByPeriod(activeRecords, period),
    [activeRecords, period],
  );

  const renderCell = (record: AnalyticsRecord, key: keyof AnalyticsRecord) => {
    if (key === "timestamp") {
      return formatAnalyticsDate(record.timestamp);
    }
    if (key === "id") return record.id;
    return String(record[key] ?? "—");
  };

  return (
    <motion.div
      className="flex min-h-svh w-full flex-col bg-lifted-cream"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className="shrink-0 border-b border-ink-black/10 px-6 py-5 md:px-10 md:py-6">
        <h1 className="text-2xl font-medium tracking-[-0.02em] text-ink-black md:text-3xl">
          Portfolio Analytics
        </h1>
      </header>

      {/* Stats */}
      <div className="grid shrink-0 gap-3 border-b border-ink-black/10 bg-canvas-cream/40 p-4 sm:grid-cols-2 lg:grid-cols-4 md:px-10 md:py-5">
        <StatCard
          label="Visitors this week"
          value={summary.visitorsThisWeek}
          hint="Unique IPs"
          accent="orange"
          loading={isLoading}
        />
        <StatCard
          label="Visits this week"
          value={summary.visitsThisWeek}
          hint="Page visits"
          loading={isLoading}
        />
        <StatCard
          label="CV downloads this week"
          value={summary.cvDownloadsThisWeek}
          hint="Download events"
          accent="orange"
          loading={isLoading}
        />
        <StatCard
          label="All-time totals"
          value={summary.totalVisitsAllTime}
          hint={`${summary.totalCvDownloadsAllTime} CV · ${summary.uniqueVisitorsAllTime} unique`}
          loading={isLoading}
        />
      </div>

      {/* Source + period filters */}
      <div className="flex shrink-0 flex-col gap-4 border-b border-ink-black/10 bg-lifted-cream px-6 py-4 md:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold uppercase tracking-[0.06em] text-slate-gray">
            View:
          </span>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={source === "page-visits"}
              onClick={() => setSource("page-visits")}
            >
              Page Visits
            </FilterButton>
            <FilterButton
              active={source === "cv-downloads"}
              onClick={() => setSource("cv-downloads")}
            >
              CV Downloads
            </FilterButton>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold uppercase tracking-[0.06em] text-slate-gray">
            Period:
          </span>
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <FilterButton
                key={option}
                active={period === option}
                onClick={() => setPeriod(option)}
              >
                {periodLabel(option)}
              </FilterButton>
            ))}
          </div>
          <span className="text-sm text-slate-gray md:ml-auto">
            {isLoading
              ? "Loading…"
              : `${filteredRecords.length} row${filteredRecords.length === 1 ? "" : "s"}`}
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-canvas-cream/50 p-4 md:p-6 lg:px-10">
        {error ? (
          <p className="py-12 text-center text-sm font-medium text-signal-orange">
            {error}
          </p>
        ) : isLoading ? (
          <p className="py-12 text-center text-sm text-granite">
            Loading data…
          </p>
        ) : filteredRecords.length === 0 ? (
          <p className="py-12 text-center text-sm text-granite">
            No {source === "page-visits" ? "page visits" : "CV downloads"} for{" "}
            {periodLabel(period).toLowerCase()}.
          </p>
        ) : (
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ink-black/10">
                {TABLE_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-3 text-xs font-bold uppercase tracking-[0.06em] text-slate-gray"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-ink-black/[0.06] transition-colors hover:bg-lifted-cream"
                >
                  {TABLE_COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className="max-w-[12rem] truncate px-3 py-3 text-granite"
                      title={String(renderCell(record, col.key))}
                    >
                      {renderCell(record, col.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
  loading,
}: {
  label: string;
  value: number;
  hint: string;
  accent?: "orange";
  loading?: boolean;
}) {
  return (
    <motion.div
      className={`rounded-xl border p-4 ${
        accent === "orange"
          ? "border-light-orange/30 bg-gradient-to-br from-lifted-cream to-[#fff4ee]"
          : "border-ink-black/10 bg-lifted-cream"
      }`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.06em] text-slate-gray">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-medium tabular-nums tracking-[-0.02em] ${
          accent === "orange" ? "text-signal-orange" : "text-ink-black"
        }`}
      >
        {loading ? "—" : value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-granite">{hint}</p>
    </motion.div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-ink-black bg-ink-black text-canvas-cream"
          : "border-ink-black/15 bg-lifted-cream text-ink-black hover:border-ink-black/30"
      }`}
    >
      {children}
    </button>
  );
}
