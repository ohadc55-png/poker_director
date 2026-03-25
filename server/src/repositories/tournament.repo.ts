import { Database } from '../db/connection.js';
import type { Tournament, BlindLevel, ChipDenomination, PrizeLevel } from '@poker/shared';

export class TournamentRepo {
  private stmts: ReturnType<typeof this.prepareStatements>;

  constructor(private db: Database) {
    this.stmts = this.prepareStatements();
  }

  private prepareStatements() {
    return {
      create: this.db.prepare(`
        INSERT INTO tournaments (name, date, location, game_type, buy_in_amount, buy_in_fee,
          starting_chips, rebuy_amount, rebuy_chips, max_rebuys, rebuy_deadline_level,
          rebuy_condition, addon_amount, addon_chips, addon_window_level, late_reg_level,
          guarantee, currency, notes)
        VALUES (@name, @date, @location, @game_type, @buy_in_amount, @buy_in_fee,
          @starting_chips, @rebuy_amount, @rebuy_chips, @max_rebuys, @rebuy_deadline_level,
          @rebuy_condition, @addon_amount, @addon_chips, @addon_window_level, @late_reg_level,
          @guarantee, @currency, @notes)
      `),
      getById: this.db.prepare('SELECT * FROM tournaments WHERE id = ?'),
      getAll: this.db.prepare('SELECT * FROM tournaments ORDER BY date DESC'),
      getByStatus: this.db.prepare('SELECT * FROM tournaments WHERE status = ? ORDER BY date DESC'),
      update: this.db.prepare(`
        UPDATE tournaments SET
          name = COALESCE(@name, name),
          date = COALESCE(@date, date),
          location = COALESCE(@location, location),
          game_type = COALESCE(@game_type, game_type),
          status = COALESCE(@status, status),
          buy_in_amount = COALESCE(@buy_in_amount, buy_in_amount),
          buy_in_fee = COALESCE(@buy_in_fee, buy_in_fee),
          starting_chips = COALESCE(@starting_chips, starting_chips),
          rebuy_amount = COALESCE(@rebuy_amount, rebuy_amount),
          rebuy_chips = COALESCE(@rebuy_chips, rebuy_chips),
          max_rebuys = COALESCE(@max_rebuys, max_rebuys),
          rebuy_deadline_level = COALESCE(@rebuy_deadline_level, rebuy_deadline_level),
          rebuy_condition = COALESCE(@rebuy_condition, rebuy_condition),
          addon_amount = COALESCE(@addon_amount, addon_amount),
          addon_chips = COALESCE(@addon_chips, addon_chips),
          addon_window_level = COALESCE(@addon_window_level, addon_window_level),
          late_reg_level = COALESCE(@late_reg_level, late_reg_level),
          guarantee = COALESCE(@guarantee, guarantee),
          currency = COALESCE(@currency, currency),
          notes = COALESCE(@notes, notes),
          updated_at = datetime('now')
        WHERE id = @id
      `),
      updateStatus: this.db.prepare(`
        UPDATE tournaments SET status = ?, updated_at = datetime('now') WHERE id = ?
      `),
      delete: this.db.prepare('DELETE FROM tournaments WHERE id = ?'),

      // Blind levels
      getBlinds: this.db.prepare(
        'SELECT * FROM blind_levels WHERE tournament_id = ? ORDER BY level_number'
      ),
      deleteBlinds: this.db.prepare('DELETE FROM blind_levels WHERE tournament_id = ?'),
      insertBlind: this.db.prepare(`
        INSERT INTO blind_levels (tournament_id, level_number, small_blind, big_blind,
          ante, big_blind_ante, duration_minutes, is_break, break_name)
        VALUES (@tournament_id, @level_number, @small_blind, @big_blind,
          @ante, @big_blind_ante, @duration_minutes, @is_break, @break_name)
      `),

      // Chips
      getChips: this.db.prepare(
        'SELECT * FROM chip_denominations WHERE tournament_id = ? ORDER BY value'
      ),
      deleteChips: this.db.prepare('DELETE FROM chip_denominations WHERE tournament_id = ?'),
      insertChip: this.db.prepare(`
        INSERT INTO chip_denominations (tournament_id, value, color, color_name, stripe_color, quantity, per_player)
        VALUES (@tournament_id, @value, @color, @color_name, @stripe_color, @quantity, @per_player)
      `),

      // Prizes
      getPrizes: this.db.prepare(
        'SELECT * FROM prize_levels WHERE tournament_id = ? ORDER BY place'
      ),
      deletePrizes: this.db.prepare('DELETE FROM prize_levels WHERE tournament_id = ?'),
      insertPrize: this.db.prepare(`
        INSERT INTO prize_levels (tournament_id, place, percentage, fixed_amount)
        VALUES (@tournament_id, @place, @percentage, @fixed_amount)
      `),
    };
  }

