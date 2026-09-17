"use client";

import Image from "next/image";
import type { OpenDotaPlayer } from "@/lib/types";
import { formatRankTier } from "@/lib/opendota";
import { DateRangeFilter } from "@/components/DateRangeFilter";

function todayLabel(): string {
  return new Date().toLocaleDateString("zh-CN", {
    timeZone: "Asia/Shanghai",
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PlayerHeader({
  player,
  rangeKey,
  rangeLabel,
}: {
  player: OpenDotaPlayer;
  rangeKey: string;
  rangeLabel: string;
}) {
  const rank = formatRankTier(player.rank_tier, player.leaderboard_rank);

  return (
    <header
      id="overview"
      className="panel scroll-mt-6 px-4 py-4 md:px-5 md:py-4"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="avatar-ring shrink-0 overflow-hidden rounded-full">
            <Image
              src="/zhou-avatar.jpg"
              alt="Zhou"
              width={48}
              height={48}
              className="h-12 w-12 object-cover"
              priority
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-semibold tracking-tight text-white md:text-xl">
                Zhou
                <span className="ml-2 font-medium text-white/65">鲷哥</span>
              </h1>
              <span className="rank-chip rounded-full px-2.5 py-0.5 text-[11px] text-white/65">
                {rank}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-white/40">
              {todayLabel()}
              <span className="mx-1.5 text-white/20">·</span>
              {rangeLabel}
              <span className="mx-1.5 text-white/20">·</span>
              {player.profile.personaname}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <DateRangeFilter currentDays={rangeKey} variant="pills" />
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="https://www.opendota.com/players/90137663"
              target="_blank"
              rel="noreferrer"
              className="icon-btn"
              title="对局数据源"
              aria-label="对局数据源"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
              </svg>
            </a>
            <a
              href="https://www.douyu.com/88660"
              target="_blank"
              rel="noreferrer"
              className="btn-live inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              直播间
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
