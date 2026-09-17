import { unstable_cache } from "next/cache";
import { fetchRankedMatches } from "@/lib/opendota";
import { toCompactMatches, type CompactMatch } from "@/lib/stats";

export type CachedMatchBundle = {
  matches: CompactMatch[];
  fetchedAt: string;
  count: number;
};

/**
 * Full ranked history in Next.js Data Cache (Vercel edge/data cache).
 * Pattern used by stats apps (e.g. SQLite/Turso offline store): persist once,
 * then refresh on a long TTL instead of live-paginating OpenDota every request.
 */
export const getCachedCompactMatches = unstable_cache(
  async (): Promise<CachedMatchBundle> => {
    const raw = await fetchRankedMatches(3600);
    const matches = toCompactMatches(raw);
    return {
      matches,
      fetchedAt: new Date().toISOString(),
      count: matches.length,
    };
  },
  ["zhou-ranked-compact-v1"],
  { revalidate: 3600, tags: ["zhou-matches"] },
);
