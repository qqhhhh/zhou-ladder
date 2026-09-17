"use client";

import type { OpenDotaPlayer } from "@/lib/types";
import { formatRankTier } from "@/lib/opendota";

function todayLabel(): string {
  return new Date().toLocaleDateString("zh-CN", {
    timeZone: "Asia/Shanghai",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PlayerHeader({
  player,
  rangeLabel,
}: {
  player: OpenDotaPlayer;
  rangeKey: string;
  rangeLabel: string;
}) {
  const rank = formatRankTier(player.rank_tier, player.leaderboard_rank);

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 text-sky-300/80"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
          </svg>
          <h1 className="truncate text-xl font-semibold tracking-tight text-white md:text-2xl">
            Zhou
            <span className="ml-2 font-medium text-white/70">鲷哥</span>
          </h1>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-white/60">
            {rank}
          </span>
        </div>
        <p className="mt-1.5 text-sm text-white/45">
          {todayLabel()}
          <span className="mx-2 text-white/20">·</span>
          {rangeLabel}
        </p>
        <p className="mt-0.5 text-xs text-white/30">
          {player.profile.personaname} · oldboys.games
        </p>
      </div>

      <a
        href="https://www.douyu.com/88660"
        target="_blank"
        rel="noreferrer"
        className="btn-live inline-flex shrink-0 items-center justify-center self-start rounded-full px-5 py-2.5 text-sm font-semibold"
      >
        直播间
      </a>
    </header>
  );
}
