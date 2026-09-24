import {
  shanghaiDayEndUnix,
  shanghaiDayStartUnix,
} from "@/lib/stats";

export type RangeState = {
  days: number | null;
  key: string;
  label: string;
  customFrom: number | null;
  customTo: number | null;
  fromYmd?: string;
  toYmd?: string;
};

export function parseRange(sp: {
  days?: string | null;
  from?: string | null;
  to?: string | null;
}): RangeState {
  let fromYmd = sp.from?.trim() || undefined;
  let toYmd = sp.to?.trim() || undefined;
  if (fromYmd || toYmd) {
    if (fromYmd && toYmd && fromYmd > toYmd) {
      const tmp = fromYmd;
      fromYmd = toYmd;
      toYmd = tmp;
    }
    return {
      days: null,
      key: "custom",
      label:
        fromYmd && toYmd
          ? `${fromYmd} ~ ${toYmd}`
          : fromYmd
            ? `${fromYmd} 起`
            : `至 ${toYmd}`,
      customFrom: fromYmd ? shanghaiDayStartUnix(fromYmd) : null,
      customTo: toYmd ? shanghaiDayEndUnix(toYmd) : null,
      fromYmd,
      toYmd,
    };
  }

  const v = sp.days ?? "30";
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) {
    return {
      days: 30,
      key: "30",
      label: "近 30 天",
      customFrom: null,
      customTo: null,
    };
  }
  const days = Math.min(Math.floor(n), 36500);
  return {
    days,
    key: String(days),
    label: `近 ${days} 天`,
    customFrom: null,
    customTo: null,
  };
}

/** Sync shareable query without triggering a Next.js navigation/refetch. */
export function replaceRangeQuery(range: RangeState, basePath: string): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams();
  if (range.key === "custom") {
    if (range.fromYmd) params.set("from", range.fromYmd);
    if (range.toYmd) params.set("to", range.toYmd);
  } else if (range.key !== "30") {
    params.set("days", range.key);
  }
  const qs = params.toString();
  const url = qs ? `${basePath}?${qs}` : basePath;
  window.history.replaceState(window.history.state, "", url);
}
