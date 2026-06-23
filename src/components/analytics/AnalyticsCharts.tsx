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
  hasChartData,
} from "@/lib/analyticsCharts";
import { periodLabel, type TimePeriod } from "@/lib/analyticsStats";
import type { AnalyticsRecord } from "@/lib/analyticsTypes";

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
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  emptyMessage: string;
  isEmpty: boolean;
  loading?: boolean;
}) {
  return (
    <motion.div
      className="flex min-h-[280px] flex-col rounded-xl border border-ink-black/10 bg-lifted-cream p-4 md:p-5"
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

      <div className="min-h-[220px] flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-granite">Loading charts…</p>
          </div>
        ) : isEmpty ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-ink-black/10 bg-canvas-cream/60 px-4">
            <p className="text-center text-sm text-granite">{emptyMessage}</p>
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
        fill="#141413"
        style={{ fontSize: 22, fontWeight: 500 }}
      >
        {total.toLocaleString()}
      </tspan>
      <tspan
        x={cx}
        y={cy + 18}
        fill="#696969"
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
  const browsers = useMemo(
    () => countByField(activeRecords, "browser", 5),
    [activeRecords],
  );
  const devices = useMemo(
    () => countByField(activeRecords, "deviceType", 4),
    [activeRecords],
  );

  const browserTotal = useMemo(
    () => browsers.reduce((sum, item) => sum + item.value, 0),
    [browsers],
  );
  const deviceTotal = useMemo(
    () => devices.reduce((sum, item) => sum + item.value, 0),
    [devices],
  );

  const periodText = periodLabel(period).toLowerCase();

  return (
    <section className="grid shrink-0 gap-4 border-b border-ink-black/10 bg-canvas-cream/50 px-4 py-5 md:px-10 md:py-6 lg:grid-cols-2">
      <ChartShell
        title="Traffic over time"
        subtitle={`Page visits and CV downloads · ${periodText}`}
        emptyMessage={`No traffic recorded for ${periodText}.`}
        isEmpty={!hasChartData(trafficSeries)}
        loading={loading}
      >
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={trafficSeries}
            margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F37338" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#F37338" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="downloadsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#141413" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#141413" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="#141413"
              strokeOpacity={0.06}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "#696969", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#696969", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="visits"
              name="Visits"
              stroke="#F37338"
              strokeWidth={2.5}
              fill="url(#visitsFill)"
              dot={false}
              activeDot={{ r: 4, fill: "#F37338", stroke: "#fff", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="downloads"
              name="CV downloads"
              stroke="#141413"
              strokeWidth={2}
              fill="url(#downloadsFill)"
              dot={false}
              activeDot={{ r: 4, fill: "#141413", stroke: "#fff", strokeWidth: 2 }}
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
              stroke="#141413"
              strokeOpacity={0.06}
              horizontal={false}
            />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: "#696969", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={88}
              tick={{ fill: "#555555", fontSize: 11 }}
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
        title="Browsers"
        subtitle={`Share of ${sourceLabel.toLowerCase()} · ${periodText}`}
        emptyMessage={`No browser data for ${periodText}.`}
        isEmpty={!hasChartData(browsers)}
        loading={loading}
      >
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={browsers}
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
                  <DonutCenterLabel {...props} total={browserTotal} />
                )}
                position="center"
              />
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {browsers.map((entry, index) => (
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
