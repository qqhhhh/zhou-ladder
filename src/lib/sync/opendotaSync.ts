import { ACCOUNT_ID, OPENDOTA_UA, fetchPlayer } from "@/lib/opendota";
import { didWin } from "@/lib/stats";
import type { OpenDotaMatch } from "@/lib/types";
import {
  getMaxMatchId,
  setSyncState,
  upsertMatches,
  upsertPlayerMeta,
  wrapRawJson,
  type UpsertMatchInput,
} from "@/lib/db/matches";

const BASE = "https://api.opendota.com/api";
const MATCH_PAGE_SIZE = 200;
const MATCH_MAX_PAGES = 200;
const PAGE_GAP_MS = 120;
const RETRY_MAX = 6;
/** Detail-enrich only the newest N matches per sync (avoid N+1 on full history). */
const DETAIL_ENRICH_LIMIT = 20;
const DETAIL_GAP_MS = 150;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function opendotaFetch<T>(path: string): Promise<T> {
  let lastStatus = 0;
  for (let attempt = 0; attempt < RETRY_MAX; attempt += 1) {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        "User-Agent": OPENDOTA_UA,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    lastStatus = res.status;
    if (res.ok) return res.json() as Promise<T>;
    if (res.status === 429 || res.status === 503) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const waitMs =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : 500 * 2 ** attempt;
      await sleep(waitMs);
      continue;
    }
    throw new Error(`OpenDota 请求失败（${res.status}）`);
  }
  throw new Error(`OpenDota 请求过于频繁（${lastStatus}）`);
}

/** Map list-endpoint fields (+ optional detail overlays) into upsert input. */
function toUpsert(
  m: OpenDotaMatch,
  detail?: OpenDotaPlayerDetail | null,
): UpsertMatchInput {
  const input: UpsertMatchInput = {
    match_id: m.match_id,
    start_time: m.start_time,
    hero_id: m.hero_id,
    win: didWin(m),
    kills: m.kills,
    deaths: m.deaths,
    assists: m.assists,
    lobby_type: m.lobby_type ?? 7,
    source: "opendota",
    duration: m.duration ?? null,
    player_slot: m.player_slot ?? null,
    party_size: m.party_size ?? null,
    game_mode: m.game_mode ?? null,
    average_rank: m.average_rank ?? null,
    leaver_status: m.leaver_status ?? null,
    raw_json: wrapRawJson("opendota", m),
  };

  if (detail) {
    input.gold_per_min = detail.gold_per_min ?? null;
    input.xp_per_min = detail.xp_per_min ?? null;
    input.hero_damage = detail.hero_damage ?? null;
    input.tower_damage = detail.tower_damage ?? null;
    input.hero_healing = detail.hero_healing ?? null;
    input.last_hits = detail.last_hits ?? null;
    input.denies = detail.denies ?? null;
    input.net_worth = detail.net_worth ?? null;
    // Prefer richer merged raw: list + player slice from detail
    input.raw_json = wrapRawJson("opendota", {
      ...m,
      _detail_player: detail,
    });
  }

  return input;
}

type OpenDotaPlayerDetail = {
  account_id?: number;
  gold_per_min?: number | null;
  xp_per_min?: number | null;
  hero_damage?: number | null;
  tower_damage?: number | null;
  hero_healing?: number | null;
  last_hits?: number | null;
  denies?: number | null;
  net_worth?: number | null;
};

type OpenDotaMatchDetail = {
  players?: OpenDotaPlayerDetail[];
};

async function fetchPlayerDetailForMatch(
  matchId: number,
): Promise<OpenDotaPlayerDetail | null> {
  try {
    const detail = await opendotaFetch<OpenDotaMatchDetail>(
      `/matches/${matchId}`,
    );
    const me = (detail.players ?? []).find(
      (p) => Number(p.account_id) === ACCOUNT_ID,
    );
    return me ?? null;
  } catch {
    return null;
  }
}

/**
 * Optionally enrich the newest matches with /matches/{id} player stats.
 * Skipped on full backfill to avoid rate-limits across ~10k rows.
 */
