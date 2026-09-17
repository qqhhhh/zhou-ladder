"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/lib/types";
import type { SummaryStats } from "@/lib/types";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    payload: ChartPoint;
    value: number;
    name: string;
    color: string;
  }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  return (
    <div className="chart-tooltip min-w-[180px] text-sm">
      <div className="mb-1.5 border-b border-white/10 pb-1.5 text-xs text-white/50">
        {p
          ? `#${p.index} · ${p.dateLabel} · ${p.hero} · ${p.result}`
          : `#${label}`}
      </div>
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li
            key={entry.name}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-2 text-white/60">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-mono tabular-nums text-white">
              {entry.name === "滚动胜率%"
                ? `${Number(entry.value).toFixed(1)}%`
                : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WinChart({
  points,
  summary,
}: {
  points: ChartPoint[];
  summary?: SummaryStats;
}) {
  if (points.length === 0) {
    return (
      <div
        id="trend"
        className="panel flex h-full min-h-72 scroll-mt-24 items-center justify-center text-white/40"
      >
        所选范围内暂无天梯对局
      </div>
    );
  }

  const last = points[points.length - 1];
  const first = points[0];
  const delta = last.cumulativeNetWins - (first?.cumulativeNetWins ?? 0);
  const wr =
    last.rollingWinrate != null ? last.rollingWinrate : summary?.winrate ?? 0;
  const wrDelta =
    points.length > 5 && points[points.length - 6]?.rollingWinrate != null
      ? wr - (points[points.length - 6].rollingWinrate as number)
      : null;

  return (
    <div
      id="trend"
      className="panel flex h-full scroll-mt-24 flex-col p-5 md:p-[1.375rem]"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-white">
            走势图
          </h2>
          <p className="mt-1 text-[11px] leading-snug text-white/40">
            累计净胜 / 滚动胜率 ·{" "}
            <span className="text-orange-300/90">不是真实天梯分</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {wrDelta != null && (
            <span
              className={`text-sm font-semibold tabular-nums ${
                wrDelta >= 0 ? "text-sky-300" : "text-rose-300"
              }`}
            >
              {wrDelta >= 0 ? "↑" : "↓"} {Math.abs(wrDelta).toFixed(1)}%
            </span>
          )}
          <span className="badge-warn">{delta >= 0 ? "上行" : "下行"}</span>
        </div>
      </div>

      <div className="min-h-0 flex-1" style={{ height: 230 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={points}
            margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="netGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#5b9dff" />
                <stop offset="55%" stopColor="#8eb8ff" />
                <stop offset="100%" stopColor="#ff8a4c" />
              </linearGradient>
              <linearGradient id="netArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5b9dff" stopOpacity={0.28} />
                <stop offset="55%" stopColor="#ff8a4c" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#ff8a4c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="3 10"
              vertical={false}
            />
            <XAxis
              dataKey="index"
              tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="net"
              tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <YAxis yAxisId="wr" orientation="right" domain={[0, 100]} hide />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "rgba(255,255,255,0.12)", strokeWidth: 1 }}
            />
            <Area
              yAxisId="net"
              type="monotone"
              dataKey="cumulativeNetWins"
              name="累计净胜"
              stroke="none"
              fill="url(#netArea)"
              fillOpacity={1}
              isAnimationActive={false}
            />
            <Line
              yAxisId="net"
              type="monotone"
              dataKey="cumulativeNetWins"
              name="累计净胜"
              stroke="url(#netGrad)"
              strokeWidth={2.75}
              dot={false}
              activeDot={{
                r: 4.5,
                fill: "#ff8a4c",
                stroke: "rgba(255,255,255,0.9)",
                strokeWidth: 1.5,
              }}
            />
            <Line
              yAxisId="wr"
              type="monotone"
              dataKey="rollingWinrate"
              name="滚动胜率%"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth={1.5}
              strokeDasharray="4 5"
              dot={false}
              connectNulls
              activeDot={{ r: 3, fill: "rgba(255,255,255,0.65)" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/8 pt-4">
        <div className="flex items-center gap-2.5 text-xs text-white/55">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/8 bg-white/[0.05] text-[10px]">
            场
          </span>
          <div>
            <p className="text-[10px] text-white/35">场次</p>
            <p className="font-mono tabular-nums text-white/85">
              {summary?.games ?? points.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-white/55">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/8 bg-white/[0.05] text-[10px]">
            净
          </span>
          <div>
            <p className="text-[10px] text-white/35">累计净胜</p>
            <p className="font-mono tabular-nums text-white/85">
              {last.cumulativeNetWins >= 0 ? "+" : ""}
              {last.cumulativeNetWins}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-white/55">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/8 bg-white/[0.05] text-[10px]">
            率
          </span>
          <div>
            <p className="text-[10px] text-white/35">滚动胜率</p>
            <p className="font-mono tabular-nums text-white/85">
              {wr.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
