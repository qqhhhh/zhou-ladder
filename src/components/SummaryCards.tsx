"use client";

import type { SummaryStats } from "@/lib/types";
import { formatNum } from "@/lib/stats";

/** Horizon MiniStatistics / Widget row — Flowbite KPI density */
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
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
        </svg>
      ),
      tone: "text-navy-700",
    },
    {
      key: "wl",
      label: "胜负",
      value: `${summary.wins}-${summary.losses}`,
      hint:
        summary.netWins > 0
          ? `净胜 +${summary.netWins}`
          : summary.netWins < 0
            ? `净胜 ${summary.netWins}`
            : "净胜 0",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" />
        </svg>
      ),
      tone:
        summary.netWins > 0
          ? "text-[#05cd99]"
          : summary.netWins < 0
            ? "text-[#ee5d50]"
            : "text-navy-700",
      delta:
        summary.netWins !== 0
          ? {
              up: summary.netWins > 0,
              text:
                summary.netWins > 0
                  ? `+${summary.netWins}`
                  : String(summary.netWins),
            }
          : null,
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
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      ),
      tone: summary.winrate >= 50 ? "text-[#05cd99]" : "text-[#ee5d50]",
      delta: {
        up: summary.winrate >= 50,
        text: `${summary.winrate.toFixed(1)}%`,
      },
    },
    {
      key: "kda",
      label: "场均 KDA",
      value: formatNum(summary.avgKda, 2),
      hint: "K+A / D",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ),
      tone: "text-navy-700",
    },
  ];

  return (
    <section
      aria-label="关键指标"
      className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5"
    >
      {items.map((item) => (
        <div
          key={item.key}
          className="panel kpi-card flex flex-row items-center gap-3 px-4 py-4 md:gap-4 md:px-5 md:py-[18px]"
        >
          <div className="stat-icon">{item.icon}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-muted">
              {item.label}
            </p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-1.5">
              <p
                className={`font-mono text-xl font-bold tabular-nums tracking-tight md:text-[22px] ${item.tone}`}
              >
                {item.value}
              </p>
              {"delta" in item && item.delta ? (
                <span
                  className={`text-xs font-bold tabular-nums ${
                    item.delta.up ? "text-[#05cd99]" : "text-[#ee5d50]"
                  }`}
                >
                  {item.delta.up ? "↑" : "↓"}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-[11px] text-ink-muted/90">
              {item.hint}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
