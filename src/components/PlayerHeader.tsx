"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { OpenDotaPlayer } from "@/lib/types";
import { formatRankTier } from "@/lib/opendota";

export function PlayerHeader({
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
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card glass-card-glow flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex items-center gap-4">
        <motion.div
          className="relative"
          whileHover={{ scale: 1.04 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
        >
          <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-amber-400/50 via-orange-500/35 to-cyan-400/25 blur-md" />
          <Image
            src="/zhou-avatar.jpg"
            alt="Zhou / 鲷哥"
            width={80}
            height={80}
            priority
            className="avatar-ring relative rounded-2xl object-cover"
          />
        </motion.div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              {player.profile.personaname}
              <span className="ml-2 bg-gradient-to-r from-amber-200 to-orange-300 bg-clip-text text-lg font-medium text-transparent">
                鲷哥
              </span>
            </h1>
            <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-medium text-amber-200 ring-1 ring-amber-400/40 shadow-[0_0_16px_rgba(245,158,11,0.25)]">
              {rank}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            oldboys.games · Zhou 天梯看板 · account{" "}
            <span className="font-mono text-slate-300">90137663</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            数据范围：{rangeLabel} · 缓存刷新约 3 分钟 · 拉取于 {fetchedLocal}{" "}
            (CST)
          </p>
        </div>
      </div>
      <a
        href={player.profile.profileurl}
        target="_blank"
        rel="noreferrer"
        className="self-start rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/10 px-4 py-2 text-sm text-amber-100 ring-1 ring-amber-400/30 transition hover:from-amber-500/25 hover:to-orange-500/20 hover:text-white hover:shadow-[0_0_24px_rgba(245,158,11,0.3)] md:self-center"
      >
        Steam 主页 →
      </a>
    </motion.header>
  );
}
