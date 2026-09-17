"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { HeroStat } from "@/lib/types";
import { formatNum, formatPct } from "@/lib/stats";

type SortKey =
  | "games"
  | "netWins"
  | "winrate"
  | "kda"
  | "localizedName"
  | "wins";

export function HeroTable({ rows }: { rows: HeroStat[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("games");
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return asc
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
    return copy;
  }, [rows, sortKey, asc]);

  function toggle(key: SortKey) {
    if (sortKey === key) setAsc(!asc);
    else {
      setSortKey(key);
      setAsc(false);
    }
  }

  const th = (key: SortKey, label: string, align: "left" | "right" = "right") => (
    <th className={`px-3 py-2.5 font-medium ${align === "left" ? "text-left" : "text-right"}`}>
      <button
        type="button"
        onClick={() => toggle(key)}
        className={`inline-flex items-center gap-1 hover:text-teal-200 ${
          sortKey === key ? "text-teal-300" : "text-slate-400"
        }`}
      >
        {label}
        {sortKey === key ? (asc ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );

  return (
    <motion.div
      id="heroes"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.45 }}
      className="glass-card scroll-mt-24 overflow-hidden"
    >
      <div className="border-b border-teal-400/10 bg-gradient-to-r from-teal-500/8 via-transparent to-amber-500/5 px-4 py-3 md:px-5">
        <h2 className="text-lg font-semibold text-white">英雄统计</h2>
        <p className="mt-1 text-xs text-slate-400">
          「上分」列固定为 —：真实天梯分变动需 Steam Game Coordinator
          导出，本站不使用 computed_mmr 冒充天梯分。
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wide">
            <tr>
              {th("localizedName", "英雄", "left")}
              <th className="px-3 py-2.5 text-right font-medium text-slate-400">
                上分
              </th>
              {th("games", "计数")}
              {th("wins", "W-L")}
              {th("netWins", "净胜")}
              <th className="px-3 py-2.5 text-right font-medium text-slate-400">
                场均 K/D/A
              </th>
              {th("kda", "KDA")}
              {th("winrate", "胜率")}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  无英雄数据
                </td>
              </tr>
            ) : (
              sorted.map((r, i) => (
                <motion.tr
                  key={r.heroId}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.025, 0.35), duration: 0.3 }}
                  whileHover={{
                    backgroundColor: "rgba(45, 212, 191, 0.07)",
                  }}
                  className={`border-t border-white/5 transition-colors ${
                    i % 2 === 0 ? "bg-white/[0.02]" : ""
                  }`}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      {r.iconUrl ? (
                        <Image
                          src={r.iconUrl}
                          alt={r.localizedName}
                          width={54}
                          height={30}
                          className="rounded object-cover ring-1 ring-white/10"
                          unoptimized
                        />
                      ) : (
                        <div className="h-[30px] w-[54px] rounded bg-slate-700" />
                      )}
                      <span className="font-medium text-slate-100">
                        {r.localizedName}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-500" title="需 GC 导出">
                    —
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-200">
                    {r.games}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                    <span className="text-emerald-400">{r.wins}</span>
                    <span className="text-slate-500">-</span>
                    <span className="text-rose-400">{r.losses}</span>
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right font-mono tabular-nums ${
                      r.netWins > 0
                        ? "text-teal-300"
                        : r.netWins < 0
                          ? "text-rose-300"
                          : "text-slate-300"
                    }`}
                  >
                    {r.netWins > 0 ? `+${r.netWins}` : r.netWins}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-300">
                    {formatNum(r.avgKills)}/{formatNum(r.avgDeaths)}/
                    {formatNum(r.avgAssists)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-teal-200">
                    {formatNum(r.kda, 2)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex flex-col items-end gap-1">
                      <span className="font-mono tabular-nums text-slate-100">
                        {formatPct(r.winrate)}
                      </span>
                      <span className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
                        <span
                          className="block h-full rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 to-amber-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]"
                          style={{ width: `${Math.min(100, r.winrate)}%` }}
                        />
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
