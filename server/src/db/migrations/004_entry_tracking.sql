-- Track whether a player has paid entry (buy-in) separately from registration
ALTER TABLE tournament_players ADD COLUMN has_entry INTEGER NOT NULL DEFAULT 0;
