"use client";

import { motion } from "framer-motion";
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

  const cards = [
    {
      title: "段位",
      value: rank,
      sub: "OpenDota rank_tier",
    },
    {
      title: "数据新鲜度",
      value: fetchedLocal,
      sub: `缓存约 3 分钟 · ${rangeLabel}`,
    },
    {
      title: "OpenDota 账号",
      value: "90137663",
      sub: "account_id · ranked only",
      mono: true,
      href: "https://www.opendota.com/players/90137663",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((c, i) => {
        const inner = (
          <>
            <p className="text-[11px] uppercase tracking-wider text-teal-300/70">
              {c.title}
            </p>
            <p
              className={`mt-1.5 text-sm font-medium text-white ${
                c.mono ? "font-mono tabular-nums" : ""
              }`}
            >
              {c.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{c.sub}</p>
          </>
        );
        return (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.05, duration: 0.35 }}
            className="glass-card p-4"
          >
            {c.href ? (
              <a
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="block transition hover:text-teal-200"
              >
                {inner}
              </a>
            ) : (
              inner
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
