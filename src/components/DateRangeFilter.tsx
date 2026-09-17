"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

const PRESETS: { label: string; days: string }[] = [
  { label: "近 14 天", days: "14" },
  { label: "近 40 天", days: "40" },
  { label: "近 90 天", days: "90" },
  { label: "近 180 天", days: "180" },
  { label: "全部已拉", days: "all" },
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
    <div className="flex flex-wrap items-center gap-1.5">
      {PRESETS.map((p) => {
        const active = currentDays === p.days;
        return (
          <button
            key={p.days}
            type="button"
            disabled={pending}
            onClick={() => setDays(p.days)}
            className={`rounded-full px-3 py-1 text-xs transition md:text-sm ${
              active
                ? "bg-amber-400/20 text-amber-100 ring-1 ring-amber-300/50"
                : "bg-white/10 text-stone-300 hover:bg-white/15 hover:text-white"
            } ${pending ? "opacity-60" : ""}`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
