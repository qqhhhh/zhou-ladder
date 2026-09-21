"use client";

import type { SummaryStats } from "@/lib/types";
import { formatNum } from "@/lib/stats";
import { WaveLabel } from "@/components/WaveLabel";
import { StartleIconWell } from "@/components/StartleMotion";

const iconCls = "h-[22px] w-[22px]";

/** Shared stroke icons — thin, rounded, one visual language */
function IconMatches() {
  return (
    <svg viewBox="0 0 24 24" className={iconCls} fill="none" aria-hidden>
      <path
        d="M8 7h8M8 12h8M8 17h5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function IconTrend() {
  return (
    <svg viewBox="0 0 24 24" className={iconCls} fill="none" aria-hidden>
      <path
        d="M4 16.5 9.2 11l3.3 3.3L20 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 7H20v5.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconWinrate() {
  return (
    <svg viewBox="0 0 24 24" className={iconCls} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 4a8 8 0 0 1 8 8h-8V4Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function IconScore() {
  return (
    <svg viewBox="0 0 24 24" className={iconCls} fill="none" aria-hidden>
      <path
        d="M8 4v16M16 4v16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M8 8h8M8 12h8M8 16h8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconKda() {
  return (
    <svg viewBox="0 0 24 24" className={iconCls} fill="none" aria-hidden>
      <path
        d="m14.5 4.5 5 5-9.5 9.5H5v-5L14.5 4.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="m12.5 6.5 5 5M5 16.5h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Horizon MiniStatistics / Widget row — Flowbite KPI density */
export function SummaryCards({
  summary,
  rangeLabel,
  ladderScore = null,
}: {
  summary: SummaryStats;
  rangeLabel: string;
  /** Trusted overlay total; null = hide card */
  ladderScore?: number | null;
}) {
  const items = [
    {
      key: "games",
      label: "场次",
      value: String(summary.games),
      hint: rangeLabel,
      icon: <IconMatches />,
      tone: "text-navy-700",
    },
    {
      key: "wl",
      label: "胜负",
      value: `${summary.wins}-${summary.losses}`,
      hint:
        summary.netWins > 0
          ? `净胜 +${summary.netWins}`
          : summary.netWins < 0
            ? `净胜 ${summary.netWins}`
            : "净胜 0",
      icon: <IconTrend />,
      tone:
        summary.netWins > 0
          ? "text-[#05cd99]"
          : summary.netWins < 0
            ? "text-[#ee5d50]"
            : "text-navy-700",
      delta:
        summary.netWins !== 0
          ? {
              up: summary.netWins > 0,
              text:
                summary.netWins > 0
                  ? `+${summary.netWins}`
                  : String(summary.netWins),
            }
          : null,
    },
    {
      key: "wr",
      label: "胜率",
      value: `${summary.winrate.toFixed(1)}%`,
      hint:
        summary.winrate >= 55
          ? "手感火热"
          : summary.winrate >= 48
            ? "平稳输出"
            : "需要调整",
      icon: <IconWinrate />,
      tone: summary.winrate >= 50 ? "text-[#05cd99]" : "text-[#ee5d50]",
      delta: {
        up: summary.winrate >= 50,
        text: `${summary.winrate.toFixed(1)}%`,
      },
    },
    {
      key: "kda",
      label: "场均 KDA",
      value: formatNum(summary.avgKda, 2),
      hint: "K+A / D",
      icon: <IconKda />,
      tone: "text-navy-700",
    },
    ...(ladderScore != null
      ? [
          {
            key: "ladder",
            label: "当前天梯分数",
            value: String(ladderScore),
            hint: "近期英雄有分·可信",
            icon: <IconScore />,
            tone: "text-navy-700",
          },
        ]
      : []),
  ];

  return (
    <section
      aria-label="关键指标"
      className={`grid grid-cols-2 gap-3 md:gap-5 ${ladderScore != null ? "md:grid-cols-5" : "md:grid-cols-4"}`}
    >
      {items.map((item) => (
        <div
          key={item.key}
          className="panel kpi-card flex flex-row items-center gap-3 px-4 py-4 md:gap-4 md:px-5 md:py-[18px]"
        >
          <StartleIconWell>{item.icon}</StartleIconWell>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-muted">
              <WaveLabel text={item.label} />
            </p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-1.5">
              <p
                className={`font-mono text-xl font-bold tabular-nums tracking-tight md:text-[22px] ${item.tone}`}
              >
                <WaveLabel text={item.value} />
              </p>
              {"delta" in item && item.delta ? (
                <span
                  className={`text-xs font-bold tabular-nums ${
                    item.delta.up ? "text-[#05cd99]" : "text-[#ee5d50]"
                  }`}
                >
                  {item.delta.up ? "↑" : "↓"}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-[11px] text-ink-muted/90">
              <WaveLabel text={item.hint} />
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
