"use client";

import type { OpenDotaPlayer } from "@/lib/types";
import { formatRankTier } from "@/lib/opendota";

export function MetaCards({
  player,
  fetchedAt,
  rangeLabel,
}: {
  player: OpenDotaPlayer;
  fetchedAt: string;
  rangeLabel: string;
}) {
  const rank = formatRankTier(player.rank_tier, player.leaderboard_rank);
  const fetchedLocal = new Date(fetchedAt).toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
  });

  const items = [
    {
      title: "段位",
      value: rank,
      sub: "奖牌段位（对局数据源）",
    },
    {
      title: "数据新鲜度",
      value: fetchedLocal,
      sub: `缓存约 3 分钟 · ${rangeLabel}`,
    },
    {
      title: "账号编号",
      value: "90137663",
      sub: "仅天梯对局",
      mono: true,
      href: "https://www.opendota.com/players/90137663",
    },
  ];

  return (
    <div className="panel overflow-hidden">
      <div className="grid grid-cols-1 divide-y divide-stone-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((c) => {
          const inner = (
            <>
              <p className="text-[11px] font-medium tracking-wide text-amber-700/80">
                {c.title}
              </p>
              <p
                className={`mt-1.5 text-sm font-medium text-stone-900 ${
                  c.mono ? "font-mono tabular-nums" : ""
                }`}
              >
                {c.value}
              </p>
              <p className="mt-1 text-xs text-stone-400">{c.sub}</p>
            </>
          );
          return (
            <div key={c.title} className="px-4 py-3.5 md:px-5">
              {c.href ? (
                <a
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block transition hover:text-amber-800"
                >
                  {inner}
                </a>
              ) : (
                inner
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
