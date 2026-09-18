import { ACCOUNT_ID, OPENDOTA_UA, fetchPlayer } from "@/lib/opendota";
import { didWin } from "@/lib/stats";
import type { OpenDotaMatch } from "@/lib/types";
import {
  getMaxMatchId,
  setSyncState,
  upsertMatches,
  upsertPlayerMeta,
  type UpsertMatchInput,
} from "@/lib/db/matches";

const BASE = "https://api.opendota.com/api";
const MATCH_PAGE_SIZE = 200;
const MATCH_MAX_PAGES = 200;
const PAGE_GAP_MS = 120;
const RETRY_MAX = 6;

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

function toUpsert(m: OpenDotaMatch): UpsertMatchInput {
  return {
    match_id: m.match_id,
    start_time: m.start_time,
    hero_id: m.hero_id,
    win: didWin(m),
    kills: m.kills,
    deaths: m.deaths,
    assists: m.assists,
    lobby_type: m.lobby_type ?? 7,
    source: "opendota",
  };
}

export type OpenDotaSyncResult = {
  insertedOrUpdated: number;
  pages: number;
  stoppedAtKnown: boolean;
  newestMatchId: number | null;
  playerSynced: boolean;
};

/**
 * Incremental OpenDota sync: newest-first pagination until we hit match_id
 * already in Turso (watermark = MAX(match_id)). Pass full=true to backfill all pages.
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

    // Newest-first: once a page has no new ids (all <= watermark), older pages are known
    if (watermark != null && !pageHasNew) {
      stoppedAtKnown = true;
      break;
    }

    if (batch.length < MATCH_PAGE_SIZE) break;
  }

  const insertedOrUpdated = await upsertMatches(collected);

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
    }),
  );

  return {
    insertedOrUpdated,
    pages,
    stoppedAtKnown,
    newestMatchId,
    playerSynced,
  };
}
