"use client";

import { motion } from "framer-motion";
import type { SummaryStats } from "@/lib/types";
import { formatNum, formatPct } from "@/lib/stats";

const cards = (
  s: SummaryStats,
): { label: string; value: string; sub?: string; accent: string; glow: string }[] => [
  {
    label: "场次",
    value: String(s.games),
    accent: "from-cyan-500/35 to-blue-600/10",
    glow: "group-hover:shadow-[0_0_32px_rgba(34,211,238,0.25)]",
  },
  {
    label: "战绩 W-L",
    value: `${s.wins}-${s.losses}`,
    sub: `净胜 ${s.netWins >= 0 ? "+" : ""}${s.netWins}`,
    accent: "from-emerald-500/35 to-teal-600/10",
    glow: "group-hover:shadow-[0_0_32px_rgba(16,185,129,0.25)]",
  },
  {
    label: "胜率",
    value: formatPct(s.winrate),
    accent: "from-violet-500/35 to-fuchsia-600/10",
    glow: "group-hover:shadow-[0_0_32px_rgba(167,139,250,0.25)]",
  },
  {
    label: "场均 KDA",
    value: formatNum(s.avgKda, 2),
    accent: "from-amber-500/40 to-orange-600/15",
    glow: "group-hover:shadow-[0_0_36px_rgba(245,158,11,0.35)]",
  },
];

export function SummaryCards({ summary }: { summary: SummaryStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards(summary).map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`group glass-card kpi-glow relative overflow-hidden bg-gradient-to-br ${c.accent} p-4 ${c.glow}`}
        >
          <div
            className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5 blur-2xl transition group-hover:bg-amber-400/15"
            aria-hidden
          />
          <div className="relative text-xs tracking-wider text-slate-400">
            {c.label}
          </div>
          <div className="relative mt-1 font-mono text-2xl font-semibold text-white tabular-nums drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]">
            {c.value}
          </div>
          {c.sub ? (
            <div className="relative mt-1 text-xs text-slate-400">{c.sub}</div>
          ) : null}
        </motion.div>
      ))}
    </div>
  );
}
