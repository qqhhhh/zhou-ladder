import { getTurso } from "@/lib/turso";
import type { CompactMatch } from "@/lib/stats";
import { ACCOUNT_ID } from "@/lib/opendota";

export type PlayerMetaRow = {
  account_id: number;
  rank_tier: number | null;
  leaderboard_rank: number | null;
  personaname: string | null;
  avatar: string | null;
  updated_at: string | null;
};

export type RankedMatchRow = {
  match_id: number;
  start_time: number;
  hero_id: number | null;
  win: number | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  lobby_type: number | null;
  source: string | null;
  updated_at: string | null;
};

function rowToCompact(r: RankedMatchRow): CompactMatch {
  return {
    match_id: r.match_id,
    start_time: r.start_time,
    hero_id: r.hero_id ?? 0,
    kills: r.kills ?? 0,
    deaths: r.deaths ?? 0,
    assists: r.assists ?? 0,
    win: Boolean(r.win),
    lobby_type: r.lobby_type ?? 7,
  };
}

/** All ranked matches from Turso, newest first then sorted asc for callers. */
export async function listCompactMatches(): Promise<CompactMatch[]> {
  const db = getTurso();
  const result = await db.execute(
    `SELECT match_id, start_time, hero_id, win, kills, deaths, assists, lobby_type, source, updated_at
     FROM ranked_matches
     WHERE lobby_type = 7 OR lobby_type IS NULL
     ORDER BY start_time ASC`,
  );

  return result.rows.map((row) =>
    rowToCompact({
      match_id: Number(row.match_id),
      start_time: Number(row.start_time),
      hero_id: row.hero_id == null ? null : Number(row.hero_id),
      win: row.win == null ? null : Number(row.win),
      kills: row.kills == null ? null : Number(row.kills),
      deaths: row.deaths == null ? null : Number(row.deaths),
      assists: row.assists == null ? null : Number(row.assists),
      lobby_type: row.lobby_type == null ? null : Number(row.lobby_type),
      source: row.source == null ? null : String(row.source),
      updated_at: row.updated_at == null ? null : String(row.updated_at),
    }),
  );
}

/** Ranked matches with start_time >= minStartTime (unix sec), ascending. */
export async function listCompactMatchesSince(
  minStartTime: number,
): Promise<CompactMatch[]> {
  const db = getTurso();
  const result = await db.execute({
    sql: `SELECT match_id, start_time, hero_id, win, kills, deaths, assists, lobby_type, source, updated_at
          FROM ranked_matches
          WHERE (lobby_type = 7 OR lobby_type IS NULL)
            AND start_time >= ?
          ORDER BY start_time ASC`,
    args: [minStartTime],
  });

  return result.rows.map((row) =>
    rowToCompact({
      match_id: Number(row.match_id),
      start_time: Number(row.start_time),
      hero_id: row.hero_id == null ? null : Number(row.hero_id),
      win: row.win == null ? null : Number(row.win),
      kills: row.kills == null ? null : Number(row.kills),
      deaths: row.deaths == null ? null : Number(row.deaths),
      assists: row.assists == null ? null : Number(row.assists),
      lobby_type: row.lobby_type == null ? null : Number(row.lobby_type),
      source: row.source == null ? null : String(row.source),
      updated_at: row.updated_at == null ? null : String(row.updated_at),
    }),
  );
}

/** Ranked matches in [minStartTime, maxStartTime] inclusive (unix sec), ascending. */
export async function listCompactMatchesBetween(
  minStartTime: number,
  maxStartTime: number,
): Promise<CompactMatch[]> {
  const db = getTurso();
  const result = await db.execute({
    sql: `SELECT match_id, start_time, hero_id, win, kills, deaths, assists, lobby_type, source, updated_at
          FROM ranked_matches
          WHERE (lobby_type = 7 OR lobby_type IS NULL)
            AND start_time >= ?
            AND start_time <= ?
          ORDER BY start_time ASC`,
    args: [minStartTime, maxStartTime],
  });

  return result.rows.map((row) =>
    rowToCompact({
      match_id: Number(row.match_id),
      start_time: Number(row.start_time),
      hero_id: row.hero_id == null ? null : Number(row.hero_id),
      win: row.win == null ? null : Number(row.win),
      kills: row.kills == null ? null : Number(row.kills),
      deaths: row.deaths == null ? null : Number(row.deaths),
      assists: row.assists == null ? null : Number(row.assists),
      lobby_type: row.lobby_type == null ? null : Number(row.lobby_type),
      source: row.source == null ? null : String(row.source),
      updated_at: row.updated_at == null ? null : String(row.updated_at),
    }),
  );
}

