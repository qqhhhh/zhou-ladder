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
  const fromYmd = sp.from?.trim() || undefined;
  const toYmd = sp.to?.trim() || undefined;
  if (fromYmd || toYmd) {
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

  const v = sp.days ?? "40";
  if (v === "all") {
    return {
      days: null,
      key: "all",
      label: "全部场次",
      customFrom: null,
      customTo: null,
    };
  }
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) {
    return {
      days: 40,
      key: "40",
      label: "近 40 天",
      customFrom: null,
      customTo: null,
    };
  }
  return {
    days: n,
    key: String(n),
    label: `近 ${n} 天`,
    customFrom: null,
    customTo: null,
  };
}

export function clampRangeToSpan(range: RangeState, span: number): RangeState {
  if (
    range.customFrom == null &&
    range.customTo == null &&
    range.days != null &&
    span < range.days
  ) {
    return {
      days: null,
      key: "all",
      label: "全部场次",
      customFrom: null,
      customTo: null,
    };
  }
  return range;
}

/** Sync shareable query without triggering a Next.js navigation/refetch. */
export function replaceRangeQuery(range: RangeState, basePath: string): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams();
  if (range.key === "custom") {
    if (range.fromYmd) params.set("from", range.fromYmd);
    if (range.toYmd) params.set("to", range.toYmd);
  } else if (range.key === "all") {
    params.set("days", "all");
  } else if (range.key !== "40") {
    params.set("days", range.key);
  }
  const qs = params.toString();
  const url = qs ? `${basePath}?${qs}` : basePath;
  window.history.replaceState(window.history.state, "", url);
}
