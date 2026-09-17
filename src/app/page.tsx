import { Suspense } from "react";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { HeroTable } from "@/components/HeroTable";
import { PlayerHeader } from "@/components/PlayerHeader";
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
    error = e instanceof Error ? e.message : "OpenDota 请求失败";
  }

  if (error || !payload) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="glass-card p-8 text-center">
          <h1 className="text-xl font-semibold text-white">数据暂时不可用</h1>
          <p className="mt-2 text-sm text-rose-300">{error}</p>
          <p className="mt-4 text-xs text-slate-500">
            请稍后刷新。本站通过 OpenDota 拉取 lobby_type=7 天梯对局。
          </p>
        </div>
      </main>
    );
  }

  const filtered = filterMatchesByRange(payload.matches, range.days);
  const summary = buildSummary(filtered);
  const heroRows = buildHeroStats(filtered, payload.heroes);
  const chartPoints = buildChartPoints(filtered, payload.heroes);

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-8 md:py-10">
      <PlayerHeader
        player={payload.player}
        fetchedAt={payload.fetchedAt}
        rangeLabel={range.label}
      />

      <div className="glass-card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <Suspense fallback={<div className="h-8 text-sm text-slate-500">加载筛选…</div>}>
          <DateRangeFilter currentDays={range.key} />
        </Suspense>
        <p className="text-xs text-slate-500">
          仅统计 ranked（lobby_type=7）· 英雄图标来自 Steam CDN
        </p>
      </div>

      <SummaryCards summary={summary} />
      <WinChart points={chartPoints} />
      <HeroTable rows={heroRows} />

      <footer className="pb-8 pt-2 text-center text-xs text-slate-500">
        <p>
          © oldboys.games · Zhou / 鲷哥 · 数据源{" "}
          <a
            className="text-amber-400/80 hover:text-amber-300"
            href="https://www.opendota.com/players/90137663"
            target="_blank"
            rel="noreferrer"
          >
            OpenDota
          </a>
          。不上报、不展示 computed_mmr 作为天梯分。
        </p>
      </footer>
    </main>
  );
}
