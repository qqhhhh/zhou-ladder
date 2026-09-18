-- Zhou ladder Turso schema (paste into Turso shell / dashboard SQL)
-- Account: 90137663 (Zhou)
-- For live DBs created before enrich columns, also run scripts/migrate-enrich.sql

CREATE TABLE IF NOT EXISTS ranked_matches (
  match_id INTEGER PRIMARY KEY,
  start_time INTEGER NOT NULL,
  hero_id INTEGER,
  win INTEGER,
  kills INTEGER,
  deaths INTEGER,
  assists INTEGER,
  lobby_type INTEGER DEFAULT 7,
  source TEXT,
  updated_at TEXT,
  -- enriched stats (nullable for old / partial rows)
  duration INTEGER,
  player_slot INTEGER,
  party_size INTEGER,
  game_mode INTEGER,
  average_rank INTEGER,
  leaver_status INTEGER,
  gold_per_min INTEGER,
  xp_per_min INTEGER,
  hero_damage INTEGER,
  tower_damage INTEGER,
  hero_healing INTEGER,
  last_hits INTEGER,
  denies INTEGER,
  net_worth INTEGER,
  award TEXT,
  imp INTEGER,
  -- full upstream payload(s); prefer {"opendota":..., "stratz":...} when merged
  raw_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_ranked_matches_start_time
  ON ranked_matches (start_time DESC);

CREATE TABLE IF NOT EXISTS sync_state (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS player_meta (
  account_id INTEGER PRIMARY KEY,
  rank_tier INTEGER,
  leaderboard_rank INTEGER,
  personaname TEXT,
  avatar TEXT,
  updated_at TEXT
);