async function enrichNewestWithDetails(
  rows: UpsertMatchInput[],
  full: boolean,
): Promise<{ rows: UpsertMatchInput[]; detailEnriched: number }> {
  if (full || rows.length === 0) return { rows, detailEnriched: 0 };
  const byId = new Map(rows.map((r) => [r.match_id, r]));
  const newest = [...rows]
    .sort((a, b) => b.match_id - a.match_id)
    .slice(0, DETAIL_ENRICH_LIMIT);
  let detailEnriched = 0;

  for (let i = 0; i < newest.length; i += 1) {
    if (i > 0) await sleep(DETAIL_GAP_MS);
    const base = newest[i];
    const detail = await fetchPlayerDetailForMatch(base.match_id);
    if (!detail) continue;
    detailEnriched += 1;
    // Rebuild from stored raw list object when possible
    let listMatch: OpenDotaMatch | null = null;
    try {
      const parsed = JSON.parse(base.raw_json ?? "{}") as {
        opendota?: OpenDotaMatch;
      };
      listMatch = parsed.opendota ?? null;
    } catch {
      listMatch = null;
    }
    if (!listMatch) {
      byId.set(base.match_id, {
        ...base,
        gold_per_min: detail.gold_per_min ?? null,
        xp_per_min: detail.xp_per_min ?? null,
        hero_damage: detail.hero_damage ?? null,
        tower_damage: detail.tower_damage ?? null,
        hero_healing: detail.hero_healing ?? null,
        last_hits: detail.last_hits ?? null,
        denies: detail.denies ?? null,
        net_worth: detail.net_worth ?? null,
        raw_json: wrapRawJson("opendota", { match_id: base.match_id, _detail_player: detail }),
      });
      continue;
    }
    byId.set(base.match_id, toUpsert(listMatch, detail));
  }

  return {
    rows: rows.map((r) => byId.get(r.match_id) ?? r),
    detailEnriched,
  };
}

export type OpenDotaSyncResult = {
  insertedOrUpdated: number;
  pages: number;
  stoppedAtKnown: boolean;
  newestMatchId: number | null;
  playerSynced: boolean;
  detailEnriched: number;
};

/**
 * Incremental OpenDota sync: newest-first pagination until we hit match_id
 * already in Turso (watermark = MAX(match_id)). Pass full=true to backfill all pages.
 * List endpoint fields → columns + raw_json; optional detail enrich for newest ~20.
 */
export async function syncOpenDota(opts?: {
  full?: boolean;
}): Promise<OpenDotaSyncResult> {
  const full = opts?.full === true;
  const watermark = full ? null : await getMaxMatchId();

  const collected: UpsertMatchInput[] = [];
  const seen = new Set<number>();
  let pages = 0;
  let stoppedAtKnown = false;

  for (let page = 0; page < MATCH_MAX_PAGES; page += 1) {
    const offset = page * MATCH_PAGE_SIZE;
    if (page > 0) await sleep(PAGE_GAP_MS);

    const batch = await opendotaFetch<OpenDotaMatch[]>(
      `/players/${ACCOUNT_ID}/matches?lobby_type=7&limit=${MATCH_PAGE_SIZE}&offset=${offset}`,
    );
    pages += 1;

    if (batch.length === 0) break;

    let pageHasNew = false;
    for (const m of batch) {
      if (seen.has(m.match_id)) continue;
      seen.add(m.match_id);

      if (watermark != null && m.match_id <= watermark) {
        stoppedAtKnown = true;
        continue;
      }

      collected.push(toUpsert(m));
      pageHasNew = true;
    }

    if (watermark != null && !pageHasNew) {
      stoppedAtKnown = true;
      break;
    }

    if (batch.length < MATCH_PAGE_SIZE) break;
  }

  const { rows: enriched, detailEnriched } = await enrichNewestWithDetails(
    collected,
    full,
  );

  const insertedOrUpdated = await upsertMatches(enriched);

  let playerSynced = false;
  try {
    const player = await fetchPlayer(0);
    await upsertPlayerMeta({
      account_id: ACCOUNT_ID,
      rank_tier: player.rank_tier,
      leaderboard_rank: player.leaderboard_rank,
      personaname: player.profile.personaname,
      avatar:
        player.profile.avatarfull ||
        player.profile.avatarmedium ||
        player.profile.avatar,
    });
    playerSynced = true;
  } catch {
    // Player meta is best-effort; matches still count
  }

  const newestMatchId =
    collected.length > 0
      ? Math.max(...collected.map((m) => m.match_id))
      : watermark;

  await setSyncState(
    "opendota_last_sync",
    JSON.stringify({
      at: new Date().toISOString(),
      pages,
      insertedOrUpdated,
      stoppedAtKnown,
      newestMatchId,
      full,
      detailEnriched,
    }),
  );

  return {
    insertedOrUpdated,
    pages,
    stoppedAtKnown,
    newestMatchId,
    playerSynced,
    detailEnriched,
  };
}
