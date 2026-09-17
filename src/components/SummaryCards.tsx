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
  const form =
    summary.winrate >= 55
      ? "手感火热"
      : summary.winrate >= 48
        ? "平稳输出"
        : "需要调整";
  const formSub =
    summary.netWins > 0
      ? `净胜 +${summary.netWins} · 继续保持`
      : summary.netWins < 0
        ? `净胜 ${summary.netWins} · 稳住节奏`
        : "净胜持平 · 细磨细节";

  return (
    <section
      id="overview"
      className="hero-hub relative min-h-[280px] scroll-mt-24 p-5 md:min-h-[320px] md:p-7"
    >
      <div className="relative z-[1] flex h-full flex-col justify-between gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-white/45">
              天梯摘要 · {rangeLabel}
            </p>
            <div className="mt-3 flex items-end gap-1">
              <span className="font-mono text-6xl font-semibold leading-none tracking-tight text-white md:text-7xl">
                {summary.winrate.toFixed(0)}
              </span>
              <span className="mb-2 text-2xl font-medium text-white/50 md:mb-3 md:text-3xl">
                %
              </span>
            </div>
            <p className="mt-3 text-lg font-medium text-white/90">{form}</p>
            <p className="mt-1 text-sm text-white/45">{formSub}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="stat-pill">
                胜{" "}
                <strong className="font-mono text-teal-300">{summary.wins}</strong>
              </span>
              <span className="stat-pill">
                负{" "}
                <strong className="font-mono text-rose-300">{summary.losses}</strong>
              </span>
            </div>
          </div>

          <div className="max-w-[11rem] rounded-2xl border border-white/10 bg-black/25 p-3 text-[11px] leading-relaxed text-white/50 backdrop-blur-sm">
            仅统计天梯匹配（大厅类型 7）。胜率对标天气「气温」；胜/负对标
            H/L。不上报伪天梯分。
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
          <div>
            <p className="text-[11px] text-white/40">场次</p>
            <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-white">
              {summary.games}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-white/40">净胜</p>
            <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-white">
              {summary.netWins >= 0 ? `+${summary.netWins}` : summary.netWins}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-white/40">场均 KDA</p>
            <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-white">
              {formatNum(summary.avgKda, 2)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
