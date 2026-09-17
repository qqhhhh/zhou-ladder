"use client";

import { motion } from "framer-motion";
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

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint; value: number; name: string; color: string }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  return (
    <div className="chart-tooltip min-w-[180px] text-sm text-slate-100">
      <div className="mb-1.5 border-b border-amber-400/20 pb-1.5 text-xs text-amber-200/90">
        {p
          ? `#${p.index} · ${p.dateLabel} · ${p.hero} · ${p.result}`
          : `#${label}`}
      </div>
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={entry.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-slate-300">
              <span
                className="inline-block h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]"
                style={{ background: entry.color, color: entry.color }}
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

export function WinChart({ points }: { points: ChartPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="glass-card flex h-72 items-center justify-center text-slate-400">
        所选范围内暂无天梯对局
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.45 }}
      className="glass-card p-4 md:p-5"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">
            走势图
            <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
          </h2>
          <p className="mt-1 text-xs text-amber-200/80">
            累计净胜场 / 滚动胜率（近 20 场）·{" "}
            <strong>不是真实 MMR 曲线</strong>
            ，OpenDota 无法提供 GC 天梯分导出
          </p>
        </div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="netGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.85} />
                <stop offset="50%" stopColor="#67e8f9" stopOpacity={1} />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.9} />
              </linearGradient>
              <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid
              stroke="rgba(148,163,184,0.12)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="index"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              label={{
                value: "场次序",
                position: "insideBottomRight",
                offset: -2,
                fill: "#64748b",
                fontSize: 11,
              }}
            />
            <YAxis
              yAxisId="net"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <YAxis
              yAxisId="wr"
              orientation="right"
              domain={[0, 100]}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(251,191,36,0.35)", strokeWidth: 1 }} />
            <Legend
              wrapperStyle={{ paddingTop: 8 }}
              formatter={(value) => (
                <span className="text-xs text-slate-300">{value}</span>
              )}
            />
            <Line
              yAxisId="net"
              type="monotone"
              dataKey="cumulativeNetWins"
              name="累计净胜"
              stroke="url(#netGlow)"
              strokeWidth={2.8}
              filter="url(#lineGlow)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#fbbf24",
                stroke: "#fff",
                strokeWidth: 1.5,
                style: { filter: "drop-shadow(0 0 6px rgba(251,191,36,0.8))" },
              }}
            />
            <Line
              yAxisId="wr"
              type="monotone"
              dataKey="rollingWinrate"
              name="滚动胜率%"
              stroke="#a78bfa"
              strokeWidth={2.2}
              strokeDasharray="5 4"
              style={{ filter: "drop-shadow(0 0 4px rgba(167,139,250,0.55))" }}
              dot={false}
              connectNulls
              activeDot={{ r: 4, fill: "#a78bfa" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
