"use client";

import type { ChartPoint } from "@/lib/types";

export function RecentMatches({ points }: { points: ChartPoint[] }) {
  const recent = [...points].reverse().slice(0, 8);

  return (
    <div id="recent" className="panel scroll-mt-24 overflow-hidden">
      <div className="flex items-center justify-between px-5 pb-2 pt-5">
        <h2 className="text-lg font-bold tracking-tight text-navy-700">
          近期对局
        </h2>
        <span className="text-[11px] font-medium text-ink-muted">
          最近 {recent.length} 场
        </span>
      </div>
      <ul>
        {recent.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-ink-muted">
            暂无对局
          </li>
        ) : (
          recent.map((p) => {
            const win = p.result === "胜";
            return (
              <li
                key={`${p.index}-${p.date}`}
                className="recent-row flex items-center gap-3 px-5 py-2.5"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold ${
                    win
                      ? "bg-[rgba(238,93,80,0.12)] text-[#ee5d50]"
                      : "bg-[rgba(163,174,208,0.18)] text-[#a3aed0]"
                  }`}
                >
                  {p.result}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy-700">
                    {p.hero}
                  </p>
                  <p className="truncate text-[11px] text-ink-muted">
                    #{p.index} · {p.dateLabel}
                  </p>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
