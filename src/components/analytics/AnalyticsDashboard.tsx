"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  computeSummary,
  countUniqueVisitors,
  filterRecordsByPeriod,
  periodLabel,
  type TimePeriod,
} from "@/lib/analyticsStats";
import {
  formatAnalyticsDate,
  type AnalyticsRecord,
  type EngagementEvent,
} from "@/lib/analyticsTypes";
import AnalyticsCharts from "@/components/analytics/AnalyticsCharts";
import AnalyticsInsights from "@/components/analytics/AnalyticsInsights";
import { isLocalAnalyticsRecord } from "@/lib/localAnalytics";

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
  const [events, setEvents] = useState<EngagementEvent[]>([]);
  const [hosted, setHosted] = useState<{ id: string; title: string; downloads: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/analytics/page-visits", { credentials: "include" }),
      fetch("/api/analytics/cv-downloads", { credentials: "include" }),
      fetch("/api/analytics/extra", { credentials: "include" }),
    ])
      .then(async ([visitsRes, downloadsRes, extraRes]) => {
        if (visitsRes.status === 401 || downloadsRes.status === 401 || extraRes.status === 401) {
          window.dispatchEvent(new Event("admin-session-required"));
          return null;
        }
        if (!visitsRes.ok || !downloadsRes.ok || !extraRes.ok) throw new Error("Failed to load data");
        return Promise.all([
          visitsRes.json() as Promise<{ records: AnalyticsRecord[] }>,
          downloadsRes.json() as Promise<{ records: AnalyticsRecord[] }>,
          extraRes.json() as Promise<{ events: EngagementEvent[]; hosted: { id: string; title: string; downloads: number }[] }>,
        ]);
      })
      .then((data) => {
        if (!active || !data) return;
        const visits = data[0].records ?? [];
        const downloads = data[1].records ?? [];
        const localSessions = new Set([...visits, ...downloads].filter(isLocalAnalyticsRecord).map((row) => row.sessionId).filter(Boolean));
        setPageVisits(visits.filter((row) => !isLocalAnalyticsRecord(row)));
        setCvDownloads(downloads.filter((row) => !isLocalAnalyticsRecord(row)));
        setEvents((data[2].events ?? []).filter((row) => !localSessions.has(row.sessionId)));
        setHosted(data[2].hosted ?? []);
      })
      .catch(() => {
        if (!active) return;
        setError("Could not load analytics. Please refresh.");
        setPageVisits([]);
        setCvDownloads([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(
    () => computeSummary(pageVisits, cvDownloads),
    [pageVisits, cvDownloads],
  );

  const activeRecords = source === "page-visits" ? pageVisits : cvDownloads;

  const filteredRecords = useMemo(
    () => filterRecordsByPeriod(activeRecords, period),
    [activeRecords, period],
  );

  const periodVisits = useMemo(() => filterRecordsByPeriod(pageVisits, period), [pageVisits, period]);
  const periodDownloads = useMemo(() => filterRecordsByPeriod(cvDownloads, period), [cvDownloads, period]);

  const renderCell = (record: AnalyticsRecord, key: keyof AnalyticsRecord) => {
    if (key === "timestamp") {
      return formatAnalyticsDate(record.timestamp);
    }
    if (key === "id") return record.id;
    return String(record[key] ?? "—");
  };

  return (
    <motion.div
      className="analytics-dashboard flex min-h-[calc(100svh-72px)] w-full flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="analytics-header px-6 pt-9 md:px-10 md:pt-12">
        <div>
          <h1 className="admin-page-heading">Portfolio analytics</h1>
        </div>
        <div className="analytics-period-control" role="group" aria-label="Time period">
          {PERIOD_OPTIONS.map((option) => (
            <FilterButton key={option} active={period === option} onClick={() => setPeriod(option)}>
              {periodLabel(option)}
            </FilterButton>
          ))}
        </div>
      </div>

      <div className="analytics-summary-panel mx-6 mt-8 md:mx-10">
        <StatCard
          label="Unique visitors"
          value={countUniqueVisitors(periodVisits)}
          hint="Unique IPs"
          accent="orange"
          loading={isLoading}
        />
        <StatCard
          label="Page views"
          value={periodVisits.length}
          hint="Page visits"
          loading={isLoading}
        />
        <StatCard
          label="CV downloads"
          value={periodDownloads.length}
          hint="Download events"
          accent="orange"
          loading={isLoading}
        />
        <StatCard
          label="All-time views"
          value={summary.totalVisitsAllTime}
          hint={`${summary.totalCvDownloadsAllTime} CV · ${summary.uniqueVisitorsAllTime} unique`}
          loading={isLoading}
        />
      </div>

      <div className="analytics-view-row mx-6 mt-8 mb-4 md:mx-10">
        <div>
          <h2>Explore traffic</h2>
          <p>{periodLabel(period)} · your portfolio at a glance</p>
        </div>
        <div className="analytics-view-switch" role="group" aria-label="Data source">
            <FilterButton
              active={source === "page-visits"}
              onClick={() => setSource("page-visits")}
            >
              Page views
            </FilterButton>
            <FilterButton
              active={source === "cv-downloads"}
              onClick={() => setSource("cv-downloads")}
            >
              CV downloads
            </FilterButton>
        </div>
      </div>

      <AnalyticsCharts
        pageVisits={pageVisits}
        cvDownloads={cvDownloads}
        activeRecords={filteredRecords}
        period={period}
        sourceLabel={source === "page-visits" ? "Page visits" : "CV downloads"}
        loading={isLoading}
      />

      {!isLoading && !error ? <AnalyticsInsights visits={pageVisits} downloads={cvDownloads} events={events} hosted={hosted} period={period} /> : null}

      <div className="admin-panel analytics-activity mx-6 mb-10 flex min-h-0 flex-1 flex-col p-4 md:mx-10 md:p-6">
        <div className="analytics-activity-heading">
          <div><h2>Recent activity</h2><p>{source === "page-visits" ? "Page views" : "CV downloads"} · {periodLabel(period).toLowerCase()}</p></div>
          <span>{isLoading ? <span className="admin-skeleton admin-skeleton-count" aria-label="Loading activity" /> : `${filteredRecords.length} events`}</span>
        </div>
        <div className="analytics-activity-scroll">
        {error ? (
          <p className="admin-danger py-12 text-center text-sm font-medium">
            {error}
          </p>
        ) : isLoading ? (
          <div className="analytics-table-skeleton" role="status" aria-label="Loading activity">
            {Array.from({ length: 6 }, (_, index) => <div className="admin-skeleton-row" key={index}><span className="admin-skeleton admin-skeleton-name" /><span className="admin-skeleton admin-skeleton-meta" /><span className="admin-skeleton admin-skeleton-meta" /></div>)}
          </div>
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
                  className="analytics-table-row border-b border-ink-black/[0.06] transition-colors"
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
      className={`analytics-stat ${
        accent === "orange"
          ? "admin-stat-accent bg-gradient-to-br from-[#f0edff] to-white"
          : "border-ink-black/10 bg-lifted-cream"
      }`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.06em] text-slate-gray">
        {label}
      </p>
      <p
        className={`mt-4 text-4xl font-semibold tabular-nums tracking-[-0.04em] ${
          accent === "orange" ? "text-signal-orange" : "text-ink-black"
        }`}
      >
        {loading ? <span className="admin-skeleton admin-skeleton-value" aria-label={`Loading ${label}`} /> : value.toLocaleString()}
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
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "admin-filter-active text-white"
          : "border-ink-black/15 bg-lifted-cream text-ink-black hover:border-ink-black/30"
      }`}
    >
      {children}
    </button>
  );
}
