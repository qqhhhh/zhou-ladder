"use client";

import type { ChartPoint } from "@/lib/types";

export function RecentMatches({ points }: { points: ChartPoint[] }) {
  const recent = [...points].reverse().slice(0, 8);

  return (
    <div id="recent" className="panel scroll-mt-24 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <h2 className="text-sm font-semibold tracking-tight text-white">
          近期对局
        </h2>
        <span className="text-[10px] text-white/35">最近 {recent.length} 场</span>
      </div>
      <ul>
        {recent.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-white/35">暂无对局</li>
        ) : (
          recent.map((p) => {
            const win = p.result === "胜";
            return (
              <li
                key={`${p.index}-${p.date}`}
                className="recent-row flex items-center gap-3 px-5 py-2.5"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                    win
                      ? "bg-teal-400/12 text-teal-300 ring-1 ring-teal-400/20"
                      : "bg-rose-400/12 text-rose-300 ring-1 ring-rose-400/20"
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
                  className={`font-mono text-sm font-semibold tabular-nums ${
                    win ? "text-white/80" : "text-white/40"
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
