export type RangeState = {
  days: number | null;
  key: string;
  label: string;
  customFrom: number | null;
  customTo: number | null;
};

export function parseRange(sp: {
  days?: string | null;
}): RangeState {
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
  if (range.key !== "30") {
    params.set("days", range.key);
  }
  const qs = params.toString();
  const url = qs ? `${basePath}?${qs}` : basePath;
  window.history.replaceState(window.history.state, "", url);
}
