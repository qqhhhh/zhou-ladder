"use client";

import { motion } from "framer-motion";
import type { SummaryStats } from "@/lib/types";
import { formatNum, formatPct } from "@/lib/stats";

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
      label: "战绩 W-L",
      value: `${summary.wins}-${summary.losses}`,
      hint: `净胜 ${summary.netWins >= 0 ? "+" : ""}${summary.netWins}`,
    },
    {
      label: "胜率",
      value: formatPct(summary.winrate),
      hint: "ranked only",
    },
    {
      label: "场均 KDA",
      value: formatNum(summary.avgKda, 2),
      hint: "(K+A)/D",
    },
  ];

  return (
    <motion.section
      id="overview"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="hero-hub relative scroll-mt-24 rounded-[1.35rem] p-5 md:p-7"
    >
      <div
        className="hub-orb -left-10 -top-16 h-48 w-48 bg-teal-400/35"
        aria-hidden
      />
      <div
        className="hub-orb -bottom-16 -right-8 h-40 w-40 bg-amber-400/20"
        aria-hidden
      />
      <div
        className="hub-orb right-1/3 top-0 h-24 w-24 bg-cyan-300/25"
        aria-hidden
      />

      <div className="relative z-[1]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-300/80">
              Overview Hub
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white md:text-3xl">
              总览摘要
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-slate-400">
              lobby_type=7 天梯对局 · {rangeLabel}
            </p>
          </div>
          <div className="rounded-full bg-teal-400/10 px-3 py-1 text-xs text-teal-100 ring-1 ring-teal-400/30">
            净胜{" "}
            <span className="font-mono font-semibold tabular-nums">
              {summary.netWins >= 0 ? "+" : ""}
              {summary.netWins}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.06, duration: 0.35 }}
              whileHover={{ y: -3 }}
              className="glass-card kpi-glow relative overflow-hidden p-4"
            >
              <div
                className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-teal-400/10 blur-xl"
                aria-hidden
              />
              <div className="relative text-[11px] tracking-wider text-slate-400">
                {m.label}
              </div>
              <div className="relative mt-1.5 font-mono text-2xl font-semibold tabular-nums text-white drop-shadow-[0_0_14px_rgba(94,234,212,0.25)] md:text-3xl">
                {m.value}
              </div>
              <div className="relative mt-1 text-xs text-slate-500">{m.hint}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
