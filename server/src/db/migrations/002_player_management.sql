-- Player Management Module
-- Extend players table with avatar color
ALTER TABLE players ADD COLUMN avatar_color TEXT;

-- Extend tournament_players with prize and knockout tracking
ALTER TABLE tournament_players ADD COLUMN prize_won REAL NOT NULL DEFAULT 0;
ALTER TABLE tournament_players ADD COLUMN knocked_out_by_player_id TEXT;

-- Knockouts tracking table
CREATE TABLE IF NOT EXISTS knockouts (
  id                    TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  tournament_id         TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  eliminator_player_id  TEXT NOT NULL REFERENCES players(id),
  eliminated_player_id  TEXT NOT NULL REFERENCES players(id),
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_knockouts_tournament ON knockouts(tournament_id);
CREATE INDEX IF NOT EXISTS idx_knockouts_eliminator ON knockouts(eliminator_player_id);
CREATE INDEX IF NOT EXISTS idx_knockouts_eliminated ON knockouts(eliminated_player_id);
