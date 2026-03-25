-- Tournaments
CREATE TABLE IF NOT EXISTS tournaments (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  name                TEXT NOT NULL,
  date                TEXT NOT NULL,
  location            TEXT,
  game_type           TEXT NOT NULL DEFAULT 'Texas Hold''em',
  status              TEXT NOT NULL DEFAULT 'setup' CHECK(status IN ('setup','running','paused','finished')),
  buy_in_amount       REAL NOT NULL,
  buy_in_fee          REAL NOT NULL DEFAULT 0,
  starting_chips      INTEGER NOT NULL,
  rebuy_amount        REAL,
  rebuy_chips         INTEGER,
  max_rebuys          INTEGER,
  rebuy_deadline_level INTEGER,
  rebuy_condition     TEXT DEFAULT 'anytime' CHECK(rebuy_condition IN ('anytime','below_starting','zero')),
  addon_amount        REAL,
  addon_chips         INTEGER,
  addon_window_level  INTEGER,
  late_reg_level      INTEGER,
  guarantee           REAL,
  currency            TEXT NOT NULL DEFAULT '₪',
  notes               TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Blind levels
CREATE TABLE IF NOT EXISTS blind_levels (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  tournament_id       TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  level_number        INTEGER NOT NULL,
  small_blind         INTEGER NOT NULL,
  big_blind           INTEGER NOT NULL,
  ante                INTEGER NOT NULL DEFAULT 0,
  big_blind_ante      INTEGER NOT NULL DEFAULT 0,
  duration_minutes    INTEGER NOT NULL,
  is_break            INTEGER NOT NULL DEFAULT 0,
  break_name          TEXT,
  UNIQUE(tournament_id, level_number)
);

-- Global player database
CREATE TABLE IF NOT EXISTS players (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  name                TEXT NOT NULL,
  nickname            TEXT,
  email               TEXT,
  phone               TEXT,
  notes               TEXT,
  avatar_url          TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tables
CREATE TABLE IF NOT EXISTS tables (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  tournament_id       TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  table_number        INTEGER NOT NULL,
  table_name          TEXT,
  max_seats           INTEGER NOT NULL DEFAULT 9,
  is_active           INTEGER NOT NULL DEFAULT 1,
  UNIQUE(tournament_id, table_number)
);

-- Tournament players
CREATE TABLE IF NOT EXISTS tournament_players (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  tournament_id       TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id           TEXT NOT NULL REFERENCES players(id),
  table_id            TEXT REFERENCES tables(id) ON DELETE SET NULL,
  seat_number         INTEGER,
  status              TEXT NOT NULL DEFAULT 'registered' CHECK(status IN ('registered','active','busted','waiting')),
  finish_place        INTEGER,
  rebuys              INTEGER NOT NULL DEFAULT 0,
  addons              INTEGER NOT NULL DEFAULT 0,
  registered_at       TEXT NOT NULL DEFAULT (datetime('now')),
  busted_at           TEXT,
  UNIQUE(tournament_id, player_id)
);

-- Prize levels
CREATE TABLE IF NOT EXISTS prize_levels (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  tournament_id       TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  place               INTEGER NOT NULL,
  percentage          REAL,
  fixed_amount        REAL,
  UNIQUE(tournament_id, place)
);

-- Chip denominations
CREATE TABLE IF NOT EXISTS chip_denominations (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  tournament_id       TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  value               INTEGER NOT NULL,
  color               TEXT NOT NULL,
  color_name          TEXT,
  stripe_color        TEXT,
  quantity            INTEGER NOT NULL,
  per_player          INTEGER,
  UNIQUE(tournament_id, value)
);

-- Transactions log
CREATE TABLE IF NOT EXISTS transactions (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  tournament_id       TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id           TEXT REFERENCES players(id),
  type                TEXT NOT NULL CHECK(type IN ('buyin','rebuy','addon','payout','fee')),
  amount              REAL NOT NULL,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Blind templates
CREATE TABLE IF NOT EXISTS blind_templates (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  name                TEXT NOT NULL,
  description         TEXT,
  style               TEXT CHECK(style IN ('turbo','regular','deep_stack','custom')),
  levels_json         TEXT NOT NULL,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tournament templates
CREATE TABLE IF NOT EXISTS tournament_templates (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  name                TEXT NOT NULL,
  description         TEXT,
  config_json         TEXT NOT NULL,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Timer state (auto-save and recovery)
CREATE TABLE IF NOT EXISTS timer_state (
  tournament_id       TEXT PRIMARY KEY REFERENCES tournaments(id) ON DELETE CASCADE,
  current_level       INTEGER NOT NULL DEFAULT 1,
  time_remaining_ms   INTEGER NOT NULL,
  is_running          INTEGER NOT NULL DEFAULT 0,
  started_at          TEXT,
  paused_at           TEXT,
  total_elapsed_ms    INTEGER NOT NULL DEFAULT 0,
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blind_levels_tournament ON blind_levels(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_player ON tournament_players(player_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_status ON tournament_players(tournament_id, status);
CREATE INDEX IF NOT EXISTS idx_tables_tournament ON tables(tournament_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tournament ON transactions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_transactions_player ON transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
