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
      <div className="dash-shell mx-auto max-w-6xl px-4 py-16">
        <div className="panel p-8 text-center">
          <h1 className="text-xl font-semibold text-white">数据暂时不可用</h1>
          <p className="mt-2 text-sm text-rose-300">{error}</p>
          <p className="mt-4 text-xs text-white/40">
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
    <div className="dash-shell min-h-screen pb-10">
      <div className="dash-main mx-auto max-w-6xl space-y-4 px-4 py-6 md:space-y-5 md:px-6 md:py-8">
        {/* 1. Top header: avatar / name / rank / live / date pills */}
        <Suspense
          fallback={
            <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
          }
        >
          <PlayerHeader
            player={payload.player}
            rangeKey={range.key}
            rangeLabel={range.label}
          />
        </Suspense>

        {/* 2. KPI row */}
        <SummaryCards summary={summary} rangeLabel={range.label} />

        {/* 3. Wide main chart */}
        <WinChart points={chartPoints} summary={summary} />

        {/* 4. Full-width hero stats table */}
        <HeroTable rows={heroRows} />

        {/* Slim secondary: recent + meta */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          <RecentMatches points={chartPoints} />
          <MetaCards
            player={payload.player}
            fetchedAt={payload.fetchedAt}
            rangeLabel={range.label}
          />
        </div>

        <footer className="pb-2 pt-1 text-center text-xs text-white/30">
          <p>
            © oldboys.games · Zhou / 鲷哥 · 数据来自{" "}
            <a
              className="text-sky-400/80 hover:text-sky-300"
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