/** Recent N matches for fast SSR bootstrap (newest first → reverse to asc). */
export async function listRecentCompactMatches(
  limit = 200,
): Promise<CompactMatch[]> {
  const db = getTurso();
  const result = await db.execute({
    sql: `SELECT match_id, start_time, hero_id, win, kills, deaths, assists, lobby_type, source, updated_at
          FROM ranked_matches
          WHERE lobby_type = 7 OR lobby_type IS NULL
          ORDER BY start_time DESC
          LIMIT ?`,
    args: [limit],
  });

  const rows = result.rows.map((row) =>
    rowToCompact({
      match_id: Number(row.match_id),
      start_time: Number(row.start_time),
      hero_id: row.hero_id == null ? null : Number(row.hero_id),
      win: row.win == null ? null : Number(row.win),
      kills: row.kills == null ? null : Number(row.kills),
      deaths: row.deaths == null ? null : Number(row.deaths),
      assists: row.assists == null ? null : Number(row.assists),
      lobby_type: row.lobby_type == null ? null : Number(row.lobby_type),
      source: row.source == null ? null : String(row.source),
      updated_at: row.updated_at == null ? null : String(row.updated_at),
    }),
  );
  return rows.reverse();
}

export async function getPlayerMeta(
  accountId = ACCOUNT_ID,
): Promise<PlayerMetaRow | null> {
  const db = getTurso();
  const result = await db.execute({
    sql: `SELECT account_id, rank_tier, leaderboard_rank, personaname, avatar, updated_at
          FROM player_meta WHERE account_id = ?`,
    args: [accountId],
  });
  const row = result.rows[0];
  if (!row) return null;
  return {
    account_id: Number(row.account_id),
    rank_tier: row.rank_tier == null ? null : Number(row.rank_tier),
    leaderboard_rank:
      row.leaderboard_rank == null ? null : Number(row.leaderboard_rank),
    personaname: row.personaname == null ? null : String(row.personaname),
    avatar: row.avatar == null ? null : String(row.avatar),
    updated_at: row.updated_at == null ? null : String(row.updated_at),
  };
}

export type UpsertMatchInput = {
  match_id: number;
  start_time: number;
  hero_id: number;
  win: boolean | number;
  kills: number;
  deaths: number;
  assists: number;
  lobby_type?: number;
  source: string;
};

/**
 * Upsert matches. When merging STRATZ over OpenDota (or vice versa):
 * - Prefer non-zero / richer KDA if the other source has zeros/nulls.
 * - Never wipe richer OpenDota KDA with empty STRATZ values.
 */
