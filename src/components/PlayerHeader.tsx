"use client";

import Image from "next/image";
import type { OpenDotaPlayer } from "@/lib/types";
import { formatRankTier } from "@/lib/opendota";
import { DateRangeFilter } from "@/components/DateRangeFilter";

export function PlayerHeader({
  player,
  rangeKey,
}: {
  player: OpenDotaPlayer;
  rangeKey: string;
}) {
  const rank = formatRankTier(player.rank_tier, player.leaderboard_rank);

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3.5">
        <div className="relative shrink-0">
          <Image
            src="/zhou-avatar.jpg"
            alt="Zhou / 鲷哥"
            width={64}
            height={64}
            priority
            className="avatar-ring relative rounded-2xl object-cover"
          />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold tracking-tight text-white md:text-2xl">
              {player.profile.personaname}
              <span className="ml-2 text-base font-medium text-amber-300 md:text-lg">
                鲷哥
              </span>
            </h1>
            <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-medium text-amber-100 ring-1 ring-amber-300/40">
              {rank}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-stone-400 md:text-sm">
            oldboys.games · Zhou 天梯看板
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        <DateRangeFilter currentDays={rangeKey} />
        <a
          href="https://www.douyu.com/88660"
          target="_blank"
          rel="noreferrer"
          className="btn-live inline-flex shrink-0 items-center justify-center self-start rounded-full px-4 py-2 text-sm font-semibold sm:self-center"
        >
          直播间 →
        </a>
      </div>
    </header>
  );
}
