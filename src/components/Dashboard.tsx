"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { subDays } from "date-fns";
import { HeroTable } from "@/components/HeroTable";
import { PlayerHeader } from "@/components/PlayerHeader";
import { SummaryCards } from "@/components/SummaryCards";
import { formatRankTier } from "@/lib/opendota";
import { TrendRecentSplit } from "@/components/TrendRecentSplit";
import type { OpenDotaHero, OpenDotaPlayer } from "@/lib/types";
import type { CompactMatch } from "@/lib/stats";
import type { OverlayScorePayload } from "@/lib/parseOverlayScore";
import { trustedLadderScore } from "@/lib/overlayScore";
import {
  buildChartPointsFromCompact,
  buildHeroStatsFromCompact,
  buildSummaryFromCompact,
  downsampleChartPoints,
  filterCompactByRange,
} from "@/lib/stats";
import { parseRange, replaceRangeQuery, type RangeState } from "@/lib/range";
import { fromSlimMatch, type SlimMatch } from "@/lib/slimMatch";

function rangeNeededMinStart(range: RangeState): number | null {
  if (range.customFrom != null) return range.customFrom;
  if (range.days != null && range.days > 0) {
    return Math.floor(subDays(new Date(), range.days).getTime() / 1000);
  }
  return null; // full history
}

function mergeMatches(
  prev: CompactMatch[],
  next: CompactMatch[],
): CompactMatch[] {
  const byId = new Map<number, CompactMatch>();
  for (const m of prev) byId.set(m.match_id, m);
  for (const m of next) byId.set(m.match_id, m);
  return Array.from(byId.values()).sort((a, b) => a.start_time - b.start_time);
}

type MatchesApiBody = {
  matches?: CompactMatch[] | SlimMatch[];
  slim?: boolean;
  fetchedAt?: string;
  count?: number;
  since?: number | null;
  error?: string;
};

function decodeMatches(body: MatchesApiBody): CompactMatch[] {
  if (!body.matches?.length) return [];
  if (body.slim) {
    return (body.matches as SlimMatch[]).map(fromSlimMatch);
  }
  return body.matches as CompactMatch[];
}

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
  const [overlayScore, setOverlayScore] =
    useState<OverlayScorePayload | null>(null);
  const [fetchedAt, setFetchedAt] = useState(bootstrapFetchedAt);
  const [historyReady, setHistoryReady] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  /** Coverage bound for UI hint (lowest start_time we have loaded). */
  const [loadedMinStart, setLoadedMinStart] = useState<number>(() => {
    if (bootstrapMatches.length === 0) return Number.POSITIVE_INFINITY;
    return Math.min(...bootstrapMatches.map((m) => m.start_time));
  });
  const loadedMinStartRef = useRef(loadedMinStart);
  const loadedAllRef = useRef(false);

  const [range, setRange] = useState<RangeState>(() =>
    parseRange({ days: initialDays }),
  );
  const [, startTransition] = useTransition();
  const fetchGen = useRef(0);

  const ensureRangeLoaded = useCallback(async (r: RangeState) => {
    const needed = rangeNeededMinStart(r);

    // Already covered: client-side filter is enough.
    if (loadedAllRef.current) return;
    if (needed != null && needed >= loadedMinStartRef.current) return;

    const gen = ++fetchGen.current;
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const params = new URLSearchParams();
      params.set("slim", "1");

      if (r.customFrom != null || r.customTo != null) {
        if (r.customFrom != null) params.set("from", String(r.customFrom));
        if (r.customTo != null) params.set("to", String(r.customTo));
      } else if (r.days != null && r.days > 0) {
        params.set("days", String(r.days));
      } else {
        params.set("days", "all");
      }

      const res = await fetch(`/api/matches?${params.toString()}`, {
        cache: "force-cache",
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(errBody?.error ?? `加载失败 ${res.status}`);
      }
      const body = (await res.json()) as MatchesApiBody;
      if (gen !== fetchGen.current) return;

      const decoded = decodeMatches(body);
      if (decoded.length) {
        setMatches((prev) => mergeMatches(prev, decoded));
      }
      if (body.fetchedAt) setFetchedAt(body.fetchedAt);

      // Extend coverage to the requested bound (even if few/no matches).
      if (params.get("days") === "all") {
        loadedAllRef.current = true;
        loadedMinStartRef.current = 0;
        setLoadedMinStart(0);
      } else {
        const bound =
          body.since != null
            ? body.since
            : needed != null
              ? needed
              : loadedMinStartRef.current;
        const nextMin = Math.min(loadedMinStartRef.current, bound);
        loadedMinStartRef.current = nextMin;
        setLoadedMinStart(nextMin);
      }

      setHistoryReady(true);
    } catch (e) {
      if (gen !== fetchGen.current) return;
      setHistoryError(e instanceof Error ? e.message : "历史加载失败");
    } finally {
      if (gen === fetchGen.current) setHistoryLoading(false);
    }
  }, []);

  // Initial hydrate for current range (default 30d) — never pull full 10k.
  useEffect(() => {
    void ensureRangeLoaded(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once for initial range
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/overlay-score", { cache: "no-store" });
        if (!res.ok) return;
        const body = (await res.json()) as OverlayScorePayload & {
          empty?: boolean;
        };
        if (cancelled) return;
        if (body.empty) setOverlayScore(null);
        else setOverlayScore(body);
      } catch {
        // optional
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
    void ensureRangeLoaded(next);
  };

  const loadedDaysApprox =
    loadedAllRef.current || !Number.isFinite(loadedMinStart)
      ? null
      : Math.max(
          0,
          Math.ceil((Date.now() / 1000 - loadedMinStart) / 86400),
        );

  const ladderScore = trustedLadderScore(filtered, overlayScore, heroes);

  const historyHint = historyError
    ? `近况模式 · ${historyError}`
    : historyLoading
      ? "正在加载对局…"
      : historyReady
        ? loadedAllRef.current
          ? `全量 ${matches.length} 场已就绪`
          : `已加载近 ${loadedDaysApprox ?? "—"} 天 · ${matches.length} 场`
        : "正在后台加载对局…";

  return (
    <div className="dash-shell min-h-screen pb-12">
      <div className="dash-main mx-auto max-w-7xl space-y-5 px-3 py-5 sm:px-4 md:space-y-5 md:px-6 md:py-7">
        <PlayerHeader
          player={player}
          rangeKey={range.key}
          rangeLabel={range.label}
          onRangeChange={applyRange}
          historyHint={historyHint}
        />

        <SummaryCards
          summary={summary}
          rangeLabel={range.label}
          ladderScore={ladderScore}
          rankLabel={formatRankTier(player.rank_tier, player.leaderboard_rank)}
        />

        <TrendRecentSplit
          chartPoints={chartPoints}
          chartDisplay={chartDisplay}
          summary={summary}
          overlayScore={overlayScore}
        />

        <HeroTable rows={heroRows} />

        <footer className="pb-2 pt-1 text-center text-xs text-ink-muted">
          <p>© oldboys.games · Zhou / 鲷哥</p>
        </footer>
      </div>
    </div>
  );
}
