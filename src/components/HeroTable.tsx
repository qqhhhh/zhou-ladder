"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { HeroStat } from "@/lib/types";
import { formatNum, formatPct } from "@/lib/stats";
import { DashDivider } from "@/components/DashMotion";

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
        return asc ? av.localeCompare(bv, "zh-CN") : bv.localeCompare(av, "zh-CN");
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

  const th = (
    key: SortKey,
    label: string,
    align: "left" | "right" = "right",
  ) => (
    <th
      className={`px-3 py-2.5 font-medium ${align === "left" ? "text-left" : "text-right"}`}
    >
      <button
        type="button"
        onClick={() => toggle(key)}
        className={`inline-flex items-center gap-1 hover:text-amber-800 ${
          sortKey === key ? "text-amber-700" : "text-stone-400"
        }`}
      >
        {label}
        {sortKey === key ? (asc ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );

  return (
    <div id="heroes" className="panel scroll-mt-24 overflow-hidden">
      <div className="px-4 py-3 md:px-5">
        <h2 className="text-lg font-semibold text-stone-900">英雄统计</h2>
        <p className="mt-1 text-xs text-stone-500">
          「上分」列固定为 —：真实天梯分变动需游戏官方协调器导出，本站不使用估算分冒充天梯分。
        </p>
        <div className="mt-3">
          <DashDivider />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="bg-stone-50 text-xs tracking-wide">
            <tr>
              {th("localizedName", "英雄", "left")}
              <th className="px-3 py-2.5 text-right font-medium text-stone-400">
                上分
              </th>
              {th("games", "场次")}
              {th("wins", "胜-负")}
              {th("netWins", "净胜")}
              <th className="px-3 py-2.5 text-right font-medium text-stone-400">
                场均 击/死/助
              </th>
              {th("kda", "KDA")}
              {th("winrate", "胜率")}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-stone-400"
                >
                  无英雄数据
                </td>
              </tr>
            ) : (
              sorted.map((r, i) => (
                <tr
                  key={r.heroId}
                  className={`border-t border-stone-100 transition-colors hover:bg-amber-50/50 ${
                    i % 2 === 0 ? "bg-white" : "bg-stone-50/40"
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
                          className="rounded object-cover ring-1 ring-stone-200"
                          unoptimized
                        />
                      ) : (
                        <div className="h-[30px] w-[54px] rounded bg-stone-200" />
                      )}
                      <span className="font-medium text-stone-800">
                        {r.localizedName}
                      </span>
                    </div>
                  </td>
                  <td
                    className="px-3 py-2.5 text-right text-stone-400"
                    title="需官方协调器导出"
                  >
                    —
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-stone-700">
                    {r.games}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                    <span className="text-emerald-600">{r.wins}</span>
                    <span className="text-stone-300">-</span>
                    <span className="text-rose-500">{r.losses}</span>
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right font-mono tabular-nums ${
                      r.netWins > 0
                        ? "text-amber-700"
                        : r.netWins < 0
                          ? "text-rose-500"
                          : "text-stone-600"
                    }`}
                  >
                    {r.netWins > 0 ? `+${r.netWins}` : r.netWins}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-stone-600">
                    {formatNum(r.avgKills)}/{formatNum(r.avgDeaths)}/
                    {formatNum(r.avgAssists)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-stone-800">
                    {formatNum(r.kda, 2)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex flex-col items-end gap-1">
                      <span className="font-mono tabular-nums text-stone-800">
                        {formatPct(r.winrate)}
                      </span>
                      <span className="h-1 w-16 overflow-hidden rounded-full bg-stone-200">
                        <span
                          className="block h-full rounded-full bg-amber-500"
                          style={{ width: `${Math.min(100, r.winrate)}%` }}
                        />
                      </span>
                    </div>
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
