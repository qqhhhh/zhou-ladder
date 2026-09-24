"use client";

import type { ChartPoint } from "@/lib/types";
import type { OverlayScorePayload } from "@/lib/parseOverlayScore";
import { overlayDeltaForMatch } from "@/lib/overlayScore";
import { WaveLabel } from "@/components/WaveLabel";

function formatDelta(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

export function RecentMatches({
  points,
  overlayScore = null,
  limit = 8,
  compact = false,
}: {
  points: ChartPoint[];
  overlayScore?: OverlayScorePayload | null;
  /** How many recent rows to show. */
  limit?: number;
  /** Shrunk pane: only 胜负 + 英雄 + 分数. */
  compact?: boolean;
}) {
  const recent = [...points].reverse().slice(0, Math.max(1, limit));

  return (
    <div
      id="recent"
      className="panel scroll-mt-24 flex h-full flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 pb-1 pt-4">
        <h2 className="text-lg font-bold tracking-tight text-navy-700">
          <WaveLabel text="近期对局" />
        </h2>
        <span className="text-[11px] font-medium text-ink-muted">
          <WaveLabel text={`最近 ${recent.length} 场`} />
        </span>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {recent.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-ink-muted">
            <WaveLabel text="暂无对局" />
          </li>
        ) : (
          recent.map((p) => {
            const win = p.result === "胜";
            const delta = overlayDeltaForMatch(p.match_id, p.hero, overlayScore);
            const deltaPositive = delta != null && delta > 0;
            const deltaNegative = delta != null && delta < 0;
            return (
              <li
                key={`${p.index}-${p.date}`}
                className={`recent-row flex items-center gap-3 px-5 ${compact ? "py-2" : "py-1.5"}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold ${
                    win
                      ? "bg-[rgba(5,205,153,0.12)] text-[#05cd99]"
                      : "bg-[rgba(238,93,80,0.1)] text-[#ee5d50]"
                  }`}
                >
                  <WaveLabel text={p.result} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy-700">
                    <WaveLabel text={p.hero} />
                  </p>
                  {!compact ? (
                    <p className="truncate text-[11px] text-ink-muted">
                      <WaveLabel text={`#${p.index} · ${p.dateLabel}`} />
                    </p>
                  ) : null}
                </div>
                {delta != null ? (
                  <span
                    className={`shrink-0 text-sm font-bold tabular-nums ${
                      deltaPositive
                        ? "text-[#05cd99]"
                        : deltaNegative
                          ? "text-[#ee5d50]"
                          : "text-ink-muted"
                    }`}
                  >
                    <WaveLabel text={formatDelta(delta)} />
                  </span>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
