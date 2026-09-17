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

export function DateRangeFilter({ currentDays }: { currentDays: string }) {
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

  return (
    <div
      className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
            className={`hourly-chip flex shrink-0 flex-col items-center justify-center gap-1.5 px-5 py-3.5 transition ${
              active ? "hourly-chip-active" : ""
            } ${pending ? "opacity-60" : ""}`}
          >
            <span
              className={`text-[10px] tracking-wide ${
                active ? "text-sky-300" : "text-white/40"
              }`}
            >
              {active ? "当前" : "范围"}
            </span>
            <span
              className={`text-sm font-semibold tabular-nums ${
                active ? "text-white" : "text-white/60"
              }`}
            >
              {p.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
