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
    <div className="panel p-5 md:p-6">
      <p className="text-sm font-medium text-ink-muted">段位</p>
      <p className="mt-2 text-xl font-bold tracking-tight text-navy-700">
        {rank}
      </p>
      <p className="mt-1 text-sm text-ink-faint">奖牌段位</p>

      <div className="mt-5 space-y-3 border-t border-[#e9edf7] pt-4">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-ink-muted">范围</span>
          <span className="font-medium text-navy-700">{rangeLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-ink-muted">更新</span>
          <span className="text-right text-xs text-ink-faint">{fetchedLocal}</span>
        </div>
        <p className="pt-1 text-[11px] leading-relaxed text-ink-muted">
          仅统计天梯匹配。
        </p>
      </div>
    </div>
  );
}