export async function upsertMatches(matches: UpsertMatchInput[]): Promise<number> {
  if (matches.length === 0) return 0;
  const db = getTurso();
  const now = new Date().toISOString();
  let written = 0;

  // Batch in chunks to stay under libSQL statement limits
  const CHUNK = 40;
  for (let i = 0; i < matches.length; i += CHUNK) {
    const chunk = matches.slice(i, i + CHUNK);
    const stmts = chunk.map((m) => ({
      sql: `INSERT INTO ranked_matches
              (match_id, start_time, hero_id, win, kills, deaths, assists, lobby_type, source, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(match_id) DO UPDATE SET
              start_time = excluded.start_time,
              hero_id = COALESCE(excluded.hero_id, ranked_matches.hero_id),
              win = COALESCE(excluded.win, ranked_matches.win),
              kills = CASE
                WHEN excluded.kills IS NOT NULL
                  AND (ranked_matches.kills IS NULL
                       OR (ranked_matches.kills = 0 AND ranked_matches.deaths = 0 AND ranked_matches.assists = 0
                           AND (excluded.kills + excluded.deaths + excluded.assists) > 0))
                THEN excluded.kills
                WHEN excluded.source = 'opendota' THEN excluded.kills
                ELSE ranked_matches.kills
              END,
              deaths = CASE
                WHEN excluded.deaths IS NOT NULL
                  AND (ranked_matches.deaths IS NULL
                       OR (ranked_matches.kills = 0 AND ranked_matches.deaths = 0 AND ranked_matches.assists = 0
                           AND (excluded.kills + excluded.deaths + excluded.assists) > 0))
                THEN excluded.deaths
                WHEN excluded.source = 'opendota' THEN excluded.deaths
                ELSE ranked_matches.deaths
              END,
              assists = CASE
                WHEN excluded.assists IS NOT NULL
                  AND (ranked_matches.assists IS NULL
                       OR (ranked_matches.kills = 0 AND ranked_matches.deaths = 0 AND ranked_matches.assists = 0
                           AND (excluded.kills + excluded.deaths + excluded.assists) > 0))
                THEN excluded.assists
                WHEN excluded.source = 'opendota' THEN excluded.assists
                ELSE ranked_matches.assists
              END,
              lobby_type = COALESCE(excluded.lobby_type, ranked_matches.lobby_type),
              source = CASE
                WHEN ranked_matches.source IS NULL THEN excluded.source
                WHEN ranked_matches.source = excluded.source THEN excluded.source
                ELSE ranked_matches.source || '+' || excluded.source
              END,
              updated_at = excluded.updated_at`,
      args: [
        m.match_id,
        m.start_time,
        m.hero_id,
        m.win ? 1 : 0,
        m.kills,
        m.deaths,
        m.assists,
        m.lobby_type ?? 7,
        m.source,
        now,
      ] as (string | number)[],
    }));
    await db.batch(stmts, "write");
    written += chunk.length;
  }
  return written;
}

export async function upsertPlayerMeta(meta: {
  account_id?: number;
  rank_tier: number | null;
  leaderboard_rank: number | null;
  personaname: string | null;
  avatar: string | null;
}): Promise<void> {
  const db = getTurso();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO player_meta
            (account_id, rank_tier, leaderboard_rank, personaname, avatar, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(account_id) DO UPDATE SET
            rank_tier = COALESCE(excluded.rank_tier, player_meta.rank_tier),
            leaderboard_rank = COALESCE(excluded.leaderboard_rank, player_meta.leaderboard_rank),
            personaname = COALESCE(excluded.personaname, player_meta.personaname),
            avatar = COALESCE(excluded.avatar, player_meta.avatar),
            updated_at = excluded.updated_at`,
    args: [
      meta.account_id ?? ACCOUNT_ID,
      meta.rank_tier,
      meta.leaderboard_rank,
      meta.personaname,
      meta.avatar,
      now,
    ],
  });
}

export async function getSyncState(key: string): Promise<string | null> {
  const db = getTurso();
  const result = await db.execute({
    sql: `SELECT value FROM sync_state WHERE key = ?`,
    args: [key],
  });
  const row = result.rows[0];
  return row?.value == null ? null : String(row.value);
}

export async function setSyncState(key: string, value: string): Promise<void> {
  const db = getTurso();
  await db.execute({
    sql: `INSERT INTO sync_state (key, value) VALUES (?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    args: [key, value],
  });
}

/** Highest known match_id in Turso (for incremental watermark). */
export async function getMaxMatchId(): Promise<number | null> {
  const db = getTurso();
  const result = await db.execute(
    `SELECT MAX(match_id) AS max_id FROM ranked_matches`,
  );
  const v = result.rows[0]?.max_id;
  if (v == null) return null;
  return Number(v);
}

export async function countMatches(): Promise<number> {
  const db = getTurso();
  const result = await db.execute(
    `SELECT COUNT(*) AS c FROM ranked_matches`,
  );
  return Number(result.rows[0]?.c ?? 0);
}
