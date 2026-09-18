import { ACCOUNT_ID } from "@/lib/opendota";
import {
  getMaxMatchId,
  setSyncState,
  upsertMatches,
  upsertPlayerMeta,
  wrapRawJson,
  type UpsertMatchInput,
} from "@/lib/db/matches";

const STRATZ_URL = "https://api.stratz.com/graphql";
const STRATZ_UA = "STRATZ_API";
const PAGE_SIZE = 100;
const MAX_PAGES = 150; // ~15k matches at PAGE_SIZE 100

type StratzPlayerNode = {
  steamAccountId?: number | null;
  heroId?: number | null;
  isVictory?: boolean | null;
  kills?: number | null;
  deaths?: number | null;
  assists?: number | null;
  goldPerMinute?: number | null;
  experiencePerMinute?: number | null;
  heroDamage?: number | null;
  towerDamage?: number | null;
  heroHealing?: number | null;
  numLastHits?: number | null;
  numDenies?: number | null;
  networth?: number | null;
  imp?: number | null;
  award?: string | null;
  lane?: string | number | null;
  partyId?: number | null;
  leaverStatus?: number | null;
  position?: string | null;
};

type StratzMatchNode = {
  id: number;
  startDateTime?: number | null;
  durationSeconds?: number | null;
  lobbyType?: number | null;
  gameMode?: number | null;
  averageRank?: number | null;
  players?: StratzPlayerNode[] | null;
};

type StratzPlayerPayload = {
  data?: {
    player?: {
      steamAccount?: {
        name?: string | null;
        avatar?: string | null;
        seasonRank?: number | null;
        seasonLeaderboardRank?: number | null;
      } | null;
      matches?: StratzMatchNode[] | null;
    } | null;
  };
  errors?: Array<{ message?: string }>;
};

function finiteNum(v: unknown, fallback: number | null = null): number | null {
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function stratzGraphql<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string,
): Promise<T> {
  const res = await fetch(STRATZ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": STRATZ_UA,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`STRATZ 请求失败（${res.status}）`);
  }
  return res.json() as Promise<T>;
}

/** Expanded player match fields; falls back to slim query if schema rejects extras. */
const MATCHES_QUERY_RICH = `
query PlayerRankedMatches($steamAccountId: Long!, $take: Int!, $skip: Int!) {
  player(steamAccountId: $steamAccountId) {
    steamAccount {
      name
      avatar
      seasonRank
      seasonLeaderboardRank
    }
    matches(
      request: {
        take: $take
        skip: $skip
        lobbyTypeIds: [7]
      }
    ) {
      id
      startDateTime
      durationSeconds
      lobbyType
      gameMode
      averageRank
      players {
        steamAccountId
        heroId
        isVictory
        kills
        deaths
        assists
        goldPerMinute
        experiencePerMinute
        heroDamage
        towerDamage
        heroHealing
        numLastHits
        numDenies
        networth
        imp
        award
        lane
        partyId
        leaverStatus
      }
    }
  }
}
`;

const MATCHES_QUERY_SLIM = `
query PlayerRankedMatches($steamAccountId: Long!, $take: Int!, $skip: Int!) {
  player(steamAccountId: $steamAccountId) {
    steamAccount {
      name
      avatar
      seasonRank
      seasonLeaderboardRank
    }
    matches(
      request: {
        take: $take
        skip: $skip
        lobbyTypeIds: [7]
      }
    ) {
      id
      startDateTime
      durationSeconds
      lobbyType
      players {
        steamAccountId
        heroId
        isVictory
        kills
        deaths
        assists
        goldPerMinute
        experiencePerMinute
        numLastHits
        numDenies
        networth
        imp
        award
      }
    }
  }
}
`;

function awardToText(award: unknown): string | null {
  if (award == null) return null;
  return String(award);
}

function nodeToUpsert(node: StratzMatchNode): UpsertMatchInput | null {
  const me = (node.players ?? []).find(
    (p) => Number(p.steamAccountId) === ACCOUNT_ID,
  );
  if (!me || node.id == null) return null;

  let partySize: number | null = null;
  if (me.partyId != null) {
    const pid = Number(me.partyId);
    if (Number.isFinite(pid) && pid > 0) {
      partySize = (node.players ?? []).filter(
        (p) => p.partyId != null && Number(p.partyId) === pid,
      ).length;
    }
  }

  const matchId = finiteNum(node.id, null);
  if (matchId == null || matchId <= 0) return null;

  return {
    match_id: matchId,
    start_time: finiteNum(node.startDateTime, 0) ?? 0,
    hero_id: finiteNum(me.heroId, 0) ?? 0,
    win: Boolean(me.isVictory),
    kills: finiteNum(me.kills, 0) ?? 0,
    deaths: finiteNum(me.deaths, 0) ?? 0,
    assists: finiteNum(me.assists, 0) ?? 0,
    lobby_type: finiteNum(node.lobbyType, 7) ?? 7,
    source: "stratz",
    duration: finiteNum(node.durationSeconds),
    game_mode: finiteNum(node.gameMode),
    average_rank: finiteNum(node.averageRank),
    party_size: partySize,
    leaver_status: finiteNum(me.leaverStatus),
    gold_per_min: finiteNum(me.goldPerMinute),
    xp_per_min: finiteNum(me.experiencePerMinute),
    hero_damage: finiteNum(me.heroDamage),
    tower_damage: finiteNum(me.towerDamage),
    hero_healing: finiteNum(me.heroHealing),
    last_hits: finiteNum(me.numLastHits),
    denies: finiteNum(me.numDenies),
    net_worth: finiteNum(me.networth),
    award: awardToText(me.award),
    imp: finiteNum(me.imp),
    raw_json: wrapRawJson("stratz", node),
  };
}

