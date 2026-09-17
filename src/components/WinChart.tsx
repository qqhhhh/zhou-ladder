"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/lib/types";
import { DashDivider } from "@/components/DashMotion";

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
    <div className="chart-tooltip min-w-[180px] text-sm text-stone-800">
      <div className="mb-1.5 border-b border-amber-200/60 pb-1.5 text-xs text-amber-800/90">
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
            <span className="flex items-center gap-2 text-stone-600">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-mono tabular-nums text-stone-900">
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

export function WinChart({ points }: { points: ChartPoint[] }) {
  if (points.length === 0) {
    return (
      <div
        id="trend"
        className="panel flex h-full min-h-72 scroll-mt-24 items-center justify-center text-stone-400"
      >
        所选范围内暂无天梯对局
      </div>
    );
  }

  return (
    <div
      id="trend"
      className="panel flex h-full scroll-mt-24 flex-col p-4 md:p-5"
    >
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">走势图</h2>
          <p className="mt-1 text-xs text-stone-500">
            累计净胜场 / 滚动胜率（近 20 场）·{" "}
            <strong className="text-amber-700">不是真实天梯分</strong>
            ，对局数据源无法提供官方天梯分导出
          </p>
        </div>
      </div>
      <DashDivider className="mb-3" />
      <div className="h-64 w-full md:h-72 lg:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              stroke="rgba(217,119,6,0.12)"
              strokeDasharray="4 8"
              vertical={false}
            />
            <XAxis
              dataKey="index"
              tick={{ fill: "#a8a29e", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              label={{
                value: "场次序",
                position: "insideBottomRight",
                offset: -2,
                fill: "#a8a29e",
                fontSize: 11,
              }}
            />
            <YAxis
              yAxisId="net"
              tick={{ fill: "#a8a29e", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <YAxis
              yAxisId="wr"
              orientation="right"
              domain={[0, 100]}
              tick={{ fill: "#a8a29e", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
              unit="%"
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "rgba(217,119,6,0.35)", strokeWidth: 1 }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 8 }}
              formatter={(value) => (
                <span className="text-xs text-stone-600">{value}</span>
              )}
            />
            <Line
              yAxisId="net"
              type="monotone"
              dataKey="cumulativeNetWins"
              name="累计净胜"
              stroke="#d97706"
              strokeWidth={2.4}
              dot={false}
              activeDot={{
                r: 4,
                fill: "#d97706",
                stroke: "#fff",
                strokeWidth: 1.5,
              }}
            />
            <Line
              yAxisId="wr"
              type="monotone"
              dataKey="rollingWinrate"
              name="滚动胜率%"
              stroke="#78716c"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              connectNulls
              activeDot={{ r: 3.5, fill: "#78716c" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
