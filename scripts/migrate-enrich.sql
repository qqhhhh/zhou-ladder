-- Enrich ranked_matches for richer future UI (nullable columns; old rows stay valid).
-- Run once on live Turso after deploying schema that lacked these columns.
-- SQLite/libSQL has no ADD COLUMN IF NOT EXISTS: if a column already exists,
-- that statement errors — skip it and continue with the rest.

ALTER TABLE ranked_matches ADD COLUMN duration INTEGER;
ALTER TABLE ranked_matches ADD COLUMN player_slot INTEGER;
ALTER TABLE ranked_matches ADD COLUMN party_size INTEGER;
ALTER TABLE ranked_matches ADD COLUMN game_mode INTEGER;
ALTER TABLE ranked_matches ADD COLUMN average_rank INTEGER;
ALTER TABLE ranked_matches ADD COLUMN leaver_status INTEGER;
ALTER TABLE ranked_matches ADD COLUMN gold_per_min INTEGER;
ALTER TABLE ranked_matches ADD COLUMN xp_per_min INTEGER;
ALTER TABLE ranked_matches ADD COLUMN hero_damage INTEGER;
ALTER TABLE ranked_matches ADD COLUMN tower_damage INTEGER;
ALTER TABLE ranked_matches ADD COLUMN hero_healing INTEGER;
ALTER TABLE ranked_matches ADD COLUMN last_hits INTEGER;
ALTER TABLE ranked_matches ADD COLUMN denies INTEGER;
ALTER TABLE ranked_matches ADD COLUMN net_worth INTEGER;
ALTER TABLE ranked_matches ADD COLUMN award TEXT;
ALTER TABLE ranked_matches ADD COLUMN imp INTEGER;
ALTER TABLE ranked_matches ADD COLUMN raw_json TEXT;
