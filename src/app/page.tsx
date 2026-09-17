import { Suspense } from "react";
import { HeroTable } from "@/components/HeroTable";
import { MetaCards } from "@/components/MetaCards";
import { PlayerHeader } from "@/components/PlayerHeader";
import { RecentMatches } from "@/components/RecentMatches";
import { SummaryCards } from "@/components/SummaryCards";
import { WinChart } from "@/components/WinChart";
import { fetchLadderData } from "@/lib/opendota";
import {
  buildChartPoints,
  buildHeroStats,
  buildSummary,
  dataSpanDays,
  filterMatchesByRange,
  matchDateBounds,
  shanghaiDayEndUnix,
  shanghaiDayStartUnix,
} from "@/lib/stats";

export const revalidate = 3600;
export const maxDuration = 60;

type SearchParams = Promise<{
  days?: string;
  from?: string;
  to?: string;
}>;

function parseRange(sp: {
  days?: string;
  from?: string;
  to?: string;
}): {
  days: number | null;
  key: string;
  label: string;
  customFrom: number | null;
  customTo: number | null;
  fromYmd?: string;
  toYmd?: string;
} {
  const fromYmd = sp.from?.trim() || undefined;
  const toYmd = sp.to?.trim() || undefined;
  if (fromYmd || toYmd) {
    const customFrom = fromYmd ? shanghaiDayStartUnix(fromYmd) : null;
    const customTo = toYmd ? shanghaiDayEndUnix(toYmd) : null;
    const label =
      fromYmd && toYmd
        ? `${fromYmd} ~ ${toYmd}`
        : fromYmd
          ? `${fromYmd} 起`
          : `至 ${toYmd}`;
    return {
      days: null,
      key: "custom",
      label,
      customFrom,
      customTo,
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

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  let range = parseRange(sp);

  let error: string | null = null;
  let payload: Awaited<ReturnType<typeof fetchLadderData>> | null = null;

  try {
    payload = await fetchLadderData();
  } catch (e) {
    error = e instanceof Error ? e.message : "对局数据请求失败";
  }

  if (error || !payload) {
    return (
      <div className="dash-shell mx-auto max-w-7xl px-4 py-16">
        <div className="panel p-8 text-center">
          <h1 className="text-xl font-bold text-navy-700">数据暂时不可用</h1>
          <p className="mt-2 text-sm text-rose-500">{error}</p>
          <p className="mt-4 text-xs text-ink-muted">请稍后刷新。</p>
        </div>
      </div>
    );
  }

  const span = dataSpanDays(payload.matches);
  const bounds = matchDateBounds(payload.matches);

  // If preset is longer than available history, fall back to "all"
  if (
    range.customFrom == null &&
    range.customTo == null &&
    range.days != null &&
    span < range.days
  ) {
    range = {
      days: null,
      key: "all",
      label: "全部场次",
      customFrom: null,
      customTo: null,
    };
  }

  const filtered = filterMatchesByRange(
    payload.matches,
    range.days,
    range.customFrom,
    range.customTo,
  );
  const summary = buildSummary(filtered);
  const heroRows = buildHeroStats(filtered, payload.heroes);
  const chartPoints = buildChartPoints(filtered, payload.heroes);

  return (
    <div className="dash-shell min-h-screen pb-12">
      <div className="dash-main mx-auto max-w-7xl space-y-5 px-3 py-5 sm:px-4 md:space-y-5 md:px-6 md:py-7">
        <Suspense
          fallback={
            <div className="h-20 animate-pulse rounded-[20px] bg-white/70 shadow-horizon" />
          }
        >
          <PlayerHeader
            player={payload.player}
            rangeKey={range.key}
            rangeLabel={range.label}
            dataSpanDays={span}
            minDate={bounds.minDate}
            maxDate={bounds.maxDate}
            customFrom={range.fromYmd}
            customTo={range.toYmd}
          />
        </Suspense>

        <SummaryCards summary={summary} rangeLabel={range.label} />

        <WinChart
          points={chartPoints}
          summary={summary}
          rangeLabel={range.label}
        />

        <HeroTable rows={heroRows} />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <RecentMatches points={chartPoints} />
          <MetaCards
            player={payload.player}
            fetchedAt={payload.fetchedAt}
            rangeLabel={range.label}
          />
        </div>

        <footer className="pb-2 pt-1 text-center text-xs text-ink-muted">
          <p>© oldboys.games · Zhou / 鲷哥</p>
        </footer>
      </div>
    </div>
  );
}
