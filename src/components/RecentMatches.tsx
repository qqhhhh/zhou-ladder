"use client";

import type { ChartPoint } from "@/lib/types";

export function RecentMatches({ points }: { points: ChartPoint[] }) {
  const recent = [...points].reverse().slice(0, 6);

  return (
    <div id="recent" className="panel scroll-mt-24 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 md:px-5">
        <h2 className="text-sm font-semibold text-white">近期对局</h2>
        <span className="text-[10px] text-white/35">最近 {recent.length} 场</span>
      </div>
      <ul>
        {recent.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-white/35">暂无对局</li>
        ) : (
          recent.map((p) => {
            const win = p.result === "胜";
            return (
              <li
                key={`${p.index}-${p.date}`}
                className="recent-row flex items-center gap-3 px-4 py-3 md:px-5"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                    win
                      ? "bg-teal-400/15 text-teal-300"
                      : "bg-rose-400/15 text-rose-300"
                  }`}
                >
                  {p.result}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/90">
                    {p.hero}
                  </p>
                  <p className="truncate text-[11px] text-white/35">
                    #{p.index} · {p.dateLabel}
                  </p>
                </div>
                <span
                  className={`font-mono text-lg font-semibold tabular-nums ${
                    win ? "text-white" : "text-white/50"
                  }`}
                >
                  {win ? "W" : "L"}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
