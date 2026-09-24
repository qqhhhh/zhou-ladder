"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { ChartPoint, SummaryStats } from "@/lib/types";
import type { OverlayScorePayload } from "@/lib/parseOverlayScore";
import { WinChart } from "@/components/WinChart";
import { RecentMatches } from "@/components/RecentMatches";

/** Default recent pane ≈ 1/3 of shell (old RECENT_EXPANDED_RATIO). */
const RECENT_DEFAULT_RATIO = 1 / 3;
const MD_MIN = 768;
const MIN_CHART = 280;
const MIN_RECENT = 140;
/** Compact RecentMatches when recent pane is narrower than this. */
const COMPACT_RECENT_BELOW = 220;

/**
 * Desktop: chart | draggable center divider | recent.
 * Mobile: chart above recent, no divider drag.
 * Resize = drag the center line only (no hover-focus ease tween).
 */
export function TrendRecentSplit({
  chartPoints,
  chartDisplay,
  summary,
  overlayScore,
}: {
  chartPoints: ChartPoint[];
  chartDisplay: ChartPoint[];
  summary: SummaryStats;
  overlayScore: OverlayScorePayload | null;
}) {
  const [isDesktop, setIsDesktop] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const [shellW, setShellW] = useState(0);
  /** Live recent-pane width (px); chart = shellW - recentW. */
  const [recentW, setRecentW] = useState(0);
  const [dragging, setDragging] = useState(false);

  const recentWRef = useRef(0);
  const draggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartRecent = useRef(0);
  const pendingRecent = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MD_MIN}px)`);
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const el = shellRef.current;
    if (!el || !isDesktop) return;
    const measure = () => {
      const w = el.clientWidth;
      setShellW((prev) => (prev === w ? prev : w));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isDesktop]);

  useEffect(() => {
    recentWRef.current = recentW;
  }, [recentW]);

  // Init / clamp recentW when shell size changes (desktop only).
  useEffect(() => {
    if (!isDesktop || shellW <= 0) return;
    const maxRecent = Math.max(MIN_RECENT, shellW - MIN_CHART);
    const defaultRecent = Math.round(shellW * RECENT_DEFAULT_RATIO);
    const cur = recentWRef.current;
    if (cur <= 0) {
      const next = Math.min(Math.max(defaultRecent, MIN_RECENT), maxRecent);
      recentWRef.current = next;
      setRecentW(next);
      return;
    }
    const clamped = Math.min(Math.max(cur, MIN_RECENT), maxRecent);
    if (clamped !== cur) {
      recentWRef.current = clamped;
      setRecentW(clamped);
    }
  }, [shellW, isDesktop]);

  const clampRecent = useCallback(
    (w: number) => {
      if (shellW <= 0) return Math.round(w);
      const maxRecent = Math.max(MIN_RECENT, shellW - MIN_CHART);
      return Math.min(Math.max(Math.round(w), MIN_RECENT), maxRecent);
    },
    [shellW],
  );

  const flushPending = useCallback(() => {
    rafId.current = null;
    if (pendingRecent.current == null) return;
    recentWRef.current = pendingRecent.current;
    setRecentW(pendingRecent.current);
    pendingRecent.current = null;
  }, []);

  const onDividerPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDesktop || shellW <= 0) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    setDragging(true);
    dragStartX.current = e.clientX;
    dragStartRecent.current =
      recentWRef.current > 0
        ? recentWRef.current
        : Math.round(shellW * RECENT_DEFAULT_RATIO);
  };

  const onDividerPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    // Dragging right shrinks recent; left grows recent.
    const delta = e.clientX - dragStartX.current;
    const next = clampRecent(dragStartRecent.current - delta);
    pendingRecent.current = next;
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
    if (pendingRecent.current != null) {
      recentWRef.current = pendingRecent.current;
      setRecentW(pendingRecent.current);
      pendingRecent.current = null;
    }
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const chartW =
    isDesktop && shellW > 0 && recentW > 0 ? shellW - recentW : undefined;
  const recentCompact =
    isDesktop && recentW > 0 && recentW < COMPACT_RECENT_BELOW;

  return (
    <div
      ref={shellRef}
      className="relative flex min-h-0 flex-col gap-3 md:h-[420px] md:flex-row md:items-stretch md:gap-0 md:overflow-hidden md:rounded-[20px] md:border md:border-[#e9edf7] md:bg-white md:shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)]"
    >
      {/* 上(移动) / 左(桌面)：走势 */}
      <div
        className="flex min-h-0 min-w-0 flex-col overflow-hidden md:h-full md:bg-white"
        style={{
          flexGrow: 0,
          flexShrink: 0,
          flexBasis: isDesktop
            ? chartW != null
              ? chartW
              : `${Math.round((1 - RECENT_DEFAULT_RATIO) * 100)}%`
            : "auto",
          width: isDesktop ? undefined : "100%",
        }}
      >
        <div className="h-full min-h-0 w-full max-w-full overflow-hidden md:[&_.panel]:h-full md:[&_.panel]:rounded-none md:[&_.panel]:border-0 md:[&_.panel]:bg-transparent md:[&_.panel]:shadow-none">
          <WinChart
            points={chartDisplay}
            summary={summary}
            layoutWidth={isDesktop ? (chartW ?? 0) : undefined}
            syncDragging={dragging}
          />
        </div>
      </div>

      {/* Desktop center divider — visible + draggable (ew-resize) */}
      {isDesktop ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="调整走势图与近期对局宽度"
          className="absolute inset-y-0 z-20 w-3 -translate-x-1/2 cursor-ew-resize touch-none"
          style={{
            left: chartW != null ? chartW : `${(1 - RECENT_DEFAULT_RATIO) * 100}%`,
            touchAction: "none",
          }}
          onPointerDown={onDividerPointerDown}
          onPointerMove={onDividerPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div
            className={`pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors ${
              dragging ? "bg-[#422AFB]/90" : "bg-[#e9edf7]"
            }`}
          />
          <div
            className={`pointer-events-none absolute top-1/2 left-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors ${
              dragging ? "bg-[#422AFB]" : "bg-[#422AFB]/45"
            }`}
          />
        </div>
      ) : null}

      {/* 下(移动) / 右(桌面)：近期对局 */}
      <div
        className="flex min-h-0 min-w-0 flex-col md:h-full md:bg-white"
        style={{
          flexGrow: 0,
          flexShrink: 0,
          flexBasis: isDesktop
            ? recentW > 0
              ? recentW
              : `${Math.round(RECENT_DEFAULT_RATIO * 100)}%`
            : "auto",
          width: isDesktop ? undefined : "100%",
        }}
      >
        <div className="h-full min-h-0 md:[&_.panel]:h-full md:[&_.panel]:rounded-none md:[&_.panel]:border-0 md:[&_.panel]:bg-transparent md:[&_.panel]:shadow-none">
          <RecentMatches
            points={chartPoints}
            overlayScore={overlayScore}
            limit={8}
            compact={recentCompact}
          />
        </div>
      </div>
    </div>
  );
}
