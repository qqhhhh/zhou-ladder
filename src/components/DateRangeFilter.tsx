"use client";

import { useEffect, useState } from "react";
import { parseRange, type RangeState } from "@/lib/range";
import { WaveLabel } from "@/components/WaveLabel";

const PRESETS: { label: string; days: string }[] = [
  { label: "近1天", days: "1" },
  { label: "近7天", days: "7" },
  { label: "近30天", days: "30" },
];

export function DateRangeFilter({
  currentDays,
  minDate,
  maxDate,
  customFrom,
  customTo,
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
  const isCustom =
    currentDays === "custom" || Boolean(customFrom || customTo);
  const isManual = !isCustom && !presetKeys.has(currentDays);
  const [draft, setDraft] = useState(isManual ? currentDays : "");
  const [fromDraft, setFromDraft] = useState(
    customFrom ?? minDate ?? "",
  );
  const [toDraft, setToDraft] = useState(customTo ?? maxDate ?? "");

  useEffect(() => {
    if (!isCustom && !presetKeys.has(currentDays)) setDraft(currentDays);
  }, [currentDays, isCustom]);

  useEffect(() => {
    if (customFrom || customTo) {
      setFromDraft(customFrom ?? minDate ?? "");
      setToDraft(customTo ?? maxDate ?? "");
    } else {
      setFromDraft(minDate ?? "");
      setToDraft(maxDate ?? "");
    }
  }, [customFrom, customTo, minDate, maxDate]);

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-bold transition ${
      active ? "chip-active" : "chip-idle"
    }`;

  const dateInputClass = (active: boolean) =>
    `rounded-lg border bg-white px-2 py-1 text-xs font-bold tabular-nums text-navy-700 outline-none ${
      active ? "border-brand" : "border-[#e9edf7]"
    }`;

  const applyManual = () => {
    const n = Number(draft);
    if (!Number.isFinite(n) || n <= 0) return;
    onRangeChange(parseRange({ days: String(Math.floor(n)) }));
  };

  const applyCustom = () => {
    const from = fromDraft.trim() || null;
    const to = toDraft.trim() || null;
    if (!from && !to) return;
    onRangeChange(parseRange({ from, to }));
  };

  return (
    <div className="flex flex-col gap-1.5" role="group" aria-label="时间范围">
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => {
          const active = !isCustom && currentDays === p.days;
          return (
            <button
              key={p.days}
              type="button"
              onClick={() => onRangeChange(parseRange({ days: p.days }))}
              className={pill(active)}
            >
              <WaveLabel text={p.label} />
            </button>
          );
        })}
        <label className="ml-1 flex items-center gap-1 rounded-full bg-light-primary px-2 py-1 text-[11px] font-medium text-ink-muted">
          <WaveLabel text="近" />
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
          <WaveLabel text="天" />
          <button
            type="button"
            onClick={applyManual}
            disabled={!draft || Number(draft) <= 0}
            className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white disabled:opacity-40"
          >
            <WaveLabel text="应用" />
          </button>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-light-primary/80 px-3 py-2">
        <label className="flex items-center gap-1.5 text-[11px] font-medium text-ink-muted">
          <WaveLabel text="起" />
          <input
            type="date"
            value={fromDraft}
            min={minDate}
            max={maxDate}
            onChange={(e) => setFromDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyCustom();
            }}
            className={dateInputClass(isCustom)}
          />
        </label>
        <label className="flex items-center gap-1.5 text-[11px] font-medium text-ink-muted">
          <WaveLabel text="止" />
          <input
            type="date"
            value={toDraft}
            min={minDate}
            max={maxDate}
            onChange={(e) => setToDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyCustom();
            }}
            className={dateInputClass(isCustom)}
          />
        </label>
        <button
          type="button"
          onClick={applyCustom}
          disabled={!fromDraft.trim() && !toDraft.trim()}
          className="rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
        >
          <WaveLabel text="应用" />
        </button>
      </div>
    </div>
  );
}
