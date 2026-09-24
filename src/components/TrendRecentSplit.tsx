"use client";

import { useEffect, useRef, useState } from "react";
import type { ChartPoint, SummaryStats } from "@/lib/types";
import type { OverlayScorePayload } from "@/lib/parseOverlayScore";
import { WinChart } from "@/components/WinChart";
import { RecentMatches } from "@/components/RecentMatches";

type Focus = "recent" | "chart" | null;

/** Hover-recent / default width ≈ screenshot (~1/3). Chart-hover = half of that. */
const RECENT_EXPANDED_RATIO = 1 / 3;
const MD_MIN = 768;
const ANIM_MS = 580;
/** Same end-decelerate curve as before: cubic-bezier(0.05, 0.7, 0.1, 1) */
const EASE_X1 = 0.05;
const EASE_Y1 = 0.7;
const EASE_X2 = 0.1;
const EASE_Y2 = 1;

function cubic(t: number, a: number, b: number) {
  const mt = 1 - t;
  return 3 * mt * mt * t * a + 3 * mt * t * t * b + t * t * t;
}

function cubicDeriv(t: number, a: number, b: number) {
  const mt = 1 - t;
  return 3 * mt * mt * a + 6 * mt * t * (b - a) + 3 * t * t * (1 - b);
}

/** CSS cubic-bezier progress: time fraction → eased value. */
function cubicBezierEase(t: number) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  let guess = t;
  for (let i = 0; i < 8; i++) {
    const x = cubic(guess, EASE_X1, EASE_X2) - t;
    const dx = cubicDeriv(guess, EASE_X1, EASE_X2);
    if (Math.abs(dx) < 1e-6) break;
    guess -= x / dx;
  }
  return cubic(guess, EASE_Y1, EASE_Y2);
}

function targetRecentWidth(shellW: number, focus: Focus) {
  const expanded = Math.round(shellW * RECENT_EXPANDED_RATIO);
  return focus === "chart"
    ? Math.max(140, Math.round(expanded / 2))
    : expanded;
}

/** 桌面：左走势 · 右近期；宽度用 rAF 跟分割线实时驱动，图表每帧跟分割线 X 重绘。 */
export function TrendRecentSplit({
  chartPoints,
  chartDisplay,
  summary,
  overlayScore,
  rangeKey,
}: {
  chartPoints: ChartPoint[];
  chartDisplay: ChartPoint[];
  summary: SummaryStats;
  overlayScore: OverlayScorePayload | null;
  rangeKey: string;
}) {
  const [focus, setFocus] = useState<Focus>("recent");
  const [isDesktop, setIsDesktop] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const [shellW, setShellW] = useState(0);
  /** Live recent-pane width (px); chart = shellW - this. Drives both layout and Recharts. */
  const [recentW, setRecentW] = useState(0);
  const recentWRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [widthAnimating, setWidthAnimating] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MD_MIN}px)`);
    const apply = () => {
      setIsDesktop(mq.matches);
      if (!mq.matches) setFocus("recent");
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const el = shellRef.current;
    if (!el || !isDesktop) return;
    const measure = () => setShellW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isDesktop]);

  // Keep ref in sync for rAF closures
  useEffect(() => {
    recentWRef.current = recentW;
  }, [recentW]);

  // Animate recentW → target whenever focus or shellW changes (desktop only)
  useEffect(() => {
    if (!isDesktop || shellW <= 0) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setWidthAnimating(false);
      return;
    }

    const to = targetRecentWidth(shellW, focus);
    const from = recentWRef.current > 0 ? recentWRef.current : to;
    if (Math.abs(from - to) < 0.5) {
      recentWRef.current = to;
      setRecentW(to);
      setWidthAnimating(false);
      return;
    }

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    setWidthAnimating(true);

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ANIM_MS);
      const eased = cubicBezierEase(t);
      const next = from + (to - from) * eased;
      recentWRef.current = next;
      setRecentW(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        recentWRef.current = to;
        setRecentW(to);
        rafRef.current = null;
        setWidthAnimating(false);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [focus, shellW, isDesktop]);

  const chartW =
    isDesktop && shellW > 0 && recentW > 0 ? shellW - recentW : undefined;

  const onEnter = (pane: Focus) => {
    if (!isDesktop) return;
    setFocus(pane);
  };

  return (
    <div
      ref={shellRef}
      className="flex min-h-0 flex-col gap-3 md:h-[420px] md:flex-row md:items-stretch md:gap-0 md:overflow-hidden md:rounded-[20px] md:border md:border-[#e9edf7] md:bg-white md:shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)]"
    >
      {/* 上(移动) / 左(桌面)：走势 */}
      <div
        className="flex min-h-0 min-w-0 flex-col overflow-hidden md:h-full md:border-r md:border-[#e9edf7] md:bg-white"
        style={{
          flexGrow: 0,
          flexShrink: 0,
          flexBasis: isDesktop
            ? chartW != null
              ? chartW
              : "58%"
            : "auto",
          width: isDesktop ? undefined : "100%",
        }}
        onMouseEnter={() => onEnter("chart")}
      >
        <div className="h-full min-h-0 w-full max-w-full overflow-hidden md:[&_.panel]:h-full md:[&_.panel]:rounded-none md:[&_.panel]:border-0 md:[&_.panel]:bg-transparent md:[&_.panel]:shadow-none">
          <WinChart
            points={chartDisplay}
            summary={summary}
            compact={false}
            layoutWidth={chartW}
            widthAnimating={widthAnimating}
            enterKey={rangeKey}
          />
        </div>
      </div>

      {/* 下(移动) / 右(桌面)：近期对局 */}
      <div
        className="flex min-h-0 min-w-0 flex-col md:h-full md:bg-white"
        style={{
          flexGrow: 0,
          flexShrink: 0,
          flexBasis: isDesktop
            ? recentW > 0
              ? recentW
              : "42%"
            : "auto",
          width: isDesktop ? undefined : "100%",
        }}
        onMouseEnter={() => onEnter("recent")}
      >
        <div className="h-full min-h-0 md:[&_.panel]:h-full md:[&_.panel]:rounded-none md:[&_.panel]:border-0 md:[&_.panel]:bg-transparent md:[&_.panel]:shadow-none">
          <RecentMatches
            points={chartPoints}
            overlayScore={overlayScore}
            limit={8}
            compact={isDesktop && focus === "chart"}
          />
        </div>
      </div>
    </div>
  );
}
