"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Pie,
  PieChart,
  Rectangle,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
  type PieSectorShapeProps,
} from "recharts";
import {
  analyticsChartPalette,
  buildTrafficSeries,
  countByField,
  countByUtmSource,
  hasChartData,
} from "@/lib/analyticsCharts";
import { periodLabel, type TimePeriod } from "@/lib/analyticsStats";
import type { AnalyticsRecord } from "@/lib/analyticsTypes";
import AdminIcon from "@/components/admin/AdminIcon";

type AnalyticsChartsProps = {
  pageVisits: AnalyticsRecord[];
  cvDownloads: AnalyticsRecord[];
  activeRecords: AnalyticsRecord[];
  period: TimePeriod;
  sourceLabel: string;
  loading?: boolean;
};

type TooltipPayload = {
  color?: string;
  name?: string;
  value?: number;
};

function coloredBarShape(props: BarShapeProps) {
  return (
    <Rectangle
      {...props}
      fill={
        analyticsChartPalette[props.index % analyticsChartPalette.length]
      }
      radius={[0, 8, 8, 0]}
    />
  );
}

function coloredPieShape(colorOffset = 0) {
  return function ColoredPieSector(props: PieSectorShapeProps) {
    return (
      <Sector
        {...props}
        fill={
          analyticsChartPalette[
            (props.index + colorOffset) % analyticsChartPalette.length
          ]
        }
      />
    );
  };
}