  create(data: Record<string, any>): Tournament {
    const info = this.stmts.create.run(data);
    // Get the created tournament by rowid
    const row = this.db.prepare('SELECT * FROM tournaments WHERE rowid = ?').get(info.lastInsertRowid);
    return row as Tournament;
  }

  getById(id: string): Tournament | undefined {
    return this.stmts.getById.get(id) as Tournament | undefined;
  }

  getAll(): Tournament[] {
    return this.stmts.getAll.all() as Tournament[];
  }

  getByStatus(status: string): Tournament[] {
    return this.stmts.getByStatus.all(status) as Tournament[];
  }

  update(id: string, data: Record<string, any>): Tournament | undefined {
    this.stmts.update.run({ ...data, id });
    return this.getById(id);
  }

  updateStatus(id: string, status: string): void {
    this.stmts.updateStatus.run(status, id);
  }

  delete(id: string): void {
    this.stmts.delete.run(id);
  }

  // Blind levels
  getBlinds(tournamentId: string): BlindLevel[] {
    return this.stmts.getBlinds.all(tournamentId).map((row: any) => ({
      ...row,
      is_break: !!row.is_break,
    })) as BlindLevel[];
  }

  setBlinds(tournamentId: string, levels: any[]): BlindLevel[] {
    const transaction = this.db.transaction(() => {
      this.stmts.deleteBlinds.run(tournamentId);
      for (const level of levels) {
        this.stmts.insertBlind.run({
          tournament_id: tournamentId,
          level_number: level.level_number,
          small_blind: level.small_blind,
          big_blind: level.big_blind,
          ante: level.ante || 0,
          big_blind_ante: level.big_blind_ante || 0,
          duration_minutes: level.duration_minutes,
          is_break: level.is_break ? 1 : 0,
          break_name: level.break_name || null,
        });
      }
    });
    transaction();
    return this.getBlinds(tournamentId);
  }

  // Chips
  getChips(tournamentId: string): ChipDenomination[] {
    return this.stmts.getChips.all(tournamentId) as ChipDenomination[];
  }

  setChips(tournamentId: string, chips: any[]): ChipDenomination[] {
    const transaction = this.db.transaction(() => {
      this.stmts.deleteChips.run(tournamentId);
      for (const chip of chips) {
        this.stmts.insertChip.run({
          tournament_id: tournamentId,
          value: chip.value,
          color: chip.color,
          color_name: chip.color_name || null,
          stripe_color: chip.stripe_color || null,
          quantity: chip.quantity,
          per_player: chip.per_player || null,
        });
      }
    });
    transaction();
    return this.getChips(tournamentId);
  }

  // Prizes
  getPrizes(tournamentId: string): PrizeLevel[] {
    return this.stmts.getPrizes.all(tournamentId) as PrizeLevel[];
  }

  setPrizes(tournamentId: string, prizes: any[]): PrizeLevel[] {
    const transaction = this.db.transaction(() => {
      this.stmts.deletePrizes.run(tournamentId);
      for (const prize of prizes) {
        this.stmts.insertPrize.run({
          tournament_id: tournamentId,
          place: prize.place,
          percentage: prize.percentage ?? null,
          fixed_amount: prize.fixed_amount ?? null,
        });
      }
    });
    transaction();
    return this.getPrizes(tournamentId);
  }
}
