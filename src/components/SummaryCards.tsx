"use client";

import { motion } from "framer-motion";
import type { SummaryStats } from "@/lib/types";
import { formatNum, formatPct } from "@/lib/stats";

const cards = (
  s: SummaryStats,
): { label: string; value: string; sub?: string; accent: string }[] => [
  {
    label: "场次",
    value: String(s.games),
    accent: "from-cyan-500/30 to-blue-600/10",
  },
  {
    label: "战绩 W-L",
    value: `${s.wins}-${s.losses}`,
    sub: `净胜 ${s.netWins >= 0 ? "+" : ""}${s.netWins}`,
    accent: "from-emerald-500/30 to-teal-600/10",
  },
  {
    label: "胜率",
    value: formatPct(s.winrate),
    accent: "from-violet-500/30 to-fuchsia-600/10",
  },
  {
    label: "场均 KDA",
    value: formatNum(s.avgKda, 2),
    accent: "from-amber-500/30 to-orange-600/10",
  },
];

export function SummaryCards({ summary }: { summary: SummaryStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards(summary).map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35 }}
          className={`glass-card relative overflow-hidden bg-gradient-to-br ${c.accent} p-4`}
        >
          <div className="text-xs tracking-wider text-slate-400">{c.label}</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-white tabular-nums">
            {c.value}
          </div>
          {c.sub ? (
            <div className="mt-1 text-xs text-slate-400">{c.sub}</div>
          ) : null}
        </motion.div>
      ))}
    </div>
  );
}
