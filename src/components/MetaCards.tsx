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

  return (
    <div className="panel relative overflow-hidden p-6">
      {/* abstract ripple / radar feel */}
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        aria-hidden
      >
        <div className="absolute left-1/2 top-[42%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
        <div className="absolute left-1/2 top-[42%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
        <div className="absolute left-1/2 top-[42%] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400/25" />
        <div className="absolute left-1/2 top-[42%] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/80 shadow-[0_0_12px_rgba(126,200,255,0.5)]" />
      </div>

      <div className="relative z-[1]">
        <p className="text-[11px] tracking-wide text-white/40">段位 / 账号</p>
        <p className="mt-2.5 text-2xl font-semibold tracking-tight text-white">
          {rank}
        </p>
        <p className="mt-1 text-sm text-white/45">奖牌段位 · 对局数据源</p>

        <div className="mt-6 space-y-3.5 border-t border-white/10 pt-5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-white/40">账号</span>
            <a
              href="https://www.opendota.com/players/90137663"
              target="_blank"
              rel="noreferrer"
              className="font-mono tabular-nums text-sky-300/90 hover:text-sky-200"
            >
              90137663
            </a>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-white/40">范围</span>
            <span className="text-white/70">{rangeLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-white/40">更新</span>
            <span className="text-right text-xs text-white/55">{fetchedLocal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
