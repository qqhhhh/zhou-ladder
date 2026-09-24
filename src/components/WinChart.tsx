"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint, SummaryStats } from "@/lib/types";
import { WaveLabel } from "@/components/WaveLabel";

const MIN_WIDTH = 300;
const PLOT_HEIGHT = 300;
/** Horizontal padding (px-6 = 24). Split mode: left only so tip meets divider. */
const PAD_X = 24;

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

export function WinChart({
  points,
  summary,
  layoutWidth,
  syncDragging = false,
}: {
  points: ChartPoint[];
  summary?: SummaryStats;
  rangeLabel?: string;
  /**
   * Chart pane width (px) from TrendRecentSplit. When set, parent owns the
   * center divider; tip is flush to the right edge (no local drag handle).
   */
  layoutWidth?: number;
  /** Parent divider drag — kills morph and keeps it off after release. */
  syncDragging?: boolean;
}) {
  /** Prop passed (incl. 0 while measuring) → parent owns divider; hide local handle. */
  const inSplit = layoutWidth !== undefined;
  const liveSplit = inSplit && layoutWidth! > 0;
  const shellRef = useRef<HTMLDivElement>(null);
  const plotBoxRef = useRef<HTMLDivElement>(null);
  const [maxWidth, setMaxWidth] = useState(0);
  const [plotH, setPlotH] = useState(PLOT_HEIGHT);
  /** null = follow parent full width; after first drag, explicit px. */
  const [userWidth, setUserWidth] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const dragStartX = useRef(0);
  const dragStartW = useRef(0);
  const pendingW = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);
  const draggingRef = useRef(false);
  /** Only true after points change; never re-armed by ending a drag. */
  const [animForData, setAnimForData] = useState(true);
  const pointsSig = useMemo(() => {
    if (points.length === 0) return "empty";
    const a = points[0];
    const b = points[points.length - 1];
    return `${points.length}:${a.index}:${a.cumulativeNetWins}:${b.index}:${b.cumulativeNetWins}:${b.rollingWinrate ?? ""}`;
  }, [points]);

  // Arm morph only when data changes — never when syncDragging flips false on release.
  useEffect(() => {
    setAnimForData(true);
    const t = window.setTimeout(() => setAnimForData(false), 1400);
    return () => window.clearTimeout(t);
  }, [pointsSig]);

  // Drag start → anim off immediately; stay off on release (never re-arm here).
  useEffect(() => {
    if (syncDragging || dragging) setAnimForData(false);
  }, [syncDragging, dragging]);

  useLayoutEffect(() => {
    if (inSplit) return;
    const shell = shellRef.current;
    if (!shell) return;
    const apply = () => {
      const w = shell.clientWidth;
      if (w > 0) setMaxWidth((prev) => (prev === w ? prev : w));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(shell);
    return () => ro.disconnect();
  }, [inSplit]);

  // Split: plot height fills remaining pane (shell is ~420px).
  useLayoutEffect(() => {
    if (!inSplit) {
      setPlotH(PLOT_HEIGHT);
      return;
    }
    const el = plotBoxRef.current;
    if (!el) return;
    const apply = () => {
      const h = el.clientHeight;
      if (h > 0) setPlotH((prev) => (prev === h ? prev : h));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [inSplit, liveSplit]);

  // Keep an explicit user width clamped when the parent shrinks.
  useLayoutEffect(() => {
    if (inSplit) return;
    if (userWidth == null || maxWidth <= 0) return;
    if (userWidth > maxWidth || userWidth < MIN_WIDTH) {
      setUserWidth(Math.min(Math.max(userWidth, MIN_WIDTH), maxWidth));
    }
  }, [maxWidth, userWidth, inSplit]);

  const clampW = useCallback(
    (w: number) => {
      if (maxWidth <= 0) return Math.round(w);
      const lo = Math.min(MIN_WIDTH, maxWidth);
      return Math.min(Math.max(Math.round(w), lo), maxWidth);
    },
    [maxWidth],
  );

  const sectionWidth = liveSplit
    ? Math.round(layoutWidth!)
    : maxWidth > 0
      ? userWidth != null
        ? clampW(userWidth)
        : maxWidth
      : 0;
  // Split: left pad only — tip flush to center divider. Standalone: both pads.
  const plotW =
    sectionWidth > 0
      ? Math.max(1, sectionWidth - (liveSplit ? PAD_X : PAD_X * 2))
      : 0;
  const chartHeight = liveSplit ? Math.max(120, plotH) : PLOT_HEIGHT;

  const flushPending = useCallback(() => {
    rafId.current = null;
    if (pendingW.current == null) return;
    setUserWidth(pendingW.current);
    pendingW.current = null;
  }, []);

  const onHandlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (inSplit || maxWidth <= 0) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    setAnimForData(false);
    setDragging(true);
    dragStartX.current = e.clientX;
    dragStartW.current = sectionWidth > 0 ? sectionWidth : maxWidth;
  };

  const onHandlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const delta = e.clientX - dragStartX.current;
    const next = clampW(dragStartW.current + delta);
    pendingW.current = next;
    if (rafId.current == null) {
      rafId.current = requestAnimationFrame(flushPending);
    }
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (rafId.current != null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    if (pendingW.current != null) {
      setUserWidth(pendingW.current);
      pendingW.current = null;
    }
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  if (points.length === 0) {
    return (
      <div
        id="trend"
        className="panel flex min-h-72 scroll-mt-24 items-center justify-center text-ink-muted"
      >
        <WaveLabel text="所选范围内暂无天梯对局" />
      </div>
    );
  }

  const last = points[points.length - 1];
  const lastIndex = last.index;
  const firstIndex = points[0].index;
  const netWins = summary?.netWins ?? last.cumulativeNetWins;
  const rollingWr =
    last.rollingWinrate != null
      ? last.rollingWinrate
      : (summary?.winrate ?? 0);
  const overallWr = summary?.winrate ?? 0;
  const anim = animForData && !dragging && !syncDragging;

  const headerPad = liveSplit ? "pl-6 pr-0" : "px-6";
  const plotPad = liveSplit ? "pl-6 pr-0" : "px-6";
  const footerPad = liveSplit ? "pl-6 pr-3" : "px-6";

  return (
    <div ref={shellRef} className="h-full w-full max-w-full">
      <section
        id="trend"
        className="panel relative scroll-mt-24 flex h-full flex-col overflow-hidden py-5 md:py-6"
        style={{
          width: liveSplit
            ? "100%"
            : sectionWidth > 0
              ? sectionWidth
              : "100%",
          maxWidth: "100%",
        }}
      >
        <div
          className={`mb-1 flex flex-wrap items-end justify-between gap-3 ${headerPad}`}
        >
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-navy-700">
              <WaveLabel text="走势图" />
            </h2>
            <div className="mt-3 flex flex-col gap-1.5">
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
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
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

        <div
          ref={plotBoxRef}
          className={`mt-2 min-h-0 ${liveSplit ? "flex-1 overflow-hidden" : ""} ${plotPad}`}
        >
          {plotW > 0 ? (
            <ComposedChart
              width={plotW}
              height={chartHeight}
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
              <CartesianGrid
                stroke="#e9edf7"
                strokeDasharray="4 8"
                vertical={false}
              />
              <XAxis
                type="number"
                dataKey="index"
                domain={[firstIndex, lastIndex]}
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
              <YAxis
                yAxisId="wr"
                orientation="right"
                domain={[0, 100]}
                width={0}
                hide
              />
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
                dot={(dotProps: {
                  cx?: number;
                  cy?: number;
                  index?: number;
                }) => (
                  <EndPointDot
                    cx={dotProps.cx}
                    cy={dotProps.cy}
                    index={dotProps.index}
                    lastIndex={points.length - 1}
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
          ) : null}
        </div>

        <div
          className={`mt-4 grid grid-cols-3 gap-3 border-t border-[#e9edf7] pt-4 ${footerPad}`}
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

        {/* Standalone only: drag right edge. Split mode: parent owns center divider. */}
        {!inSplit ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="调整走势图宽度"
            className="absolute inset-y-0 right-0 z-10 w-3 cursor-ew-resize touch-none"
            style={{ touchAction: "none" }}
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div
              className={`pointer-events-none absolute inset-y-0 right-0 w-0.5 transition-colors ${
                dragging ? "bg-[#422AFB]/80" : "bg-[#422AFB]/40"
              }`}
            />
            <div
              className={`pointer-events-none absolute top-1/2 right-0 h-10 w-1 -translate-y-1/2 rounded-full transition-colors ${
                dragging ? "bg-[#422AFB]" : "bg-[#422AFB]/55"
              }`}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
