import {
  listCompactMatches,
  getSyncState,
} from "@/lib/db/matches";
import type { CompactMatch } from "@/lib/stats";

export type CachedMatchBundle = {
  matches: CompactMatch[];
  fetchedAt: string;
  count: number;
};

/**
 * Full ranked history from Turso (display source of truth).
 * Does NOT call OpenDota on the request path — sync via /api/sync.
 */
export async function getCachedCompactMatches(): Promise<CachedMatchBundle> {
  const matches = await listCompactMatches();
  let fetchedAt = new Date().toISOString();
  try {
    const raw = await getSyncState("opendota_last_sync");
    if (raw) {
      const parsed = JSON.parse(raw) as { at?: string };
      if (parsed.at) fetchedAt = parsed.at;
    }
  } catch {
    // keep default fetchedAt
  }
  return {
    matches,
    fetchedAt,
    count: matches.length,
  };
}
