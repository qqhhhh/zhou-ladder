"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { HeroTable } from "@/components/HeroTable";
import { MetaCards } from "@/components/MetaCards";
import { PlayerHeader } from "@/components/PlayerHeader";
import { RecentMatches } from "@/components/RecentMatches";
import { SummaryCards } from "@/components/SummaryCards";
import { WinChart } from "@/components/WinChart";
import type { OpenDotaHero, OpenDotaPlayer } from "@/lib/types";
import type { CompactMatch } from "@/lib/stats";
import {
  buildChartPointsFromCompact,
  buildHeroStatsFromCompact,
  buildSummaryFromCompact,
  downsampleChartPoints,
  filterCompactByRange,
} from "@/lib/stats";
import { parseRange, replaceRangeQuery, type RangeState } from "@/lib/range";

export function Dashboard({
  player,
  matches: bootstrapMatches,
  heroes,
  fetchedAt: bootstrapFetchedAt,
  initialDays,
}: {
  player: OpenDotaPlayer;
  matches: CompactMatch[];
  heroes: OpenDotaHero[];
  fetchedAt: string;
  initialDays?: string;
}) {
  const pathname = usePathname();
  const basePath = pathname.startsWith("/zhou") ? "/zhou" : "/";

  const [matches, setMatches] = useState(bootstrapMatches);
  const [fetchedAt, setFetchedAt] = useState(bootstrapFetchedAt);
  const [historyReady, setHistoryReady] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [range, setRange] = useState<RangeState>(() =>
    parseRange({ days: initialDays }),
  );
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/matches", { cache: "force-cache" });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? `加载失败 ${res.status}`);
        }
        const body = (await res.json()) as {
          matches: CompactMatch[];
          fetchedAt: string;
          count: number;
        };
        if (cancelled) return;
        if (body.matches?.length) {
          setMatches(body.matches);
          setFetchedAt(body.fetchedAt);
          setHistoryReady(true);
        }
      } catch (e) {
        if (!cancelled) {
          setHistoryError(e instanceof Error ? e.message : "全量历史加载失败");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () =>
      filterCompactByRange(
        matches,
        range.days,
        range.customFrom,
        range.customTo,
      ),
    [matches, range],
  );

  const summary = useMemo(
    () => buildSummaryFromCompact(filtered),
    [filtered],
  );
  const heroRows = useMemo(
    () => buildHeroStatsFromCompact(filtered, heroes),
    [filtered, heroes],
  );
  const chartPoints = useMemo(
    () => buildChartPointsFromCompact(filtered, heroes),
    [filtered, heroes],
  );
  const chartDisplay = useMemo(
    () => downsampleChartPoints(chartPoints, 360),
    [chartPoints],
  );

  const applyRange = (next: RangeState) => {
    startTransition(() => setRange(next));
    replaceRangeQuery(next, basePath);
  };

  return (
    <div className="dash-shell min-h-screen pb-12">
      <div className="dash-main mx-auto max-w-7xl space-y-5 px-3 py-5 sm:px-4 md:space-y-5 md:px-6 md:py-7">
        <PlayerHeader
          player={player}
          rangeKey={range.key}
          rangeLabel={range.label}
          onRangeChange={applyRange}
          historyHint={
            historyReady
              ? `全量 ${matches.length} 场已就绪`
              : historyError
                ? `近况模式 · ${historyError}`
                : "正在后台加载全量历史…"
          }
        />

        <SummaryCards summary={summary} rangeLabel={range.label} />

        <WinChart
          points={chartDisplay}
          summary={summary}
          rangeLabel={range.label}
        />

        <HeroTable rows={heroRows} />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <RecentMatches points={chartPoints} />
          <MetaCards
            player={player}
            fetchedAt={fetchedAt}
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
