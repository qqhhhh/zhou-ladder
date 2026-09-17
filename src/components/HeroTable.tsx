"use client";

import Image from "next/image";
import { useMemo } from "react";
import type { HeroStat } from "@/lib/types";
import { formatPct } from "@/lib/stats";

export function HeroDayCards({ rows }: { rows: HeroStat[] }) {
  const top = useMemo(
    () => [...rows].sort((a, b) => b.games - a.games || b.winrate - a.winrate).slice(0, 7),
    [rows],
  );

  if (top.length === 0) {
    return (
      <div
        id="heroes"
        className="panel scroll-mt-24 px-4 py-8 text-center text-sm text-white/40"
      >
        无英雄数据
      </div>
    );
  }

  return (
    <section id="heroes" className="scroll-mt-24">
      <div className="mb-4 flex items-end justify-between gap-2 px-0.5">
        <div>
          <h2 className="text-base font-semibold text-white">常用英雄</h2>
          <p className="mt-0.5 text-[11px] text-white/40">
            上分 — · 官方天梯分需协调器导出
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-7 lg:gap-4">
        {top.map((r) => (
          <article
            key={r.heroId}
            className="day-card flex flex-col items-center gap-2.5 px-2.5 py-5 text-center sm:py-[1.125rem]"
          >
            <p className="truncate text-[11px] text-white/45 w-full">
              {r.games} 场
            </p>
            {r.iconUrl ? (
              <Image
                src={r.iconUrl}
                alt={r.localizedName}
                width={64}
                height={36}
                className="h-9 w-16 rounded-md object-cover ring-1 ring-white/10"
                unoptimized
              />
            ) : (
              <div className="h-9 w-16 rounded-md bg-white/10" />
            )}
            <p className="w-full truncate text-xs font-medium text-white/90">
              {r.localizedName}
            </p>
            <p className="font-mono text-sm font-semibold tabular-nums text-white">
              {formatPct(r.winrate)}
            </p>
            <p className="text-[10px] text-white/35">
              <span className="text-teal-300/80">{r.wins}</span>
              <span className="mx-0.5 text-white/20">/</span>
              <span className="text-rose-300/80">{r.losses}</span>
              <span className="ml-1.5 text-white/25">上分 —</span>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Full hero table (glass) for remaining detail */
export function HeroTable({ rows }: { rows: HeroStat[] }) {
  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.games - a.games || b.winrate - a.winrate),
    [rows],
  );

  return (
    <div className="panel overflow-hidden">
      <div className="px-5 py-[1.125rem]">
        <h2 className="text-sm font-semibold text-white/90">英雄明细</h2>
        <p className="mt-1 text-[11px] text-white/35">
          「上分」固定为 —：真实天梯分变动需官方协调器导出。
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead className="text-[11px] tracking-wide text-white/35">
            <tr className="border-y border-white/8">
              <th className="px-3 py-2.5 text-left font-medium">英雄</th>
              <th className="px-3 py-2.5 text-right font-medium">上分</th>
              <th className="px-3 py-2.5 text-right font-medium">场次</th>
              <th className="px-3 py-2.5 text-right font-medium">胜-负</th>
              <th className="px-3 py-2.5 text-right font-medium">净胜</th>
              <th className="px-3 py-2.5 text-right font-medium">胜率</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/35">
                  无英雄数据
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <tr
                  key={r.heroId}
                  className="border-t border-white/5 transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-3 py-2.5">
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
                      <span className="font-medium text-white/85">
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
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/80">
                    {formatPct(r.winrate)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
