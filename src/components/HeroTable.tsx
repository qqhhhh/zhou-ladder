"use client";

import Image from "next/image";
import { useMemo } from "react";
import type { HeroStat } from "@/lib/types";
import { formatNum, formatPct } from "@/lib/stats";
import { WaveLabel } from "@/components/WaveLabel";
import { StartleAvatar } from "@/components/StartleMotion";

/** Horizon Complex Table + Mantine thin-divider polish */
export function HeroTable({ rows }: { rows: HeroStat[] }) {
  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.games - a.games || b.winrate - a.winrate),
    [rows],
  );

  const headers = [
    { key: "hero", label: "英雄", align: "left" as const },
    { key: "games", label: "场次", align: "right" as const },
    { key: "wl", label: "胜-负", align: "right" as const },
    { key: "net", label: "净胜", align: "right" as const },
    { key: "k", label: "场均击杀", align: "right" as const },
    { key: "d", label: "场均死亡", align: "right" as const },
    { key: "a", label: "场均助攻", align: "right" as const },
    { key: "kda", label: "KDA", align: "right" as const },
    { key: "wr", label: "胜率", align: "right" as const },
  ];

  return (
    <section id="heroes" className="panel scroll-mt-24 overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-2 px-5 pb-2 pt-5 md:px-6 md:pt-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-navy-700">
            <WaveLabel text="英雄统计" />
          </h2>
          <p className="mt-1 text-[11px] text-ink-muted">
            <WaveLabel text="官方中文名" />
          </p>
        </div>
        <span className="rounded-full bg-light-primary px-3 py-1 text-[11px] font-bold text-ink-faint">
          <WaveLabel text={`${sorted.length} 名英雄`} />
        </span>
      </div>

      <div className="hero-table-scroll mt-2 max-h-[min(70vh,640px)] overflow-auto px-2 md:px-3">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
            <tr>
              {headers.map((h) => (
                <th
                  key={h.key}
                  className={`hz-th px-3 py-3 ${
                    h.align === "left" ? "px-4 text-left md:px-5" : "text-right"
                  } ${h.key === "wr" ? "px-4 md:px-5" : ""}`}
                >
                  <WaveLabel text={h.label} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-ink-muted"
                >
                  <WaveLabel text="无英雄数据" />
                </td>
              </tr>
            ) : (
              sorted.map((r, i) => (
                <tr
                  key={r.heroId}
                  className="hero-row transition-colors hover:bg-light-primary/80"
                  style={{ animationDelay: `${Math.min(i, 24) * 24}ms` }}
                >
                  <td className="hz-td px-4 py-3 md:px-5">
                    <div className="flex items-center gap-2.5">
                      {r.iconUrl ? (
                        <StartleAvatar className="shrink-0">
                          <Image
                            src={r.iconUrl}
                            alt={r.localizedName}
                            width={48}
                            height={27}
                            className="rounded-lg object-cover shadow-sm ring-1 ring-[#e9edf7]"
                            unoptimized
                          />
                        </StartleAvatar>
                      ) : (
                        <div className="h-[27px] w-12 rounded-lg bg-light-primary" />
                      )}
                      <span className="font-bold text-navy-700">
                        <WaveLabel text={r.localizedName} />
                      </span>
                    </div>
                  </td>
                  <td className="hz-td px-3 py-3 text-right font-mono font-bold tabular-nums text-navy-700">
                    <WaveLabel text={String(r.games)} />
                  </td>
                  <td className="hz-td px-3 py-3 text-right font-mono tabular-nums">
                    <span className="font-bold text-[#05cd99]">
                      <WaveLabel text={String(r.wins)} />
                    </span>
                    <span className="text-[#c3cae7]">-</span>
                    <span className="font-bold text-[#ee5d50]">
                      <WaveLabel text={String(r.losses)} />
                    </span>
                  </td>
                  <td
                    className={`hz-td px-3 py-3 text-right font-mono font-bold tabular-nums ${
                      r.netWins > 0
                        ? "text-[#05cd99]"
                        : r.netWins < 0
                          ? "text-[#ee5d50]"
                          : "text-ink-muted"
                    }`}
                  >
                    <WaveLabel
                      text={r.netWins > 0 ? `+${r.netWins}` : String(r.netWins)}
                    />
                  </td>
                  <td className="hz-td px-3 py-3 text-right font-mono tabular-nums text-navy-700">
                    <WaveLabel text={formatNum(r.avgKills, 1)} />
                  </td>
                  <td className="hz-td px-3 py-3 text-right font-mono tabular-nums text-navy-700">
                    <WaveLabel text={formatNum(r.avgDeaths, 1)} />
                  </td>
                  <td className="hz-td px-3 py-3 text-right font-mono tabular-nums text-navy-700">
                    <WaveLabel text={formatNum(r.avgAssists, 1)} />
                  </td>
                  <td className="hz-td px-3 py-3 text-right font-mono font-bold tabular-nums text-navy-700">
                    <WaveLabel text={formatNum(r.kda, 2)} />
                  </td>
                  <td className="hz-td px-4 py-3 text-right font-mono font-bold tabular-nums text-navy-700 md:px-5">
                    <WaveLabel text={formatPct(r.winrate)} />
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
