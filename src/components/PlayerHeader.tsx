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
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-cyan-400/40 to-violet-500/40 blur" />
          <Image
            src={player.profile.avatarfull}
            alt={player.profile.personaname}
            width={72}
            height={72}
            className="relative rounded-2xl ring-2 ring-white/20"
            unoptimized
          />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              {player.profile.personaname}
              <span className="ml-2 text-lg font-medium text-cyan-300/90">
                鲷哥
              </span>
            </h1>
            <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-medium text-amber-200 ring-1 ring-amber-400/30">
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
        className="self-start rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white md:self-center"
      >
        Steam 主页 →
      </a>
    </motion.header>
  );
}
