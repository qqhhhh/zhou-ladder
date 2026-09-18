import { unstable_cache } from "next/cache";
import {
  listCompactMatches,
  listCompactMatchesSince,
  listCompactMatchesBetween,
  getSyncState,
} from "@/lib/db/matches";
import type { CompactMatch } from "@/lib/stats";

export type CachedMatchBundle = {
  matches: CompactMatch[];
  fetchedAt: string;
  count: number;
  /** Effective lower bound used for the query (unix sec), or null if full history. */
  since: number | null;
  until: number | null;
};

export { toSlimMatch, fromSlimMatch, type SlimMatch } from "@/lib/slimMatch";

async function resolveFetchedAt(): Promise<string> {
  let fetchedAt = new Date().toISOString();
  try {
    const raw = await getSyncState("opendota_last_sync");
    if (raw) {
      const parsed = JSON.parse(raw) as { at?: string };
      if (parsed.at) fetchedAt = parsed.at;
    }
  } catch {
    // keep default
  }
  return fetchedAt;
}

/**
 * Turso compact matches with short unstable_cache keys including range.
 * Prefer days-scoped queries over dumping full ~10k history.
 */
export async function getCachedCompactMatches(opts?: {
  days?: number | "all";
  from?: number | null;
  to?: number | null;
}): Promise<CachedMatchBundle> {
  const days = opts?.days;
  const from = opts?.from ?? null;
  const to = opts?.to ?? null;

  let cacheKey: string;
  if (from != null || to != null) {
    cacheKey = `from-${from ?? "open"}-to-${to ?? "open"}`;
  } else if (days === "all") {
    cacheKey = "all";
  } else if (typeof days === "number") {
    cacheKey = `days-${days}`;
  } else {
    cacheKey = "all";
  }

  return unstable_cache(
    async (): Promise<CachedMatchBundle> => {
      let since: number | null = null;
      let until: number | null = null;
      let matches: CompactMatch[];

      if (from != null || to != null) {
        since = from;
        until = to;
        if (from != null && to != null) {
          matches = await listCompactMatchesBetween(from, to);
        } else if (from != null) {
          matches = await listCompactMatchesSince(from);
        } else {
          // only `to` — rare; filter full list client-side equivalent
          matches = (await listCompactMatches()).filter(
            (m) => to == null || m.start_time <= to,
          );
        }
      } else if (typeof days === "number") {
        since = Math.floor(Date.now() / 1000) - days * 86400;
        matches = await listCompactMatchesSince(since);
      } else {
        matches = await listCompactMatches();
      }

      const fetchedAt = await resolveFetchedAt();
      return {
        matches,
        fetchedAt,
        count: matches.length,
        since,
        until,
      };
    },
    ["compact-matches", cacheKey],
    { revalidate: 60 },
  )();
}
