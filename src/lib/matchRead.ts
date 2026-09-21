import {
  getCachedCompactMatches,
  type CachedMatchBundle,
} from "@/lib/matchCache";
import { getSyncState, getPlayerMeta, listRecentCompactMatches } from "@/lib/db/matches";
import { hasTursoEnv } from "@/lib/turso";
import {
  ACCOUNT_ID,
  fetchPlayer,
  fetchRankedMatches,
  fetchRecentRankedMatches,
} from "@/lib/opendota";
import { getStaticHeroes } from "@/lib/heroNamesCn";
import { toCompactMatches, type CompactMatch } from "@/lib/stats";
import type { OpenDotaHero, OpenDotaPlayer } from "@/lib/types";

export type MatchSource = "turso" | "opendota";

export type MatchReadBundle = CachedMatchBundle & {
  source: MatchSource;
};

/** Daily cron + buffer: prefer OpenDota when Turso sync is older than this. */
const STALE_MS = 48 * 60 * 60 * 1000;

async function tursoLastSyncAt(): Promise<Date | null> {
  try {
    const raw = await getSyncState("opendota_last_sync");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at?: string };
    if (!parsed.at) return null;
    const d = new Date(parsed.at);
    return Number.isFinite(d.getTime()) ? d : null;
  } catch {
    return null;
  }
}

function isStale(last: Date | null): boolean {
  if (last == null) return true;
  return Date.now() - last.getTime() > STALE_MS;
}

async function readTursoBundle(opts?: {
  days?: number | "all";
  from?: number | null;
  to?: number | null;
}): Promise<{ bundle: MatchReadBundle; stale: boolean } | null> {
  if (!hasTursoEnv()) return null;
  try {
    const base = await getCachedCompactMatches(opts);
    const last = await tursoLastSyncAt();
    const stale = isStale(last);
    return {
      bundle: { ...base, source: "turso" },
      stale,
    };
  } catch {
    return null;
  }
}

async function readOpenDotaBundle(opts?: {
  days?: number | "all";
  from?: number | null;
  to?: number | null;
}): Promise<MatchReadBundle> {
  const from = opts?.from ?? null;
  const to = opts?.to ?? null;
  const days = opts?.days;

  let matches: CompactMatch[];
  const fetchedAt = new Date().toISOString();

  if (from != null || to != null) {
    // Bounds mode: pull enough history then filter.
    const windowDays =
      from != null
        ? Math.max(
            1,
            Math.ceil((Date.now() / 1000 - from) / 86400) + 1,
          )
        : 365;
    const raw =
      windowDays >= 400
        ? await fetchRankedMatches(300)
        : await fetchRecentRankedMatches(windowDays, 300);
    matches = toCompactMatches(raw).filter((m) => {
      if (from != null && m.start_time < from) return false;
      if (to != null && m.start_time > to) return false;
      return true;
    });
    // Ascending for chart continuity
    matches.sort((a, b) => a.start_time - b.start_time);
    return {
      matches,
      fetchedAt,
      count: matches.length,
      since: from,
      until: to,
      source: "opendota",
    };
  }

  if (days === "all") {
    const raw = await fetchRankedMatches(300);
    matches = toCompactMatches(raw);
    matches.sort((a, b) => a.start_time - b.start_time);
    return {
      matches,
      fetchedAt,
      count: matches.length,
      since: null,
      until: null,
      source: "opendota",
    };
  }

  const n = typeof days === "number" ? days : 30;
  const raw = await fetchRecentRankedMatches(n, 300);
  matches = toCompactMatches(raw);
  matches.sort((a, b) => a.start_time - b.start_time);
  const since = Math.floor(Date.now() / 1000) - n * 86400;
  return {
    matches,
    fetchedAt,
    count: matches.length,
    since,
    until: null,
    source: "opendota",
  };
}

/**
 * Read path: Turso first → if missing/stale/error, OpenDota →
 * if OpenDota fails but Turso had data, return Turso → else throw.
 */
export async function getMatchesWithFallback(opts?: {
  days?: number | "all";
  from?: number | null;
  to?: number | null;
}): Promise<MatchReadBundle> {
  const turso = await readTursoBundle(opts);

  if (turso && !turso.stale) {
    return turso.bundle;
  }

  try {
    return await readOpenDotaBundle(opts);
  } catch (opendotaErr) {
    if (turso?.bundle) {
      // Degraded: serve stale Turso rather than hard-fail if OpenDota also dies.
      return turso.bundle;
    }
    const msg =
      opendotaErr instanceof Error
        ? opendotaErr.message
        : "OpenDota 回源失败";
    throw new Error(
      turso == null
        ? `Turso 不可用且 OpenDota 回源失败：${msg}`
        : `Turso 数据过旧且 OpenDota 回源失败：${msg}`,
    );
  }
}

export type BootstrapPayload = {
  player: OpenDotaPlayer;
  matches: CompactMatch[];
  heroes: OpenDotaHero[];
  fetchedAt: string;
  source: MatchSource;
};

function playerFromMeta(
  meta: Awaited<ReturnType<typeof getPlayerMeta>>,
): OpenDotaPlayer {
  const name = meta?.personaname ?? "Zhou";
  const avatar = meta?.avatar ?? "";
  return {
    profile: {
      account_id: ACCOUNT_ID,
      personaname: name,
      avatar,
      avatarmedium: avatar,
      avatarfull: avatar,
      profileurl: "",
    },
    rank_tier: meta?.rank_tier ?? null,
    leaderboard_rank: meta?.leaderboard_rank ?? null,
  };
}

async function bootstrapFromTurso(): Promise<{
  payload: BootstrapPayload;
  stale: boolean;
} | null> {
  if (!hasTursoEnv()) return null;
  try {
    const [meta, matches] = await Promise.all([
      getPlayerMeta(ACCOUNT_ID),
      listRecentCompactMatches(200),
    ]);
    const last = await tursoLastSyncAt();
    const stale = isStale(last);
    return {
      payload: {
        player: playerFromMeta(meta),
        matches,
        heroes: getStaticHeroes(),
        fetchedAt: meta?.updated_at ?? new Date().toISOString(),
        source: "turso",
      },
      stale,
    };
  } catch {
    return null;
  }
}

async function bootstrapFromOpenDota(): Promise<BootstrapPayload> {
  const [player, raw] = await Promise.all([
    fetchPlayer(180),
    fetchRecentRankedMatches(45, 300),
  ]);
  return {
    player,
    matches: toCompactMatches(raw).sort((a, b) => a.start_time - b.start_time),
    heroes: getStaticHeroes(),
    fetchedAt: new Date().toISOString(),
    source: "opendota",
  };
}

/** SSR bootstrap with the same Turso → OpenDota → error chain. */
export async function loadBootstrapWithFallback(): Promise<BootstrapPayload> {
  const turso = await bootstrapFromTurso();
  if (turso && !turso.stale) {
    return turso.payload;
  }
  try {
    return await bootstrapFromOpenDota();
  } catch (opendotaErr) {
    if (turso?.payload) return turso.payload;
    const msg =
      opendotaErr instanceof Error
        ? opendotaErr.message
        : "OpenDota 回源失败";
    throw new Error(
      turso == null
        ? `Turso 不可用且 OpenDota 回源失败：${msg}`
        : `Turso 数据过旧且 OpenDota 回源失败：${msg}`,
    );
  }
}
