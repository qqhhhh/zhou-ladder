"use client";

import Image from "next/image";
import type { OpenDotaPlayer } from "@/lib/types";
import type { RangeState } from "@/lib/range";
import { formatRankTier } from "@/lib/opendota";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { WaveLabel } from "@/components/WaveLabel";

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
  onRangeChange,
  historyHint,
  minDate,
  maxDate,
  customFrom,
  customTo,
}: {
  player: OpenDotaPlayer;
  rangeKey: string;
  rangeLabel: string;
  onRangeChange: (range: RangeState) => void;
  historyHint?: string;
  minDate?: string;
  maxDate?: string;
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
                <WaveLabel text="Zhou" />
                <span className="ml-2 font-medium text-ink-faint">
                  <WaveLabel text="鲷哥" />
                </span>
              </h1>
              <span className="rank-chip rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                <WaveLabel text={rank} />
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-ink-muted">
              <WaveLabel text={todayLabel()} />
              <span className="mx-1.5 text-[#c3cae7]">·</span>
              <WaveLabel text={rangeLabel} />
              <span className="mx-1.5 text-[#c3cae7]">·</span>
              <WaveLabel text={player.profile.personaname} />
            </p>
            {historyHint ? (
              <p className="mt-0.5 text-[10px] text-ink-faint">
                <WaveLabel text={historyHint} />
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
          <DateRangeFilter
            currentDays={rangeKey}
            minDate={minDate}
            maxDate={maxDate}
            customFrom={customFrom}
            customTo={customTo}
            onRangeChange={onRangeChange}
          />
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="https://www.douyu.com/88660"
              target="_blank"
              rel="noreferrer"
              className="btn-live inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold"
            >
              <WaveLabel text="直播间" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
