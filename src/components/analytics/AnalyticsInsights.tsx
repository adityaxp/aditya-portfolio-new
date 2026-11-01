"use client";

import { useMemo } from "react";
import { isInPeriod, type TimePeriod } from "@/lib/analyticsStats";
import type { AnalyticsRecord, EngagementEvent } from "@/lib/analyticsTypes";

type HostedMetric = { id: string; title: string; downloads: number };

function ranked(values: Array<string | null | undefined>, limit = 4) {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const value = raw?.trim();
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export default function AnalyticsInsights({ visits, downloads, events, hosted, period }: { visits: AnalyticsRecord[]; downloads: AnalyticsRecord[]; events: EngagementEvent[]; hosted: HostedMetric[]; period: TimePeriod }) {
  const data = useMemo(() => {
    const v = visits.filter((row) => isInPeriod(row.timestamp, period));
    const d = downloads.filter((row) => isInPeriod(row.timestamp, period));
    const e = events.filter((row) => isInPeriod(row.timestamp, period));
    const sessionVisits = new Map<string, number>();
    for (const row of v) if (row.sessionId) sessionVisits.set(row.sessionId, (sessionVisits.get(row.sessionId) ?? 0) + 1);
    const engaged = new Set(e.filter((row) => row.type === "scroll" || row.type === "project_open" || row.type === "outbound_click" || (row.type === "engagement" && (row.durationMs ?? 0) >= 10_000)).map((row) => row.sessionId));
    const bounced = [...sessionVisits].filter(([id, count]) => count === 1 && !engaged.has(id)).length;
    const durationBySession = new Map<string, number>();
    for (const row of e) if (row.type === "engagement" && row.durationMs) durationBySession.set(row.sessionId, (durationBySession.get(row.sessionId) ?? 0) + row.durationMs);
    const hours = Array(24).fill(0) as number[];
    for (const row of v) if (row.timestamp) hours[new Date(row.timestamp).getHours()] += 1;
    const peak = Math.max(...hours);
    const sources = [...new Set([...v.map((x) => x.utmSource), ...d.map((x) => x.utmSource)])].filter(Boolean).map((name) => ({ name, visits: v.filter((x) => x.utmSource === name).length, downloads: d.filter((x) => x.utmSource === name).length })).sort((a, b) => b.visits - a.visits).slice(0, 4);
    return {
      yield: v.length ? (d.length / v.length * 100).toFixed(1) : "—",
      peakHour: peak ? `${String(hours.indexOf(peak)).padStart(2, "0")}:00` : "—",
      sessions: sessionVisits.size,
      bounce: sessionVisits.size ? `${Math.round(bounced / sessionVisits.size * 100)}%` : "—",
      scroll: sessionVisits.size ? `${Math.round(new Set(e.filter((x) => x.type === "scroll").map((x) => x.sessionId)).size / sessionVisits.size * 100)}%` : "—",
      averageTime: durationBySession.size ? `${Math.round([...durationBySession.values()].reduce((a, b) => a + b, 0) / durationBySession.size / 1000)}s` : "—",
      projects: e.filter((x) => x.type === "project_open").length,
      outbound: e.filter((x) => x.type === "outbound_click").length,
      sources,
      pages: ranked(v.map((x) => x.path)),
      referrers: ranked(v.map((x) => x.referrer)),
      projectNames: ranked(e.filter((x) => x.type === "project_open").map((x) => x.target)),
      outboundNames: ranked(e.filter((x) => x.type === "outbound_click").map((x) => x.target)),
      cities: ranked(v.map((x) => x.city).filter((x) => x && x !== "unknown" && x !== "—")),
    };
  }, [visits, downloads, events, period]);

  const hostedTop = [...hosted].sort((a, b) => b.downloads - a.downloads).slice(0, 4);
  const tiles = [
    ["CV downloads / 100 views", data.yield === "—" ? "—" : data.yield, "Event ratio"],
    ["Busiest hour", data.peakHour, "Local browser time"],
    ["Tracked sessions", data.sessions ? String(data.sessions) : "—", "New visits only"],
    ["Estimated bounce", data.bounce, "Tracked sessions only"],
    ["Reached halfway", data.scroll, "Tracked sessions only"],
    ["Avg. recorded time", data.averageTime, "When tab closes"],
    ["Project opens", String(data.projects), "Card interactions"],
    ["Outbound clicks", String(data.outbound), "External links"],
  ];
  return <section className="analytics-insights mx-6 mb-6 md:mx-10">
    <details className="analytics-insights-disclosure">
      <summary><span className="analytics-insights-view">View more insights</span><span className="analytics-insights-hide">Hide insights</span></summary>
      <div className="analytics-insights-body">
        <p className="analytics-insights-note">Selected period, unless marked all time</p>
        <div className="analytics-insight-metrics">{tiles.map(([label, value, hint]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>)}</div>
        <div className="analytics-breakdowns">
          <InsightList title="Top pages" rows={data.pages} />
          <InsightList title="Referrers" rows={data.referrers} />
          <InsightList title="Project opens" rows={data.projectNames} />
          <InsightList title="Outbound links" rows={data.outboundNames} />
          <InsightList title="Top cities" rows={data.cities} />
          <InsightList title="Hosted downloads · all time" rows={hostedTop.map((x) => [x.title, x.downloads])} />
          <div className="analytics-breakdown"><h3>UTM performance</h3>{data.sources.length ? data.sources.map((x) => <div className="analytics-breakdown-row" key={x.name}><span title={x.name}>{x.name}</span><strong>{x.visits} views · {x.downloads} CV</strong></div>) : <p>Waiting for data</p>}</div>
        </div>
      </div>
    </details>
  </section>;
}

function InsightList({ title, rows }: { title: string; rows: [string, number][] }) {
  return <div className="analytics-breakdown"><h3>{title}</h3>{rows.length ? rows.map(([name, count]) => <div className="analytics-breakdown-row" key={name}><span title={name}>{name}</span><strong>{count.toLocaleString()}</strong></div>) : <p>Waiting for data</p>}</div>;
}
