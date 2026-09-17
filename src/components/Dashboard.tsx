"use client";

import { useMemo, useState, useTransition } from "react";
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
  compactDataSpanDays,
  compactMatchDateBounds,
  downsampleChartPoints,
  filterCompactByRange,
} from "@/lib/stats";
import {
  clampRangeToSpan,
  parseRange,
  replaceRangeQuery,
  type RangeState,
} from "@/lib/range";

export function Dashboard({
  player,
  matches,
  heroes,
  fetchedAt,
  initialDays,
  initialFrom,
  initialTo,
}: {
  player: OpenDotaPlayer;
  matches: CompactMatch[];
  heroes: OpenDotaHero[];
  fetchedAt: string;
  initialDays?: string;
  initialFrom?: string;
  initialTo?: string;
}) {
  const pathname = usePathname();
  const basePath = pathname.startsWith("/zhou") ? "/zhou" : "/";
  const span = useMemo(() => compactDataSpanDays(matches), [matches]);
  const bounds = useMemo(() => compactMatchDateBounds(matches), [matches]);

  const [range, setRange] = useState<RangeState>(() =>
    clampRangeToSpan(
      parseRange({
        days: initialDays,
        from: initialFrom,
        to: initialTo,
      }),
      span,
    ),
  );
  const [, startTransition] = useTransition();

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
    const clamped = clampRangeToSpan(next, span);
    startTransition(() => {
      setRange(clamped);
    });
    replaceRangeQuery(clamped, basePath);
  };

  return (
    <div className="dash-shell min-h-screen pb-12">
      <div className="dash-main mx-auto max-w-7xl space-y-5 px-3 py-5 sm:px-4 md:space-y-5 md:px-6 md:py-7">
        <PlayerHeader
          player={player}
          rangeKey={range.key}
          rangeLabel={range.label}
          dataSpanDays={span}
          minDate={bounds.minDate}
          maxDate={bounds.maxDate}
          customFrom={range.fromYmd}
          customTo={range.toYmd}
          onRangeChange={applyRange}
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
