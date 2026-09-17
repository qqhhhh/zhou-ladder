"use client";

import type { SummaryStats } from "@/lib/types";
import { formatNum, formatPct } from "@/lib/stats";
import { DashDivider, DashGridOverlay } from "@/components/DashMotion";

export function SummaryCards({
  summary,
  rangeLabel,
}: {
  summary: SummaryStats;
  rangeLabel: string;
}) {
  const metrics = [
    {
      label: "场次",
      value: String(summary.games),
      hint: rangeLabel,
    },
    {
      label: "战绩",
      value: `${summary.wins}-${summary.losses}`,
      hint: `净胜 ${summary.netWins >= 0 ? "+" : ""}${summary.netWins}`,
    },
    {
      label: "胜率",
      value: formatPct(summary.winrate),
      hint: "仅天梯对局",
    },
    {
      label: "场均 KDA",
      value: formatNum(summary.avgKda, 2),
      hint: "(击杀+助攻)/死亡",
    },
  ];

  return (
    <section
      id="overview"
      className="hero-hub relative scroll-mt-24 p-5 md:p-6"
    >
      <DashGridOverlay />

      <div className="relative z-[1]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-amber-700/80">
              总览
            </p>
            <h2 className="mt-0.5 text-2xl font-semibold text-stone-900 md:text-3xl">
              天梯摘要
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-stone-500">
              天梯匹配（官方大厅类型 7）· {rangeLabel}
            </p>
          </div>
          <div className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-900 ring-1 ring-amber-200/80">
            净胜{" "}
            <span className="font-mono font-semibold tabular-nums">
              {summary.netWins >= 0 ? "+" : ""}
              {summary.netWins}
            </span>
          </div>
        </div>

        <div className="my-4">
          <DashDivider />
        </div>

        {/* Single surface KPI row — no nested bordered cards */}
        <div className="grid grid-cols-2 divide-x divide-y divide-stone-100 overflow-hidden rounded-xl bg-stone-50/80 sm:grid-cols-4 sm:divide-y-0">
          {metrics.map((m) => (
            <div key={m.label} className="kpi-cell px-4 py-3.5 md:px-5 md:py-4">
              <div className="text-[11px] tracking-wide text-stone-500">
                {m.label}
              </div>
              <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-stone-900 md:text-[1.75rem]">
                {m.value}
              </div>
              <div className="mt-1 text-xs text-stone-400">{m.hint}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
