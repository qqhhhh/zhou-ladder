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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 md:p-5"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">走势图</h2>
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
            <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" />
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
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(148,163,184,0.25)",
                borderRadius: 12,
                color: "#e2e8f0",
              }}
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as ChartPoint | undefined;
                return p
                  ? `#${p.index} · ${p.dateLabel} · ${p.hero} · ${p.result}`
                  : "";
              }}
              formatter={(value, name) => {
                const v = typeof value === "number" ? value : Number(value);
                if (name === "累计净胜") return [v, name];
                if (name === "滚动胜率%") return [`${v.toFixed(1)}%`, name];
                return [value, name];
              }}
            />
            <Legend />
            <Line
              yAxisId="net"
              type="monotone"
              dataKey="cumulativeNetWins"
              name="累计净胜"
              stroke="#22d3ee"
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="wr"
              type="monotone"
              dataKey="rollingWinrate"
              name="滚动胜率%"
              stroke="#a78bfa"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
