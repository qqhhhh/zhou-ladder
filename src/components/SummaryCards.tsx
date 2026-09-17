"use client";

import type { SummaryStats } from "@/lib/types";
import { formatNum } from "@/lib/stats";
import { HeroGlassSheen } from "@/components/glass";

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
      className="hero-hub glass-svg-hero relative min-h-[300px] scroll-mt-24 overflow-hidden p-5 md:min-h-[340px] md:p-6 lg:p-7"
    >
      <HeroGlassSheen />
      <div className="relative z-[2] flex h-full flex-col justify-between gap-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/45">
              天梯摘要 · {rangeLabel}
            </p>
            <div className="mt-4 flex items-end gap-1">
              <span className="font-mono text-7xl font-semibold leading-none tracking-tighter text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)] md:text-8xl">
                {summary.winrate.toFixed(0)}
              </span>
              <span className="mb-2 text-3xl font-medium text-white/45 md:mb-3.5 md:text-4xl">
                %
              </span>
            </div>
            <p className="mt-4 text-xl font-medium tracking-tight text-white/92">
              {form}
            </p>
            <p className="mt-1.5 text-sm leading-snug text-white/45">{formSub}</p>
            <div className="mt-5 flex flex-wrap gap-2">
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

          <div className="hero-note max-w-[12rem] p-3.5 text-[11px] leading-relaxed text-white/55">
            仅统计天梯匹配（大厅类型 7）。胜率对标天气「气温」；胜/负对标
            H/L。不上报伪天梯分。
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
          <div>
            <p className="text-[10px] tracking-wide text-white/40">场次</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-white">
              {summary.games}
            </p>
          </div>
          <div>
            <p className="text-[10px] tracking-wide text-white/40">净胜</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-white">
              {summary.netWins >= 0 ? `+${summary.netWins}` : summary.netWins}
            </p>
          </div>
          <div>
            <p className="text-[10px] tracking-wide text-white/40">场均 KDA</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-white">
              {formatNum(summary.avgKda, 2)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
