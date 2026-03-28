-- Player groups
CREATE TABLE IF NOT EXISTS groups (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#6366f1',
  description TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Group membership (many-to-many)
CREATE TABLE IF NOT EXISTS group_members (
  id        TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  group_id  TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE(group_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_player ON group_members(player_id);
