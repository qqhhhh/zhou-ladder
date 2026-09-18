-- Zhou ladder Turso schema (paste into Turso shell / dashboard SQL)
-- Account: 90137663 (Zhou)

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
  updated_at TEXT
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
