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
  dataSpanDays,
  minDate,
  maxDate,
  customFrom,
  customTo,
}: {
  player: OpenDotaPlayer;
  rangeKey: string;
  rangeLabel: string;
  dataSpanDays: number;
  minDate: string;
  maxDate: string;
  customFrom?: string;
  customTo?: string;
}) {
  const rank = formatRankTier(player.rank_tier, player.leaderboard_rank);

  return (
    <header
      id="overview"
      className="panel scroll-mt-6 px-4 py-4 md:px-6 md:py-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="avatar-ring shrink-0 overflow-hidden rounded-full">
            <Image
              src="/zhou-avatar.jpg"
              alt="Zhou"
              width={52}
              height={52}
              className="h-[52px] w-[52px] object-cover"
              priority
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-bold tracking-tight text-navy-700 md:text-xl">
                Zhou
                <span className="ml-2 font-medium text-ink-faint">鲷哥</span>
              </h1>
              <span className="rank-chip rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                {rank}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-ink-muted">
              {todayLabel()}
              <span className="mx-1.5 text-[#c3cae7]">·</span>
              {rangeLabel}
              <span className="mx-1.5 text-[#c3cae7]">·</span>
              {player.profile.personaname}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <DateRangeFilter
            currentDays={rangeKey}
            dataSpanDays={dataSpanDays}
            minDate={minDate}
            maxDate={maxDate}
            customFrom={customFrom}
            customTo={customTo}
            variant="pills"
          />
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="https://www.douyu.com/88660"
              target="_blank"
              rel="noreferrer"
              className="btn-live inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold"
            >
              直播间
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
