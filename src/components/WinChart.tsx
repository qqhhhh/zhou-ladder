"use client";

import { useLayoutEffect, useRef, useState } from "react";
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

/** Left padding of the panel (pl-5=20, md:pl-6=24). Chart box ends at the divider. */
const PANEL_LEFT_PAD = 24;

function EndPointDot({
  cx,
  cy,
  index,
  lastIndex,
}: {
  cx?: number;
  cy?: number;
  index?: number;
  lastIndex: number;
}) {
  if (cx == null || cy == null || index == null) return null;
  if (index !== 0 && index !== lastIndex) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="#422AFB"
      stroke="#fff"
      strokeWidth={2}
    />
  );
}

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

type PlotBodyProps = {
  points: ChartPoint[];
  syncToDivider: boolean;
  width?: number;
  height?: number;
};

function PlotBody({ points, syncToDivider, width, height }: PlotBodyProps) {
  const anim = !syncToDivider;
  const lastIndex = points.length - 1;
  return (
    <ComposedChart
      width={width}
      height={height}
      data={points}
      margin={{ top: 8, right: 0, left: -4, bottom: 0 }}
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
      <CartesianGrid stroke="#e9edf7" strokeDasharray="4 8" vertical={false} />
      <XAxis
        type="number"
        dataKey="index"
        domain={[points[0].index, points[lastIndex].index]}
        ticks={points.map((p) => p.index)}
        tick={{ fill: "#a3aed0", fontSize: 11 }}
        tickLine={false}
        axisLine={false}
        padding={{ left: 0, right: 0 }}
        allowDecimals={false}
      />
      <YAxis
        yAxisId="net"
        tick={{ fill: "#a3aed0", fontSize: 11 }}
        tickLine={false}
        axisLine={false}
        width={40}
      />
      <YAxis yAxisId="wr" orientation="right" domain={[0, 100]} width={0} hide />
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
        isAnimationActive={anim}
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
        dot={(dotProps: { cx?: number; cy?: number; index?: number }) => (
          <EndPointDot
            cx={dotProps.cx}
            cy={dotProps.cy}
            index={dotProps.index}
            lastIndex={lastIndex}
          />
        )}
        isAnimationActive={anim}
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
        isAnimationActive={anim}
        animationDuration={1300}
        animationEasing="ease-out"
        activeDot={{ r: 3.5, fill: "#707eae" }}
      />
    </ComposedChart>
  );
}

