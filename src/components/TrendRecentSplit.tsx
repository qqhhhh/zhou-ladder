"use client";

import { useState } from "react";
import type { ChartPoint, SummaryStats } from "@/lib/types";
import type { OverlayScorePayload } from "@/lib/parseOverlayScore";
import { WinChart } from "@/components/WinChart";
import { RecentMatches } from "@/components/RecentMatches";

type Focus = "recent" | "chart" | null;

/** 左：近期对局 · 右：走势图；悬停哪边，哪边平滑变宽。 */
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

  // percentages (flex-basis) — browsers interpolate these smoothly
  const recentPct =
    focus === "recent" ? 72 : focus === "chart" ? 30 : 56;
  const chartPct = 100 - recentPct;

  return (
    <div className="flex min-h-0 flex-col gap-3 md:min-h-[420px] md:flex-row md:gap-0 md:overflow-hidden md:rounded-[20px] md:border md:border-[#e9edf7] md:bg-white md:shadow-[0_8px_20px_-8px_rgba(67,24,255,0.12)]">
      <div
        className="min-h-0 min-w-0 md:border-r md:border-[#e9edf7] md:transition-[flex-basis] md:duration-300 md:ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ flex: `0 0 ${recentPct}%` }}
        onMouseEnter={() => setFocus("recent")}
        onMouseLeave={() => setFocus(null)}
      >
        <div className="h-full md:[&_.panel]:h-full md:[&_.panel]:rounded-none md:[&_.panel]:border-0 md:[&_.panel]:shadow-none">
          <RecentMatches
            points={chartPoints}
            overlayScore={overlayScore}
            limit={focus === "recent" ? 12 : 8}
          />
        </div>
      </div>

      <div
        className="min-h-0 min-w-0 md:transition-[flex-basis] md:duration-300 md:ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ flex: `0 0 ${chartPct}%` }}
        onMouseEnter={() => setFocus("chart")}
        onMouseLeave={() => setFocus(null)}
      >
        <div className="h-full md:[&_.panel]:h-full md:[&_.panel]:rounded-none md:[&_.panel]:border-0 md:[&_.panel]:shadow-none">
          <WinChart
            points={chartDisplay}
            summary={summary}
            compact={focus !== "chart"}
          />
        </div>
      </div>
    </div>
  );
}
