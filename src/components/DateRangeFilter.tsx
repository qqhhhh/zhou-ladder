"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";

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
  variant = "pills",
}: {
  currentDays: string;
  /** How many calendar days the pulled match history actually covers */
  dataSpanDays: number;
  /** YYYY-MM-DD bounds from match history (Asia/Shanghai calendar) */
  minDate: string;
  maxDate: string;
  customFrom?: string;
  customTo?: string;
  variant?: "pills" | "hourly";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const isCustom = Boolean(customFrom || customTo) || currentDays === "custom";

  const presets = useMemo(() => {
    const list = CANDIDATES.filter((p) => dataSpanDays >= p.minSpan);
    return [...list, { label: "全部", days: "all", minSpan: 0 }];
  }, [dataSpanDays]);

  const [fromDraft, setFromDraft] = useState(customFrom ?? minDate);
  const [toDraft, setToDraft] = useState(customTo ?? maxDate);
  const [customOpen, setCustomOpen] = useState(isCustom);

  const pushParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      const base = pathname.startsWith("/zhou") ? "/zhou" : "/";
      startTransition(() => {
        router.push(qs ? `${base}?${qs}` : base);
      });
    },
    [pathname, router, searchParams],
  );

  const setDays = useCallback(
    (days: string) => {
      setCustomOpen(false);
      pushParams((params) => {
        params.delete("from");
        params.delete("to");
        if (days === "40") {
          params.delete("days");
        } else {
          params.set("days", days);
        }
      });
    },
    [pushParams],
  );

  const applyCustom = useCallback(() => {
    if (!fromDraft || !toDraft) return;
    const from = fromDraft <= toDraft ? fromDraft : toDraft;
    const to = fromDraft <= toDraft ? toDraft : fromDraft;
    pushParams((params) => {
      params.delete("days");
      params.set("from", from);
      params.set("to", to);
    });
  }, [fromDraft, toDraft, pushParams]);

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-bold transition ${
      active ? "chip-active" : "chip-idle"
    } ${pending ? "opacity-60" : ""}`;

  return (
    <div className="flex flex-col gap-2">
      <div
        className={
          variant === "hourly"
            ? "flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "flex flex-wrap gap-1.5"
        }
        role="group"
        aria-label="时间范围"
      >
        {presets.map((p) => {
          const active = !isCustom && currentDays === p.days;
          return (
            <button
              key={p.days}
              type="button"
              disabled={pending}
              onClick={() => setDays(p.days)}
              className={
                variant === "hourly"
                  ? `flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-4 py-3 transition ${
                      active
                        ? "bg-brand-tint text-brand"
                        : "bg-light-primary text-ink-muted"
                    } ${pending ? "opacity-60" : ""}`
                  : pill(active)
              }
            >
              {variant === "hourly" ? (
                <>
                  <span className="text-[10px] tracking-wide">
                    {active ? "当前" : "范围"}
                  </span>
                  <span className="text-sm font-bold tabular-nums">
                    {p.label}
                  </span>
                </>
              ) : (
                p.label
              )}
            </button>
          );
        })}
        <button
          type="button"
          disabled={pending}
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
            disabled={pending || !fromDraft || !toDraft}
            onClick={applyCustom}
            className="rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            应用
          </button>
        </div>
      )}
    </div>
  );
}
