"use client";

import Image from "next/image";
import { useMemo } from "react";
import type { HeroStat } from "@/lib/types";
import { formatNum, formatPct } from "@/lib/stats";

/** Full-width hero stats table — sticky header, row hover, subtle enter */
export function HeroTable({ rows }: { rows: HeroStat[] }) {
  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.games - a.games || b.winrate - a.winrate),
    [rows],
  );

  return (
    <section id="heroes" className="panel scroll-mt-24 overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-white/[0.06] px-5 py-4 md:px-6">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-white">
            英雄统计
          </h2>
          <p className="mt-1 text-[11px] text-white/40">
            官方中文名 · 「上分」固定为 —（真实天梯分需协调器导出）
          </p>
        </div>
        <span className="text-[11px] text-white/35">
          {sorted.length} 名英雄
        </span>
      </div>

      <div className="hero-table-scroll max-h-[min(70vh,640px)] overflow-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-[rgba(8,10,20,0.92)] text-[11px] tracking-wide text-white/40 backdrop-blur-md">
            <tr className="border-b border-white/[0.08]">
              <th className="px-4 py-3 text-left font-medium md:px-5">英雄</th>
              <th className="px-3 py-3 text-right font-medium">上分</th>
              <th className="px-3 py-3 text-right font-medium">场次</th>
              <th className="px-3 py-3 text-right font-medium">胜-负</th>
              <th className="px-3 py-3 text-right font-medium">净胜</th>
              <th className="px-3 py-3 text-right font-medium">场均 K/D/A</th>
              <th className="px-3 py-3 text-right font-medium">KDA</th>
              <th className="px-4 py-3 text-right font-medium md:px-5">胜率</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-white/35"
                >
                  无英雄数据
                </td>
              </tr>
            ) : (
              sorted.map((r, i) => (
                <tr
                  key={r.heroId}
                  className="hero-row border-t border-white/[0.045] transition-colors hover:bg-white/[0.035]"
                  style={{ animationDelay: `${Math.min(i, 24) * 28}ms` }}
                >
                  <td className="px-4 py-2.5 md:px-5">
                    <div className="flex items-center gap-2.5">
                      {r.iconUrl ? (
                        <Image
                          src={r.iconUrl}
                          alt={r.localizedName}
                          width={48}
                          height={27}
                          className="rounded object-cover ring-1 ring-white/10"
                          unoptimized
                        />
                      ) : (
                        <div className="h-[27px] w-12 rounded bg-white/10" />
                      )}
                      <span className="font-medium text-white/88">
                        {r.localizedName}
                      </span>
                    </div>
                  </td>
                  <td
                    className="px-3 py-2.5 text-right text-white/30"
                    title="需官方协调器导出"
                  >
                    —
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/70">
                    {r.games}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                    <span className="text-teal-300/90">{r.wins}</span>
                    <span className="text-white/20">-</span>
                    <span className="text-rose-300/90">{r.losses}</span>
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right font-mono tabular-nums ${
                      r.netWins > 0
                        ? "text-sky-300"
                        : r.netWins < 0
                          ? "text-rose-300"
                          : "text-white/50"
                    }`}
                  >
                    {r.netWins > 0 ? `+${r.netWins}` : r.netWins}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/55">
                    {formatNum(r.avgKills, 1)}/{formatNum(r.avgDeaths, 1)}/
                    {formatNum(r.avgAssists, 1)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/75">
                    {formatNum(r.kda, 2)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-white/85 md:px-5">
                    {formatPct(r.winrate)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
