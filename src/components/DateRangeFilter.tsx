"use client";

import { useState } from "react";
import { parseRange, type RangeState } from "@/lib/range";

const CANDIDATES: { label: string; days: string; minSpan: number }[] = [
  { label: "近14天", days: "14", minSpan: 14 },
  { label: "近40天", days: "40", minSpan: 40 },
  { label: "近90天", days: "90", minSpan: 90 },
  { label: "近180天", days: "180", minSpan: 180 },
];

export function DateRangeFilter({
  currentDays,
  dataSpanDays,
  minDate,
  maxDate,
  customFrom,
  customTo,
  onRangeChange,
}: {
  currentDays: string;
  dataSpanDays: number;
  minDate: string;
  maxDate: string;
  customFrom?: string;
  customTo?: string;
  onRangeChange: (range: RangeState) => void;
}) {
  const isCustom = Boolean(customFrom || customTo) || currentDays === "custom";
  const presets = [
    ...CANDIDATES.filter((p) => dataSpanDays >= p.minSpan),
    { label: "全部", days: "all", minSpan: 0 },
  ];

  const [fromDraft, setFromDraft] = useState(customFrom ?? minDate);
  const [toDraft, setToDraft] = useState(customTo ?? maxDate);
  const [customOpen, setCustomOpen] = useState(isCustom);

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-bold transition ${
      active ? "chip-active" : "chip-idle"
    }`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="时间范围">
        {presets.map((p) => {
          const active = !isCustom && currentDays === p.days;
          return (
            <button
              key={p.days}
              type="button"
              onClick={() => {
                setCustomOpen(false);
                onRangeChange(parseRange({ days: p.days }));
              }}
              className={pill(active)}
            >
              {p.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setCustomOpen((v) => !v)}
          className={pill(isCustom)}
        >
          自定义
        </button>
      </div>

      {customOpen && (
        <div className="flex flex-wrap items-end gap-2 rounded-xl bg-light-primary/80 px-3 py-2">
          <label className="flex flex-col gap-0.5 text-[10px] font-medium text-ink-muted">
            开始
            <input
              type="date"
              value={fromDraft}
              min={minDate}
              max={maxDate}
              onChange={(e) => setFromDraft(e.target.value)}
              className="rounded-lg border border-[#e9edf7] bg-white px-2 py-1 text-xs font-bold text-navy-700"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] font-medium text-ink-muted">
            结束
            <input
              type="date"
              value={toDraft}
              min={minDate}
              max={maxDate}
              onChange={(e) => setToDraft(e.target.value)}
              className="rounded-lg border border-[#e9edf7] bg-white px-2 py-1 text-xs font-bold text-navy-700"
            />
          </label>
          <button
            type="button"
            disabled={!fromDraft || !toDraft}
            onClick={() => {
              const from = fromDraft <= toDraft ? fromDraft : toDraft;
              const to = fromDraft <= toDraft ? toDraft : fromDraft;
              onRangeChange(parseRange({ from, to }));
            }}
            className="rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            应用
          </button>
        </div>
      )}
    </div>
  );
}
