"use client";

import { useState } from "react";
import type { ChartPoint, SummaryStats } from "@/lib/types";
import type { OverlayScorePayload } from "@/lib/parseOverlayScore";
import { WinChart } from "@/components/WinChart";
import { RecentMatches } from "@/components/RecentMatches";

type Focus = "recent" | "chart" | null;

/** 左：走势图 · 右：近期对局；悬停哪边哪边冲刺变宽后放缓；两侧同高同底。 */
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

  // left = chart, right = recent
  const chartPct =
    focus === "chart" ? 72 : focus === "recent" ? 32 : 58;
  const recentPct = 100 - chartPct;

  // 冲刺后放缓（ease-out expo-ish）
  const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
  const paneTransition = {
    transition: `flex-basis 420ms ${ease}`,
  } as const;

  return (
    <div className="flex min-h-0 flex-col gap-3 md:h-[420px] md:flex-row md:items-stretch md:gap-0 md:overflow-hidden md:rounded-[20px] md:border md:border-[#e9edf7] md:bg-white md:shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)]">
      {/* 左：走势 */}
      <div
        className="flex min-h-0 min-w-0 flex-col md:h-full md:border-r md:border-[#e9edf7] md:bg-white"
        style={{ flex: `0 0 ${chartPct}%`, ...paneTransition }}
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

      {/* 右：近期对局 — 同高，悬停不加行数、不改高度 */}
      <div
        className="flex min-h-0 min-w-0 flex-col md:h-full md:bg-white"
        style={{ flex: `0 0 ${recentPct}%`, ...paneTransition }}
        onMouseEnter={() => setFocus("recent")}
        onMouseLeave={() => setFocus(null)}
      >
        <div className="h-full min-h-0 md:[&_.panel]:h-full md:[&_.panel]:rounded-none md:[&_.panel]:border-0 md:[&_.panel]:bg-transparent md:[&_.panel]:shadow-none">
          <RecentMatches
            points={chartPoints}
            overlayScore={overlayScore}
            limit={8}
          />
        </div>
      </div>
    </div>
  );
}
