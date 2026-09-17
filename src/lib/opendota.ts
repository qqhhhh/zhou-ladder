import type { LadderPayload, OpenDotaHero, OpenDotaMatch, OpenDotaPlayer } from "./types";

export const ACCOUNT_ID = 90137663;
export const OPENDOTA_UA =
  "zhou-ladder/1.0 (+https://oldboys.games; Zhou Dota2 ladder stats; contact via GitHub qqhhhh/zhou-ladder)";

const BASE = "https://api.opendota.com/api";
const MATCH_PAGE_SIZE = 200;
/** Hard stop so a bad API loop can't hang forever (~40k matches). */
const MATCH_MAX_PAGES = 200;
/** Full history is expensive; cache aggressively after the first warm pull. */
const MATCH_REVALIDATE = 3600;
const PAGE_GAP_MS = 120;
const RETRY_MAX = 6;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function opendotaFetch<T>(path: string, revalidate = 180): Promise<T> {
  let lastStatus = 0;
  for (let attempt = 0; attempt < RETRY_MAX; attempt += 1) {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        "User-Agent": OPENDOTA_UA,
        Accept: "application/json",
      },
      next: { revalidate },
    });
    lastStatus = res.status;
    if (res.ok) {
      return res.json() as Promise<T>;
    }
    // Rate limited — back off and retry
    if (res.status === 429 || res.status === 503) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : 500 * 2 ** attempt;
      await sleep(waitMs);
      continue;
    }
    throw new Error(`对局数据请求失败（${res.status}）`);
  }
  throw new Error(`对局数据请求过于频繁（${lastStatus}），请稍后刷新`);
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
 * Sequential + 429 backoff to stay under OpenDota rate limits (~10k matches).
 */
export async function fetchRankedMatches(
  revalidate = MATCH_REVALIDATE,
): Promise<OpenDotaMatch[]> {
  const all: OpenDotaMatch[] = [];
  const seen = new Set<number>();

  for (let page = 0; page < MATCH_MAX_PAGES; page += 1) {
    const offset = page * MATCH_PAGE_SIZE;
    if (page > 0) await sleep(PAGE_GAP_MS);

    const batch = await opendotaFetch<OpenDotaMatch[]>(
      `/players/${ACCOUNT_ID}/matches?lobby_type=7&limit=${MATCH_PAGE_SIZE}&offset=${offset}`,
      revalidate,
    );

    if (batch.length === 0) break;

    for (const m of batch) {
      if (seen.has(m.match_id)) continue;
      seen.add(m.match_id);
      all.push(m);
    }

    if (batch.length < MATCH_PAGE_SIZE) break;
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
