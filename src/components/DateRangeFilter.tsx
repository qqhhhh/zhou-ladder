"use client";

import { useEffect, useState } from "react";
import { parseRange, type RangeState } from "@/lib/range";

const PRESETS: { label: string; days: string }[] = [
  { label: "近1天", days: "1" },
  { label: "近7天", days: "7" },
  { label: "近30天", days: "30" },
];

export function DateRangeFilter({
  currentDays,
  onRangeChange,
}: {
  currentDays: string;
  dataSpanDays?: number;
  minDate?: string;
  maxDate?: string;
  customFrom?: string;
  customTo?: string;
  onRangeChange: (range: RangeState) => void;
}) {
  const presetKeys = new Set(PRESETS.map((p) => p.days));
  const isManual = !presetKeys.has(currentDays);
  const [draft, setDraft] = useState(isManual ? currentDays : "");

  useEffect(() => {
    if (!presetKeys.has(currentDays)) setDraft(currentDays);
  }, [currentDays]);

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-bold transition ${
      active ? "chip-active" : "chip-idle"
    }`;

  const applyManual = () => {
    const n = Number(draft);
    if (!Number.isFinite(n) || n <= 0) return;
    onRangeChange(parseRange({ days: String(Math.floor(n)) }));
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="时间范围">
      {PRESETS.map((p) => {
        const active = currentDays === p.days;
        return (
          <button
            key={p.days}
            type="button"
            onClick={() => onRangeChange(parseRange({ days: p.days }))}
            className={pill(active)}
          >
            {p.label}
          </button>
        );
      })}
      <label className="ml-1 flex items-center gap-1 rounded-full bg-light-primary px-2 py-1 text-[11px] font-medium text-ink-muted">
        近
        <input
          type="number"
          min={1}
          max={36500}
          inputMode="numeric"
          placeholder="天数"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyManual();
          }}
          className={`w-14 rounded-md border bg-white px-1.5 py-0.5 text-center text-xs font-bold tabular-nums text-navy-700 outline-none ${
            isManual ? "border-brand" : "border-[#e9edf7]"
          }`}
        />
        天
        <button
          type="button"
          onClick={applyManual}
          disabled={!draft || Number(draft) <= 0}
          className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white disabled:opacity-40"
        >
          应用
        </button>
      </label>
    </div>
  );
}