function ChartShell({
  title,
  subtitle,
  children,
  emptyMessage,
  isEmpty,
  loading,
  feature = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  emptyMessage: string;
  isEmpty: boolean;
  loading?: boolean;
  feature?: boolean;
}) {
  return (
    <motion.div
      className={`analytics-chart-card flex flex-col rounded-2xl border border-ink-black/10 bg-lifted-cream p-5 md:p-6 ${feature ? "is-feature" : ""} ${isEmpty && !loading ? "is-empty" : ""}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-4">
        <h2 className="text-sm font-medium tracking-[-0.01em] text-ink-black md:text-base">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-xs text-granite">{subtitle}</p>
        ) : null}
      </div>

      <div className="analytics-chart-content min-h-[220px] flex-1">
        {loading ? (
          <div className="analytics-chart-skeleton" role="status" aria-label={`Loading ${title}`}>
            <span className="admin-skeleton admin-skeleton-chart" />
            <span className="admin-skeleton admin-skeleton-chart-line" />
            <span className="admin-skeleton admin-skeleton-chart-line is-short" />
          </div>
        ) : isEmpty ? (
          <div className="analytics-chart-empty" role="status">
            <span className="analytics-chart-empty-icon"><AdminIcon name="chart" size={17} /></span>
            <p>{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-ink-black/10 bg-lifted-cream px-3 py-2 shadow-[0_12px_32px_-12px_rgba(20,20,19,0.25)]">
      {label ? (
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.06em] text-slate-gray">
          {label}
        </p>
      ) : null}
      <div className="space-y-1">
        {payload.map((entry) => (
          <p
            key={`${entry.name}-${entry.value}`}
            className="text-sm font-medium text-ink-black"
          >
            <span
              className="mr-2 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}: {Number(entry.value ?? 0).toLocaleString()}
          </p>
        ))}
      </div>
    </div>
  );
}

function DonutCenterLabel({
  viewBox,
  total,
}: {
  viewBox?: { cx?: number; cy?: number } | Record<string, number>;
  total: number;
}) {
  const cx =
    viewBox && "cx" in viewBox ? viewBox.cx : undefined;
  const cy =
    viewBox && "cy" in viewBox ? viewBox.cy : undefined;
  if (cx === undefined || cy === undefined) return null;

  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan
        x={cx}
        y={cy - 4}
        fill="var(--admin-ink)"
        style={{ fontSize: 22, fontWeight: 500 }}
      >
        {total.toLocaleString()}
      </tspan>
      <tspan
        x={cx}
        y={cy + 18}
        fill="var(--admin-muted)"
        style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" }}
      >
        TOTAL
      </tspan>
    </text>
  );
}

export default function AnalyticsCharts({
  pageVisits,
  cvDownloads,
  activeRecords,
  period,
  sourceLabel,
  loading,
}: AnalyticsChartsProps) {
  const trafficSeries = useMemo(
    () => buildTrafficSeries(pageVisits, cvDownloads, period),
    [pageVisits, cvDownloads, period],
  );

  const countries = useMemo(
    () => countByField(activeRecords, "country", 6),
    [activeRecords],
  );
  const utmSources = useMemo(
    () => countByUtmSource(activeRecords, 5),
    [activeRecords],
  );
  const devices = useMemo(
    () => countByField(activeRecords, "deviceType", 4),
    [activeRecords],
  );

  const utmTotal = useMemo(
    () => utmSources.reduce((sum, item) => sum + item.value, 0),
    [utmSources],
  );
  const deviceTotal = useMemo(
    () => devices.reduce((sum, item) => sum + item.value, 0),
    [devices],
  );

  const periodText = periodLabel(period).toLowerCase();

  return (
    <section className="analytics-chart-grid grid shrink-0 gap-4 px-6 pb-6 md:px-10 lg:grid-cols-3">
      <ChartShell
        title="Traffic trend"
        subtitle={`Page visits and CV downloads · ${periodText}`}
        emptyMessage={`No traffic recorded for ${periodText}.`}
        isEmpty={!hasChartData(trafficSeries)}
        loading={loading}
        feature
      >
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={trafficSeries}
            margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4774d9" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#4774d9" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="downloadsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#36a5a0" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#36a5a0" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="var(--admin-ink)"
              strokeOpacity={0.08}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--admin-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--admin-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="visits"
              name="Visits"
              stroke="#4774d9"
              strokeWidth={2.5}
              fill="url(#visitsFill)"
              dot={false}
              activeDot={{ r: 4, fill: "#4774d9", stroke: "#fff", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="downloads"
              name="CV downloads"
              stroke="#36a5a0"
              strokeWidth={2}
              fill="url(#downloadsFill)"
              dot={false}
              activeDot={{ r: 4, fill: "#36a5a0", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="Top countries"
        subtitle={`${sourceLabel} · ${periodText}`}
        emptyMessage={`No country data for ${periodText}.`}
        isEmpty={!hasChartData(countries)}
        loading={loading}
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={countries}
            layout="vertical"
            margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
          >
            <CartesianGrid
              stroke="var(--admin-ink)"
              strokeOpacity={0.06}
              horizontal={false}
            />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: "var(--admin-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={88}
              tick={{ fill: "var(--admin-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(20,20,19,0.04)" }} />
            <Bar
              dataKey="value"
              name="Events"
              barSize={18}
              shape={coloredBarShape}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="UTM sources"
        subtitle={`Share of ${sourceLabel.toLowerCase()} · ${periodText}`}
        emptyMessage={`No UTM data for ${periodText}.`}
        isEmpty={!hasChartData(utmSources)}
        loading={loading}
      >
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={utmSources}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={3}
              stroke="none"
              shape={coloredPieShape()}
            >
              <Label
                content={(props) => (
                  <DonutCenterLabel {...props} total={utmTotal} />
                )}
                position="center"
              />
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {utmSources.map((entry, index) => (
            <LegendItem
              key={entry.name}
              color={analyticsChartPalette[index % analyticsChartPalette.length]}
              label={entry.name}
              value={entry.value}
            />
          ))}
        </div>
      </ChartShell>

      <ChartShell
        title="Devices"
        subtitle={`Share of ${sourceLabel.toLowerCase()} · ${periodText}`}
        emptyMessage={`No device data for ${periodText}.`}
        isEmpty={!hasChartData(devices)}
        loading={loading}
      >
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={devices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={4}
              stroke="none"
              shape={coloredPieShape(2)}
            >
              <Label
                content={(props) => (
                  <DonutCenterLabel {...props} total={deviceTotal} />
                )}
                position="center"
              />
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {devices.map((entry, index) => (
            <LegendItem
              key={entry.name}
              color={
                analyticsChartPalette[(index + 2) % analyticsChartPalette.length]
              }
              label={entry.name}
              value={entry.value}
            />
          ))}
        </div>
      </ChartShell>
    </section>
  );
}

function LegendItem({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="inline-flex items-center gap-2 text-xs text-granite">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="font-medium text-ink-black">{label}</span>
      <span className="tabular-nums">{value.toLocaleString()}</span>
    </div>
  );
}
