"use client";

import { useEffect, useRef, useState } from "react";
import type { ChartPoint, SummaryStats } from "@/lib/types";
import type { OverlayScorePayload } from "@/lib/parseOverlayScore";
import { WinChart } from "@/components/WinChart";
import { RecentMatches } from "@/components/RecentMatches";

type Focus = "recent" | "chart" | null;

/** Current default recent share of the row (before this change). */
const RECENT_BASE_RATIO = 0.42;
const SHRINK_PX = 120;
const MD_MIN = 768;

/** 桌面：左走势 · 右近期对局（悬停冲刺放缓）；移动：上下排列、无动画。 */
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
  const [focus, setFocus] = useState<Focus>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const [shellW, setShellW] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MD_MIN}px)`);
    const apply = () => {
      setIsDesktop(mq.matches);
      if (!mq.matches) setFocus(null);
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

  const recentBase = shellW > 0 ? Math.round(shellW * RECENT_BASE_RATIO) : 0;
  const recentW =
    !isDesktop || shellW === 0
      ? undefined
      : focus === "chart"
        ? Math.max(160, recentBase - SHRINK_PX)
        : recentBase;
  const chartW =
    !isDesktop || shellW === 0 || recentW == null
      ? undefined
      : shellW - recentW;

  const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
  const paneTransition = isDesktop
    ? ({
        transition: `flex-basis 420ms ${ease}, width 420ms ${ease}`,
      } as const)
    : undefined;

  const onEnter = (pane: Focus) => {
    if (!isDesktop) return;
    setFocus(pane);
  };
  const onLeave = () => {
    if (!isDesktop) return;
    setFocus(null);
  };

  return (
    <div
      ref={shellRef}
      className="flex min-h-0 flex-col gap-3 md:h-[420px] md:flex-row md:items-stretch md:gap-0 md:overflow-hidden md:rounded-[20px] md:border md:border-[#e9edf7] md:bg-white md:shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)]"
    >
      {/* 上(移动) / 左(桌面)：走势 */}
      <div
        className="flex min-h-0 min-w-0 flex-col md:h-full md:border-r md:border-[#e9edf7] md:bg-white"
        style={{
          flex: isDesktop
            ? chartW != null
              ? `0 0 ${chartW}px`
              : "1 1 58%"
            : "0 0 auto",
          width: isDesktop ? undefined : "100%",
          ...paneTransition,
        }}
        onMouseEnter={() => onEnter("chart")}
        onMouseLeave={onLeave}
      >
        <div className="h-full min-h-0 md:[&_.panel]:h-full md:[&_.panel]:rounded-none md:[&_.panel]:border-0 md:[&_.panel]:bg-transparent md:[&_.panel]:shadow-none">
          <WinChart
            points={chartDisplay}
            summary={summary}
            compact={isDesktop && focus !== "chart"}
          />
        </div>
      </div>

      {/* 下(移动) / 右(桌面)：近期对局 */}
      <div
        className="flex min-h-0 min-w-0 flex-col md:h-full md:bg-white"
        style={{
          flex: isDesktop
            ? recentW != null
              ? `0 0 ${recentW}px`
              : "1 1 42%"
            : "0 0 auto",
          width: isDesktop ? undefined : "100%",
          ...paneTransition,
        }}
        onMouseEnter={() => onEnter("recent")}
        onMouseLeave={onLeave}
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