export function WinChart({
  points,
  summary,
  compact = false,
  layoutWidth,
}: {
  points: ChartPoint[];
  summary?: SummaryStats;
  rangeLabel?: string;
  compact?: boolean;
  /** Chart pane width (px); updates every divider animation frame. */
  layoutWidth?: number;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxH, setBoxH] = useState(220);
  const syncToDivider = layoutWidth != null && layoutWidth > 0;
  // Same frame as divider: left pad stays, right edge = divider.
  const chartW = syncToDivider
    ? Math.max(1, Math.round(layoutWidth - PANEL_LEFT_PAD))
    : 0;

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const apply = () => {
      const h = el.clientHeight;
      if (h > 0) setBoxH((prev) => (prev === h ? prev : h));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [compact, points.length]);

  if (points.length === 0) {
    return (
      <div
        id="trend"
        className="panel flex h-full min-h-72 scroll-mt-24 items-center justify-center text-ink-muted"
      >
        <WaveLabel text="所选范围内暂无天梯对局" />
      </div>
    );
  }

  const last = points[points.length - 1];
  const netWins = summary?.netWins ?? last.cumulativeNetWins;
  const rollingWr =
    last.rollingWinrate != null
      ? last.rollingWinrate
      : (summary?.winrate ?? 0);
  const overallWr = summary?.winrate ?? 0;

  return (
    <section
      id="trend"
      className="panel scroll-mt-24 flex h-full w-full max-w-full flex-col overflow-hidden py-5 pl-5 pr-0 md:py-6 md:pl-6 md:pr-0"
    >
      <div className="mb-1 flex flex-wrap items-end gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-navy-700">
            <WaveLabel text="走势图" />
          </h2>
          <div
            className={`mt-3 flex-col gap-1.5 ${compact ? "hidden" : "flex"}`}
          >
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-ink-muted">
                <WaveLabel text="累计净胜" />
              </span>
              <span
                className={`font-mono text-2xl font-bold tabular-nums ${
                  netWins > 0
                    ? "text-[#05cd99]"
                    : netWins < 0
                      ? "text-[#ee5d50]"
                      : "text-navy-700"
                }`}
              >
                <WaveLabel text={`${netWins > 0 ? "+" : ""}${netWins}`} />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-ink-muted">
                <WaveLabel text="滚动胜率" />
              </span>
              <span
                className={`font-mono text-2xl font-bold tabular-nums ${
                  rollingWr > 50
                    ? "text-[#05cd99]"
                    : rollingWr < 50
                      ? "text-[#ee5d50]"
                      : "text-navy-700"
                }`}
              >
                <WaveLabel text={`${rollingWr.toFixed(1)}%`} />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-ink-muted">
                <WaveLabel text="胜率" />
              </span>
              <span
                className={`font-mono text-2xl font-bold tabular-nums ${
                  overallWr > 50
                    ? "text-[#05cd99]"
                    : overallWr < 50
                      ? "text-[#ee5d50]"
                      : "text-navy-700"
                }`}
              >
                <WaveLabel text={`${overallWr.toFixed(1)}%`} />
              </span>
            </div>
          </div>
          {compact ? (
            <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
              <span
                className={`font-mono font-bold tabular-nums ${
                  netWins > 0
                    ? "text-[#05cd99]"
                    : netWins < 0
                      ? "text-[#ee5d50]"
                      : "text-navy-700"
                }`}
              >
                <WaveLabel text={`净胜 ${netWins > 0 ? "+" : ""}${netWins}`} />
              </span>
              <span
                className={`font-mono font-bold tabular-nums ${
                  rollingWr > 50
                    ? "text-[#05cd99]"
                    : rollingWr < 50
                      ? "text-[#ee5d50]"
                      : "text-navy-700"
                }`}
              >
                <WaveLabel text={`滚动 ${rollingWr.toFixed(1)}%`} />
              </span>
            </p>
          ) : null}
          <div
            className={`mt-2 flex-wrap items-center gap-3 text-xs text-ink-muted ${compact ? "hidden" : "flex"}`}
          >
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-4 rounded-full"
                style={{ background: "#422AFB" }}
              />
              <WaveLabel text="累计净胜" />
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-px w-4 border-t border-dashed border-[#a3aed0]" />
              <WaveLabel text="滚动胜率" />
            </span>
          </div>
        </div>
      </div>

      <div
        ref={boxRef}
        className="mt-2 min-h-[220px] w-full max-w-full flex-1 overflow-hidden"
      >
        {syncToDivider ? (
          <PlotBody
            points={points}
            syncToDivider
            width={chartW}
            height={boxH}
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%" debounce={0}>
            <PlotBody points={points} syncToDivider={false} />
          </ResponsiveContainer>
        )}
      </div>

      <div
        className={`mt-4 grid-cols-3 gap-3 border-t border-[#e9edf7] pt-4 ${compact ? "hidden" : "grid"}`}
      >
        <div>
          <p className="text-[10px] font-medium tracking-wide text-ink-muted">
            <WaveLabel text="场次" />
          </p>
          <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-navy-700">
            <WaveLabel text={String(summary?.games ?? points.length)} />
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium tracking-wide text-ink-muted">
            <WaveLabel text="累计净胜" />
          </p>
          <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-navy-700">
            <WaveLabel text={`${netWins > 0 ? "+" : ""}${netWins}`} />
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium tracking-wide text-ink-muted">
            <WaveLabel text="滚动胜率" />
          </p>
          <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-navy-700">
            <WaveLabel text={`${rollingWr.toFixed(1)}%`} />
          </p>
        </div>
      </div>
    </section>
  );
}
