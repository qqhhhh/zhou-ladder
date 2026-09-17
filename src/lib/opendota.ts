import type { LadderPayload, OpenDotaHero, OpenDotaMatch, OpenDotaPlayer } from "./types";

export const ACCOUNT_ID = 90137663;
export const OPENDOTA_UA =
  "zhou-ladder/1.0 (+https://oldboys.games; Zhou Dota2 ladder stats; contact via GitHub qqhhhh/zhou-ladder)";

const BASE = "https://api.opendota.com/api";
const MATCH_PAGE_SIZE = 200;
/** Hard stop so a bad API loop can't hang the deploy forever (~40k matches). */
const MATCH_MAX_PAGES = 200;
const MATCH_FETCH_CONCURRENCY = 10;
/** Full history is expensive; cache aggressively after the first warm pull. */
const MATCH_REVALIDATE = 3600;

async function opendotaFetch<T>(path: string, revalidate = 180): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "User-Agent": OPENDOTA_UA,
      Accept: "application/json",
    },
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`OpenDota ${path} failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchPlayer(revalidate = 180): Promise<OpenDotaPlayer> {
  const raw = await opendotaFetch<OpenDotaPlayer & { computed_mmr?: number }>(
    `/players/${ACCOUNT_ID}`,
    revalidate,
  );
  // Strip computed_mmr so it never leaks into UI props
  const { computed_mmr: _ignored, ...safe } = raw as OpenDotaPlayer & {
    computed_mmr?: number;
  };
  void _ignored;
  return safe;
}

/**
 * Paginate OpenDota ranked matches (lobby_type=7) until a short/empty page.
 * Uses offset + limit; each URL is cached independently by Next.js.
 */
export async function fetchRankedMatches(
  revalidate = MATCH_REVALIDATE,
): Promise<OpenDotaMatch[]> {
  const all: OpenDotaMatch[] = [];
  const seen = new Set<number>();
  let offset = 0;
  let exhausted = false;

  while (!exhausted && offset / MATCH_PAGE_SIZE < MATCH_MAX_PAGES) {
    const batchOffsets: number[] = [];
    for (let i = 0; i < MATCH_FETCH_CONCURRENCY; i += 1) {
      const off = offset + i * MATCH_PAGE_SIZE;
      if (off / MATCH_PAGE_SIZE >= MATCH_MAX_PAGES) break;
      batchOffsets.push(off);
    }

    const pages = await Promise.all(
      batchOffsets.map((off) =>
        opendotaFetch<OpenDotaMatch[]>(
          `/players/${ACCOUNT_ID}/matches?lobby_type=7&limit=${MATCH_PAGE_SIZE}&offset=${off}`,
          revalidate,
        ),
      ),
    );

    for (const page of pages) {
      if (page.length === 0) {
        exhausted = true;
        continue;
      }
      for (const m of page) {
        if (seen.has(m.match_id)) continue;
        seen.add(m.match_id);
        all.push(m);
      }
      if (page.length < MATCH_PAGE_SIZE) {
        exhausted = true;
      }
    }

    offset += batchOffsets.length * MATCH_PAGE_SIZE;
  }

  return all;
}

export async function fetchHeroes(revalidate = 86400): Promise<OpenDotaHero[]> {
  return opendotaFetch<OpenDotaHero[]>("/heroes", revalidate);
}

export async function fetchLadderData(): Promise<LadderPayload> {
  const [player, matches, heroes] = await Promise.all([
    fetchPlayer(180),
    fetchRankedMatches(MATCH_REVALIDATE),
    fetchHeroes(86400),
  ]);

  return {
    player,
    matches,
    heroes,
    fetchedAt: new Date().toISOString(),
  };
}

/** Steam CDN hero portrait from OpenDota hero internal name */
export function heroIconUrl(heroInternalName: string): string {
  const slug = heroInternalName.replace(/^npc_dota_hero_/, "");
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${slug}.png`;
}

/** rank_tier: tens digit = medal (1-8), ones = stars (1-5). 80 = Immortal */
export function formatRankTier(
  rankTier: number | null,
  leaderboardRank: number | null,
): string {
  if (rankTier == null) return "未定级";
  const medal = Math.floor(rankTier / 10);
  const stars = rankTier % 10;
  const names: Record<number, string> = {
    1: "先锋",
    2: "卫士",
    3: "中军",
    4: "统帅",
    5: "传奇",
    6: "万古流芳",
    7: "超凡入圣",
    8: "冠绝一世",
  };
  const label = names[medal] ?? `段位${medal}`;
  if (medal === 8) {
    return leaderboardRank != null
      ? `${label} #${leaderboardRank}`
      : label;
  }
  return stars > 0 ? `${label} ${stars}` : label;
}
