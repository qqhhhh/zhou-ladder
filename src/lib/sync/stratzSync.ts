import { ACCOUNT_ID } from "@/lib/opendota";
import {
  getMaxMatchId,
  setSyncState,
  upsertMatches,
  upsertPlayerMeta,
  type UpsertMatchInput,
} from "@/lib/db/matches";

const STRATZ_URL = "https://api.stratz.com/graphql";
const STRATZ_UA = "STRATZ_API";
const PAGE_SIZE = 100;
const MAX_PAGES = 150;  // ~15k matches at PAGE_SIZE 100

type StratzMatchNode = {
  id: number;
  startDateTime?: number | null;
  lobbyType?: number | null;
  players?: Array<{
    steamAccountId?: number | null;
    heroId?: number | null;
    isVictory?: boolean | null;
    kills?: number | null;
    deaths?: number | null;
    assists?: number | null;
  }> | null;
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

const MATCHES_QUERY = `
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
      lobbyType
      players {
        steamAccountId
        heroId
        isVictory
        kills
        deaths
        assists
      }
    }
  }
}
`;

function nodeToUpsert(node: StratzMatchNode): UpsertMatchInput | null {
  const me = (node.players ?? []).find(
    (p) => Number(p.steamAccountId) === ACCOUNT_ID,
  );
  if (!me || node.id == null) return null;
  return {
    match_id: Number(node.id),
    start_time: Number(node.startDateTime ?? 0),
    hero_id: Number(me.heroId ?? 0),
    win: Boolean(me.isVictory),
    kills: Number(me.kills ?? 0),
    deaths: Number(me.deaths ?? 0),
    assists: Number(me.assists ?? 0),
    lobby_type: 7,
    source: "stratz",
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

/**
 * STRATZ GraphQL sync. Skips quietly when STRATZ_API_TOKEN is missing.
 * Merges without wiping richer OpenDota KDA (handled in upsertMatches).
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

  for (let page = 0; page < MAX_PAGES; page += 1) {
    if (page > 0) await sleep(150);
    const skip = page * PAGE_SIZE;
    const json = await stratzGraphql<StratzPlayerPayload>(
      MATCHES_QUERY,
      { steamAccountId: ACCOUNT_ID, take: PAGE_SIZE, skip },
      token,
    );

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

  const insertedOrUpdated = await upsertMatches(collected);

  await setSyncState(
    "stratz_last_sync",
    JSON.stringify({
      at: new Date().toISOString(),
      pages,
      insertedOrUpdated,
      stoppedAtKnown,
      full,
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
