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
  filterMatchesByRange,
} from "@/lib/stats";

export const revalidate = 180;

type SearchParams = Promise<{ days?: string }>;

function parseDays(raw: string | undefined): {
  days: number | null;
  key: string;
  label: string;
} {
  const v = raw ?? "40";
  if (v === "all") {
    return { days: null, key: "all", label: "全部已拉取场次（最多约 200）" };
  }
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) {
    return { days: 40, key: "40", label: "近 40 天" };
  }
  return { days: n, key: String(n), label: `近 ${n} 天` };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const range = parseDays(sp.days);

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
          <p className="mt-4 text-xs text-ink-muted">
            请稍后刷新。本站拉取天梯匹配对局（大厅类型 7）。
          </p>
        </div>
      </div>
    );
  }

  const filtered = filterMatchesByRange(payload.matches, range.days);
  const summary = buildSummary(filtered);
  const heroRows = buildHeroStats(filtered, payload.heroes);
  const chartPoints = buildChartPoints(filtered, payload.heroes);

  return (
    <div className="dash-shell min-h-screen pb-12">
      <div className="dash-main mx-auto max-w-7xl space-y-5 px-3 py-5 sm:px-4 md:space-y-5 md:px-6 md:py-7">
        {/* 1. Header: avatar / name / rank / date pills / 直播间 */}
        <Suspense
          fallback={
            <div className="h-20 animate-pulse rounded-[20px] bg-white/70 shadow-horizon" />
          }
        >
          <PlayerHeader
            player={payload.player}
            rangeKey={range.key}
            rangeLabel={range.label}
          />
        </Suspense>

        {/* 2. Dense 4 KPI MiniStatistics row */}
        <SummaryCards summary={summary} rangeLabel={range.label} />

        {/* 3. Wide trend chart (Horizon Total Spent / Mantine polish) */}
        <WinChart points={chartPoints} summary={summary} rangeLabel={range.label} />

        {/* 4. Full-width hero table */}
        <HeroTable rows={heroRows} />

        {/* Secondary: recent + meta */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <RecentMatches points={chartPoints} />
          <MetaCards
            player={payload.player}
            fetchedAt={payload.fetchedAt}
            rangeLabel={range.label}
          />
        </div>

        <footer className="pb-2 pt-1 text-center text-xs text-ink-muted">
          <p>
            © oldboys.games · Zhou / 鲷哥 · 数据来自{" "}
            <a
              className="font-medium text-brand hover:text-brand-soft"
              href="https://www.opendota.com/players/90137663"
              target="_blank"
              rel="noreferrer"
            >
              对局开放数据平台
            </a>
            。不上报、不展示估算分作为天梯分。
          </p>
        </footer>
      </div>
    </div>
  );
}
