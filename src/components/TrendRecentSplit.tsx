"use client";

import { useState, type CSSProperties } from "react";
import type { ChartPoint, SummaryStats } from "@/lib/types";
import type { OverlayScorePayload } from "@/lib/parseOverlayScore";
import { WinChart } from "@/components/WinChart";
import { RecentMatches } from "@/components/RecentMatches";

type Focus = "recent" | "chart" | null;

/** 左：近期对局 · 右：走势图；悬停哪边，哪边变宽。 */
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

  // default ~58% / 42%; hover recent ~75/25; hover chart ~30/70
  const recentFr = focus === "recent" ? 3 : focus === "chart" ? 1.1 : 1.4;
  const chartFr = focus === "chart" ? 2.4 : focus === "recent" ? 1 : 1;

  const gridStyle: CSSProperties = {
    ["--recent-fr" as string]: String(recentFr),
    ["--chart-fr" as string]: String(chartFr),
  };

  return (
    <div
      className="trend-recent-split grid grid-cols-1 gap-3 md:min-h-[420px] md:gap-0 md:overflow-hidden md:rounded-[20px] md:border md:border-[#e9edf7] md:bg-white md:shadow-[0_8px_20px_-8px_rgba(67,24,255,0.12)]"
      style={gridStyle}
    >
      <style>{`
        @media (min-width: 768px) {
          .trend-recent-split {
            grid-template-columns:
              minmax(240px, calc(var(--recent-fr) * 1fr))
              minmax(200px, calc(var(--chart-fr) * 1fr));
            transition: grid-template-columns 280ms cubic-bezier(0.22, 1, 0.36, 1);
          }
        }
      `}</style>

      <div
        className="min-h-0 md:border-r md:border-[#e9edf7]"
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
        className="min-h-0"
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
