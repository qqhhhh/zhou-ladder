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

/** 左走势 · 右近期对局；放大=现默认宽，缩小时再窄 120px。 */
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
  const shellRef = useRef<HTMLDivElement>(null);
  const [shellW, setShellW] = useState(0);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const measure = () => setShellW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 放大宽 = 现在非放大默认宽；缩小 = 再窄 120px；默认与放大同宽
  const recentBase = shellW > 0 ? Math.round(shellW * RECENT_BASE_RATIO) : 0;
  const recentW =
    shellW === 0
      ? undefined
      : focus === "chart"
        ? Math.max(160, recentBase - SHRINK_PX)
        : recentBase;
  const chartW =
    shellW === 0 || recentW == null ? undefined : shellW - recentW;

  const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
  const paneTransition = {
    transition: `flex-basis 420ms ${ease}, width 420ms ${ease}`,
  } as const;

  return (
    <div
      ref={shellRef}
      className="flex min-h-0 flex-col md:h-[420px] md:flex-row md:items-stretch md:overflow-hidden md:rounded-[20px] md:border md:border-[#e9edf7] md:bg-white md:shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)]"
    >
      <div
        className="flex min-h-0 min-w-0 flex-col md:h-full md:border-r md:border-[#e9edf7] md:bg-white"
        style={{
          flex: chartW != null ? `0 0 ${chartW}px` : "1 1 58%",
          ...paneTransition,
        }}
        onMouseEnter={() => setFocus("chart")}
        onMouseLeave={() => setFocus(null)}
      >
        <div className="h-full min-h-0 md:[&_.panel]:h-full md:[&_.panel]:rounded-none md:[&_.panel]:border-0 md:[&_.panel]:bg-transparent md:[&_.panel]:shadow-none">
          <WinChart
            points={chartDisplay}
            summary={summary}
            compact={focus !== "chart"}
          />
        </div>
      </div>

      <div
        className="flex min-h-0 min-w-0 flex-col md:h-full md:bg-white"
        style={{
          flex: recentW != null ? `0 0 ${recentW}px` : "1 1 42%",
          ...paneTransition,
        }}
        onMouseEnter={() => setFocus("recent")}
        onMouseLeave={() => setFocus(null)}
      >
        <div className="h-full min-h-0 md:[&_.panel]:h-full md:[&_.panel]:rounded-none md:[&_.panel]:border-0 md:[&_.panel]:bg-transparent md:[&_.panel]:shadow-none">
          <RecentMatches
            points={chartPoints}
            overlayScore={overlayScore}
            limit={8}
            compact={focus === "chart"}
          />
        </div>
      </div>
    </div>
  );
}
