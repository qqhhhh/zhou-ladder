"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

const PRESETS: { label: string; days: string }[] = [
  { label: "近14天", days: "14" },
  { label: "近40天", days: "40" },
  { label: "近90天", days: "90" },
  { label: "近180天", days: "180" },
  { label: "全部", days: "all" },
];

export function DateRangeFilter({
  currentDays,
  variant = "pills",
}: {
  currentDays: string;
  variant?: "pills" | "hourly";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const setDays = useCallback(
    (days: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (days === "40") {
        params.delete("days");
      } else {
        params.set("days", days);
      }
      startTransition(() => {
        router.push(params.toString() ? `/?${params.toString()}` : "/");
      });
    },
    [router, searchParams],
  );

  if (variant === "hourly") {
    return (
      <div
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="时间范围"
      >
        {PRESETS.map((p) => {
          const active = currentDays === p.days;
          return (
            <button
              key={p.days}
              type="button"
              disabled={pending}
              onClick={() => setDays(p.days)}
              className={`flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-4 py-3 transition ${
                active
                  ? "bg-brand-tint text-brand"
                  : "bg-light-primary text-ink-muted"
              } ${pending ? "opacity-60" : ""}`}
            >
              <span className="text-[10px] tracking-wide">
                {active ? "当前" : "范围"}
              </span>
              <span className="text-sm font-bold tabular-nums">{p.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap gap-1.5"
      role="group"
      aria-label="时间范围"
    >
      {PRESETS.map((p) => {
        const active = currentDays === p.days;
        return (
          <button
            key={p.days}
            type="button"
            disabled={pending}
            onClick={() => setDays(p.days)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              active ? "chip-active" : "chip-idle"
            } ${pending ? "opacity-60" : ""}`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
