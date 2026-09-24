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

/** 桌面：左走势 · 右近期（默认/悬停=截图约1/3，悬停走势=一半）；移动上下无动画。 */
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
  const [focus, setFocus] = useState<Focus>("recent");
  const [isDesktop, setIsDesktop] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const [shellW, setShellW] = useState(0);

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

  const recentExpanded =
    shellW > 0 ? Math.round(shellW * RECENT_EXPANDED_RATIO) : 0;
  const recentW =
    !isDesktop || shellW === 0
      ? undefined
      : focus === "chart"
        ? Math.max(140, Math.round(recentExpanded / 2))
        : recentExpanded;
  const chartW =
    !isDesktop || shellW === 0 || recentW == null
      ? undefined
      : shellW - recentW;

  // Strong end decelerate: sprint early, coast into the stop (less stiff than expo snap).
  const ease = "cubic-bezier(0.05, 0.7, 0.1, 1)";
  const paneTransition = isDesktop
    ? ({
        transition: `flex-basis 580ms ${ease}`,
        willChange: "flex-basis",
      } as const)
    : undefined;

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
          ...paneTransition,
        }}
        onMouseEnter={() => onEnter("chart")}
      >
        <div className="h-full min-h-0 w-full max-w-full overflow-hidden md:[&_.panel]:h-full md:[&_.panel]:rounded-none md:[&_.panel]:border-0 md:[&_.panel]:bg-transparent md:[&_.panel]:shadow-none">
          <WinChart
            points={chartDisplay}
            summary={summary}
            compact={false}
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
            ? recentW != null
              ? recentW
              : "42%"
            : "auto",
          width: isDesktop ? undefined : "100%",
          ...paneTransition,
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
