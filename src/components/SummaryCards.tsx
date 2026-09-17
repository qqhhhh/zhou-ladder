"use client";

import type { SummaryStats } from "@/lib/types";
import { formatNum } from "@/lib/stats";

export function SummaryCards({
  summary,
  rangeLabel,
}: {
  summary: SummaryStats;
  rangeLabel: string;
}) {
  const items = [
    {
      key: "games",
      label: "场次",
      value: String(summary.games),
      hint: rangeLabel,
    },
    {
      key: "wl",
      label: "W-L",
      value: `${summary.wins}-${summary.losses}`,
      hint:
        summary.netWins > 0
          ? `净胜 +${summary.netWins}`
          : summary.netWins < 0
            ? `净胜 ${summary.netWins}`
            : "净胜 0",
      valueClass:
        summary.netWins > 0
          ? "text-teal-300"
          : summary.netWins < 0
            ? "text-rose-300"
            : "text-white",
    },
    {
      key: "wr",
      label: "胜率",
      value: `${summary.winrate.toFixed(1)}%`,
      hint:
        summary.winrate >= 55
          ? "手感火热"
          : summary.winrate >= 48
            ? "平稳输出"
            : "需要调整",
      valueClass:
        summary.winrate >= 50 ? "text-sky-300" : "text-orange-300",
    },
    {
      key: "kda",
      label: "场均 KDA",
      value: formatNum(summary.avgKda, 2),
      hint: "K+A / D",
    },
  ];

  return (
    <section
      aria-label="关键指标"
      className="panel overflow-hidden"
    >
      <div className="grid grid-cols-2 divide-y divide-white/[0.06] sm:grid-cols-4 sm:divide-x sm:divide-y-0 sm:divide-white/[0.06]">
        {items.map((item) => (
          <div
            key={item.key}
            className="kpi-cell px-4 py-4 md:px-5 md:py-5"
          >
            <p className="text-[11px] font-medium tracking-wide text-white/40">
              {item.label}
            </p>
            <p
              className={`mt-1.5 font-mono text-2xl font-semibold tabular-nums tracking-tight md:text-[1.75rem] ${
                item.valueClass ?? "text-white"
              }`}
            >
              {item.value}
            </p>
            <p className="mt-1 truncate text-[11px] text-white/35">
              {item.hint}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