export type StratzSyncResult = {
  skipped: boolean;
  reason?: string;
  insertedOrUpdated: number;
  pages: number;
  stoppedAtKnown: boolean;
  playerSynced: boolean;
};

async function fetchPage(
  token: string,
  skip: number,
  useRich: boolean,
): Promise<StratzPlayerPayload> {
  return stratzGraphql<StratzPlayerPayload>(
    useRich ? MATCHES_QUERY_RICH : MATCHES_QUERY_SLIM,
    { steamAccountId: ACCOUNT_ID, take: PAGE_SIZE, skip },
    token,
  );
}

/**
 * STRATZ GraphQL sync. Skips quietly when STRATZ_API_TOKEN is missing.
 * Writes expanded columns + raw_json; merges without wiping richer OpenDota KDA.
 */
export async function syncStratz(opts?: {
  full?: boolean;
}): Promise<StratzSyncResult> {
  const token = process.env.STRATZ_API_TOKEN;
  if (!token) {
    return {
      skipped: true,
      reason: "STRATZ_API_TOKEN not set",
      insertedOrUpdated: 0,
      pages: 0,
      stoppedAtKnown: false,
      playerSynced: false,
    };
  }

  const full = opts?.full === true;
  const watermark = full ? null : await getMaxMatchId();

  const collected: UpsertMatchInput[] = [];
  const seen = new Set<number>();
  let pages = 0;
  let stoppedAtKnown = false;
  let playerSynced = false;
  let metaWritten = false;
  let useRich = true;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    if (page > 0) await sleep(150);
    const skip = page * PAGE_SIZE;
    let json = await fetchPage(token, skip, useRich);

    if (json.errors?.length && useRich) {
      // Schema may reject some fields — fall back once and retry this page.
      useRich = false;
      json = await fetchPage(token, skip, false);
    }

    if (json.errors?.length) {
      throw new Error(
        `STRATZ GraphQL: ${json.errors.map((e) => e.message).join("; ")}`,
      );
    }

    const player = json.data?.player;
    if (!player) break;

    if (!metaWritten) {
      const sa = player.steamAccount;
      await upsertPlayerMeta({
        account_id: ACCOUNT_ID,
        rank_tier: sa?.seasonRank != null ? Number(sa.seasonRank) : null,
        leaderboard_rank:
          sa?.seasonLeaderboardRank != null
            ? Number(sa.seasonLeaderboardRank)
            : null,
        personaname: sa?.name ?? null,
        avatar: sa?.avatar ?? null,
      });
      metaWritten = true;
      playerSynced = true;
    }

    const matches = player.matches ?? [];
    pages += 1;
    if (matches.length === 0) break;

    let pageHasNew = false;
    for (const node of matches) {
      const row = nodeToUpsert(node);
      if (!row) continue;
      if (seen.has(row.match_id)) continue;
      seen.add(row.match_id);

      if (watermark != null && row.match_id <= watermark) {
        stoppedAtKnown = true;
        continue;
      }

      collected.push(row);
      pageHasNew = true;
    }

    if (watermark != null && !pageHasNew) {
      stoppedAtKnown = true;
      break;
    }

    if (matches.length < PAGE_SIZE) break;
  }

  const cleaned = collected.map((row) => {
    const out: typeof row = { ...row };
    for (const [k, v] of Object.entries(out)) {
      if (typeof v === "number" && !Number.isFinite(v)) {
        (out as Record<string, unknown>)[k] = k === "match_id" || k === "start_time" ? 0 : null;
      }
    }
    return out;
  }).filter((r) => Number.isFinite(r.match_id) && r.match_id > 0);
  const insertedOrUpdated = await upsertMatches(cleaned);

  await setSyncState(
    "stratz_last_sync",
    JSON.stringify({
      at: new Date().toISOString(),
      pages,
      insertedOrUpdated,
      stoppedAtKnown,
      full,
      query: useRich ? "rich" : "slim",
    }),
  );

  return {
    skipped: false,
    insertedOrUpdated,
    pages,
    stoppedAtKnown,
    playerSynced,
  };
}
