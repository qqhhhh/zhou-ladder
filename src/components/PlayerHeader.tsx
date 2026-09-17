"use client";

import { motion } from "framer-motion";
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
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="flex items-center gap-3.5">
        <motion.div
          className="relative shrink-0"
          whileHover={{ scale: 1.04 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
        >
          <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-teal-400/45 via-cyan-500/25 to-amber-400/20 blur-md" />
          <Image
            src="/zhou-avatar.jpg"
            alt="Zhou / 鲷哥"
            width={64}
            height={64}
            priority
            className="avatar-ring relative rounded-2xl object-cover"
          />
        </motion.div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold tracking-tight text-white md:text-2xl">
              {player.profile.personaname}
              <span className="ml-2 bg-gradient-to-r from-teal-200 to-cyan-300 bg-clip-text text-base font-medium text-transparent md:text-lg">
                鲷哥
              </span>
            </h1>
            <span className="rounded-full bg-teal-400/12 px-2.5 py-0.5 text-xs font-medium text-teal-100 ring-1 ring-teal-400/35 shadow-[0_0_14px_rgba(45,212,191,0.25)]">
              {rank}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400 md:text-sm">
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
          className="inline-flex shrink-0 items-center justify-center self-start rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_0_24px_rgba(94,234,212,0.25)] transition hover:bg-teal-50 hover:shadow-[0_0_32px_rgba(45,212,191,0.4)] sm:self-center"
        >
          直播间 →
        </a>
      </div>
    </motion.header>
  );
}
