import { getTurso } from "@/lib/turso";
import type { CompactMatch } from "@/lib/stats";
import { ACCOUNT_ID } from "@/lib/opendota";

/** Slim columns only — hot display paths must never touch raw_json / rich stats. */
const SLIM_COLUMNS =
  "match_id, start_time, hero_id, win, kills, deaths, assists, lobby_type";

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
  duration: number | null;
  player_slot: number | null;
  party_size: number | null;
  game_mode: number | null;
  average_rank: number | null;
  leaver_status: number | null;
  gold_per_min: number | null;
  xp_per_min: number | null;
  hero_damage: number | null;
  tower_damage: number | null;
  hero_healing: number | null;
  last_hits: number | null;
  denies: number | null;
  net_worth: number | null;
  award: string | null;
  imp: number | null;
  raw_json: string | null;
};

function rowToCompact(r: {
  match_id: number;
  start_time: number;
  hero_id: number | null;
  win: number | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  lobby_type: number | null;
}): CompactMatch {
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

function mapSlimRow(row: Record<string, unknown>): CompactMatch {
  return rowToCompact({
    match_id: Number(row.match_id),
    start_time: Number(row.start_time),
    hero_id: row.hero_id == null ? null : Number(row.hero_id),
    win: row.win == null ? null : Number(row.win),
    kills: row.kills == null ? null : Number(row.kills),
    deaths: row.deaths == null ? null : Number(row.deaths),
    assists: row.assists == null ? null : Number(row.assists),
    lobby_type: row.lobby_type == null ? null : Number(row.lobby_type),
  });
}

function numOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function strOrNull(v: unknown): string | null {
  if (v == null) return null;
  return String(v);
}

function mapRichRow(row: Record<string, unknown>): RankedMatchRow {
  return {
    match_id: Number(row.match_id),
    start_time: Number(row.start_time),
    hero_id: numOrNull(row.hero_id),
    win: numOrNull(row.win),
    kills: numOrNull(row.kills),
    deaths: numOrNull(row.deaths),
    assists: numOrNull(row.assists),
    lobby_type: numOrNull(row.lobby_type),
    source: strOrNull(row.source),
    updated_at: strOrNull(row.updated_at),
    duration: numOrNull(row.duration),
    player_slot: numOrNull(row.player_slot),
    party_size: numOrNull(row.party_size),
    game_mode: numOrNull(row.game_mode),
    average_rank: numOrNull(row.average_rank),
    leaver_status: numOrNull(row.leaver_status),
    gold_per_min: numOrNull(row.gold_per_min),
    xp_per_min: numOrNull(row.xp_per_min),
    hero_damage: numOrNull(row.hero_damage),
    tower_damage: numOrNull(row.tower_damage),
    hero_healing: numOrNull(row.hero_healing),
    last_hits: numOrNull(row.last_hits),
    denies: numOrNull(row.denies),
    net_worth: numOrNull(row.net_worth),
    award: strOrNull(row.award),
    imp: numOrNull(row.imp),
    raw_json: strOrNull(row.raw_json),
  };
}

/** Wrap a source payload under {opendota|stratz: ...} for merge-friendly storage. */
export function wrapRawJson(source: string, payload: unknown): string {
  const key = source === "stratz" ? "stratz" : source === "opendota" ? "opendota" : source;
  return JSON.stringify({ [key]: payload });
}

/** All ranked matches from Turso, ascending. Slim SELECT only. */
export async function listCompactMatches(): Promise<CompactMatch[]> {
  const db = getTurso();
  const result = await db.execute(
    `SELECT ${SLIM_COLUMNS}
     FROM ranked_matches
     WHERE lobby_type = 7 OR lobby_type IS NULL
     ORDER BY start_time ASC`,
  );
  return result.rows.map((row) => mapSlimRow(row as Record<string, unknown>));
}

/** Ranked matches with start_time >= minStartTime (unix sec), ascending. Slim SELECT. */
export async function listCompactMatchesSince(
  minStartTime: number,
): Promise<CompactMatch[]> {
  const db = getTurso();
  const result = await db.execute({
    sql: `SELECT ${SLIM_COLUMNS}
          FROM ranked_matches
          WHERE (lobby_type = 7 OR lobby_type IS NULL)
            AND start_time >= ?
          ORDER BY start_time ASC`,
    args: [minStartTime],
  });
  return result.rows.map((row) => mapSlimRow(row as Record<string, unknown>));
}

/** Ranked matches in [minStartTime, maxStartTime] inclusive, ascending. Slim SELECT. */
export async function listCompactMatchesBetween(
  minStartTime: number,
  maxStartTime: number,
): Promise<CompactMatch[]> {
  const db = getTurso();
  const result = await db.execute({
    sql: `SELECT ${SLIM_COLUMNS}
          FROM ranked_matches
          WHERE (lobby_type = 7 OR lobby_type IS NULL)
            AND start_time >= ?
            AND start_time <= ?
          ORDER BY start_time ASC`,
    args: [minStartTime, maxStartTime],
  });
  return result.rows.map((row) => mapSlimRow(row as Record<string, unknown>));
}

/** Recent N matches for fast SSR bootstrap. Slim SELECT. */
export async function listRecentCompactMatches(
  limit = 200,
): Promise<CompactMatch[]> {
  const db = getTurso();
  const result = await db.execute({
    sql: `SELECT ${SLIM_COLUMNS}
          FROM ranked_matches
          WHERE lobby_type = 7 OR lobby_type IS NULL
          ORDER BY start_time DESC
          LIMIT ?`,
    args: [limit],
  });
  const rows = result.rows.map((row) =>
    mapSlimRow(row as Record<string, unknown>),
  );
  return rows.reverse();
}

/**
 * Full rich row for a single match (incl. raw_json). Not used by Dashboard —
 * for future detail UI / tooling only.
 */
export async function getMatchRich(
  matchId: number,
): Promise<RankedMatchRow | null> {
  const db = getTurso();
  const result = await db.execute({
    sql: `SELECT match_id, start_time, hero_id, win, kills, deaths, assists,
                 lobby_type, source, updated_at,
                 duration, player_slot, party_size, game_mode, average_rank,
                 leaver_status, gold_per_min, xp_per_min, hero_damage,
                 tower_damage, hero_healing, last_hits, denies, net_worth,
                 award, imp, raw_json
          FROM ranked_matches WHERE match_id = ?`,
    args: [matchId],
  });
  const row = result.rows[0];
  if (!row) return null;
  return mapRichRow(row as Record<string, unknown>);
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
  duration?: number | null;
  player_slot?: number | null;
  party_size?: number | null;
  game_mode?: number | null;
  average_rank?: number | null;
  leaver_status?: number | null;
  gold_per_min?: number | null;
  xp_per_min?: number | null;
  hero_damage?: number | null;
  tower_damage?: number | null;
  hero_healing?: number | null;
  last_hits?: number | null;
  denies?: number | null;
  net_worth?: number | null;
  award?: string | null;
  imp?: number | null;
  /** Plain upstream object or already-stringified JSON; wrapped under source key on write. */
  raw?: unknown;
  /** If set, used as-is (should already be wrapRawJson form). Overrides `raw`. */
  raw_json?: string | null;
};

function resolveRawJson(m: UpsertMatchInput): string | null {
  if (m.raw_json != null && m.raw_json !== "") return m.raw_json;
  if (m.raw !== undefined) return wrapRawJson(m.source, m.raw);
  return null;
}

/**
 * Upsert matches with rich columns + raw_json.
 * ON CONFLICT: prefer non-null excluded values; KDA keeps opendota-prefer / empty-fill rules;
 * raw_json merges opendota/stratz keys via json_extract (excluded source wins when present).
 */
function sqlNum(v: number | null | undefined): number | null {
  if (v == null) return null;
  return Number.isFinite(v) ? v : null;
}

export async function upsertMatches(matches: UpsertMatchInput[]): Promise<number> {
  if (matches.length === 0) return 0;
  const db = getTurso();
  const now = new Date().toISOString();
  let written = 0;

  const CHUNK = 30;
  for (let i = 0; i < matches.length; i += CHUNK) {
    const chunk = matches.slice(i, i + CHUNK);
    const stmts = chunk.map((m) => ({
      sql: `INSERT INTO ranked_matches (
              match_id, start_time, hero_id, win, kills, deaths, assists,
              lobby_type, source, updated_at,
              duration, player_slot, party_size, game_mode, average_rank,
              leaver_status, gold_per_min, xp_per_min, hero_damage,
              tower_damage, hero_healing, last_hits, denies, net_worth,
              award, imp, raw_json
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?,
              ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, ?
            )
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
              duration = COALESCE(excluded.duration, ranked_matches.duration),
              player_slot = COALESCE(excluded.player_slot, ranked_matches.player_slot),
              party_size = COALESCE(excluded.party_size, ranked_matches.party_size),
              game_mode = COALESCE(excluded.game_mode, ranked_matches.game_mode),
              average_rank = COALESCE(excluded.average_rank, ranked_matches.average_rank),
              leaver_status = COALESCE(excluded.leaver_status, ranked_matches.leaver_status),
              gold_per_min = COALESCE(excluded.gold_per_min, ranked_matches.gold_per_min),
              xp_per_min = COALESCE(excluded.xp_per_min, ranked_matches.xp_per_min),
              hero_damage = COALESCE(excluded.hero_damage, ranked_matches.hero_damage),
              tower_damage = COALESCE(excluded.tower_damage, ranked_matches.tower_damage),
              hero_healing = COALESCE(excluded.hero_healing, ranked_matches.hero_healing),
              last_hits = COALESCE(excluded.last_hits, ranked_matches.last_hits),
              denies = COALESCE(excluded.denies, ranked_matches.denies),
              net_worth = COALESCE(excluded.net_worth, ranked_matches.net_worth),
              award = COALESCE(excluded.award, ranked_matches.award),
              imp = COALESCE(excluded.imp, ranked_matches.imp),
              raw_json = CASE
                WHEN ranked_matches.raw_json IS NULL THEN excluded.raw_json
                WHEN excluded.raw_json IS NULL THEN ranked_matches.raw_json
                ELSE json_object(
                  'opendota', COALESCE(
                    json_extract(excluded.raw_json, '$.opendota'),
                    json_extract(ranked_matches.raw_json, '$.opendota')
                  ),
                  'stratz', COALESCE(
                    json_extract(excluded.raw_json, '$.stratz'),
                    json_extract(ranked_matches.raw_json, '$.stratz')
                  )
                )
              END,
              source = CASE
                WHEN ranked_matches.source IS NULL THEN excluded.source
                WHEN ranked_matches.source = excluded.source THEN excluded.source
                WHEN instr(ranked_matches.source, excluded.source) > 0 THEN ranked_matches.source
                ELSE ranked_matches.source || '+' || excluded.source
              END,
              updated_at = excluded.updated_at`,
      args: [
        m.match_id,
        m.start_time,
        sqlNum(m.hero_id) ?? 0,
        m.win ? 1 : 0,
        sqlNum(m.kills) ?? 0,
        sqlNum(m.deaths) ?? 0,
        sqlNum(m.assists) ?? 0,
        sqlNum(m.lobby_type) ?? 7,
        m.source,
        now,
        sqlNum(m.duration),
        sqlNum(m.player_slot),
        sqlNum(m.party_size),
        sqlNum(m.game_mode),
        sqlNum(m.average_rank),
        sqlNum(m.leaver_status),
        sqlNum(m.gold_per_min),
        sqlNum(m.xp_per_min),
        sqlNum(m.hero_damage),
        sqlNum(m.tower_damage),
        sqlNum(m.hero_healing),
        sqlNum(m.last_hits),
        sqlNum(m.denies),
        sqlNum(m.net_worth),
        m.award ?? null,
        sqlNum(m.imp),
        resolveRawJson(m),
      ] as (string | number | null)[],
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
