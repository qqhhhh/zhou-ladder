"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint, SummaryStats } from "@/lib/types";
import { WaveLabel } from "@/components/WaveLabel";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    payload: ChartPoint;
    value: number;
    name: string;
    color: string;
  }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  return (
    <div className="chart-tooltip min-w-[180px] text-sm">
      <div className="mb-1.5 border-b border-[#e9edf7] pb-1.5 text-xs text-ink-muted">
        {p
          ? `#${p.index} · ${p.dateLabel} · ${p.hero} · ${p.result}`
          : `#${label}`}
      </div>
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li
            key={entry.name}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-2 text-ink-faint">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-mono tabular-nums font-bold text-navy-700">
              {entry.name === "滚动胜率%"
                ? `${Number(entry.value).toFixed(1)}%`
                : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WinChart({
  points,
  summary,
}: {
  points: ChartPoint[];
  summary?: SummaryStats;
  rangeLabel?: string;
}) {
  if (points.length === 0) {
    return (
      <div
        id="trend"
        className="panel flex min-h-72 scroll-mt-24 items-center justify-center text-ink-muted"
      >
        所选范围内暂无天梯对局
      </div>
    );
  }

  const last = points[points.length - 1];
  // Range net wins = final cumulative (series starts at 0 within the filter)
  const netWins = summary?.netWins ?? last.cumulativeNetWins;
  const rollingWr =
    last.rollingWinrate != null
      ? last.rollingWinrate
      : (summary?.winrate ?? 0);
  const overallWr = summary?.winrate ?? 0;

  return (
    <section
      id="trend"
      className="panel scroll-mt-24 flex flex-col p-5 md:p-6"
    >
      <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-navy-700">
            走势图
          </h2>
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-ink-muted">累计净胜</span>
              <span
                className={`font-mono text-2xl font-bold tabular-nums ${
                  netWins > 0
                    ? "text-[#05cd99]"
                    : netWins < 0
                      ? "text-[#ee5d50]"
                      : "text-navy-700"
                }`}
              >
                {netWins > 0 ? "+" : ""}
                {netWins}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-ink-muted">滚动胜率</span>
              <span
                className={`font-mono text-2xl font-bold tabular-nums ${
                  rollingWr > 50
                    ? "text-[#05cd99]"
                    : rollingWr < 50
                      ? "text-[#ee5d50]"
                      : "text-navy-700"
                }`}
              >
                {rollingWr.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-ink-muted">胜率</span>
              <span
                className={`font-mono text-2xl font-bold tabular-nums ${
                  overallWr > 50
                    ? "text-[#05cd99]"
                    : overallWr < 50
                      ? "text-[#ee5d50]"
                      : "text-navy-700"
                }`}
              >
                {overallWr.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4 rounded-full"
              style={{ background: "#422AFB" }}
            />
            累计净胜
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-px w-4 border-t border-dashed border-[#a3aed0]" />
            滚动胜率
          </span>
        </div>
      </div>

      <div className="mt-2 w-full" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={points}
            margin={{ top: 12, right: 8, left: -8, bottom: 4 }}
          >
            <defs>
              <linearGradient id="netGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4318FF" />
                <stop offset="100%" stopColor="#868CFF" />
              </linearGradient>
              <linearGradient id="netArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4318FF" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#4318FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="#e9edf7"
              strokeDasharray="4 8"
              vertical={false}
            />
            <XAxis
              dataKey="index"
              tick={{ fill: "#a3aed0", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="net"
              tick={{ fill: "#a3aed0", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <YAxis yAxisId="wr" orientation="right" domain={[0, 100]} hide />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "rgba(66,42,251,0.2)", strokeWidth: 1 }}
            />
            <Area
              yAxisId="net"
              type="monotone"
              dataKey="cumulativeNetWins"
              name="累计净胜"
              stroke="none"
              fill="url(#netArea)"
              fillOpacity={1}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
            <Line
              yAxisId="net"
              type="monotone"
              dataKey="cumulativeNetWins"
              name="累计净胜"
              stroke="url(#netGrad)"
              strokeWidth={3}
              dot={false}
              isAnimationActive
              animationDuration={1100}
              animationEasing="ease-out"
              activeDot={{
                r: 5,
                fill: "#422AFB",
                stroke: "#fff",
                strokeWidth: 2,
                className: "chart-active-dot",
              }}
            />
            <Line
              yAxisId="wr"
              type="monotone"
              dataKey="rollingWinrate"
              name="滚动胜率%"
              stroke="#a3aed0"
              strokeWidth={1.5}
              strokeDasharray="4 5"
              dot={false}
              connectNulls
              isAnimationActive
              animationDuration={1300}
              animationEasing="ease-out"
              activeDot={{ r: 3.5, fill: "#707eae" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#e9edf7] pt-4">
        <div className="wave-stat">
          <p className="text-[10px] font-medium tracking-wide text-ink-muted">
            <WaveLabel text="场次" />
          </p>
          <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-navy-700">
            {summary?.games ?? points.length}
          </p>
        </div>
        <div className="wave-stat">
          <p className="text-[10px] font-medium tracking-wide text-ink-muted">
            <WaveLabel text="累计净胜" />
          </p>
          <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-navy-700">
            {netWins > 0 ? "+" : ""}
            {netWins}
          </p>
        </div>
        <div className="wave-stat">
          <p className="text-[10px] font-medium tracking-wide text-ink-muted">
            <WaveLabel text="滚动胜率" />
          </p>
          <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-navy-700">
            {rollingWr.toFixed(1)}%
          </p>
        </div>
      </div>
    </section>
  );
}
