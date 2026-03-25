import { Database } from '../db/connection.js';
import type { Player, TournamentPlayer, PlayerWithStats, TournamentHistoryEntry, RivalEntry } from '@poker/shared';

export class PlayerRepo {
  private stmts: ReturnType<typeof this.prepareStatements>;

  constructor(private db: Database) {
    this.stmts = this.prepareStatements();
  }

  private prepareStatements() {
    return {
      // Global players
      createPlayer: this.db.prepare(`
        INSERT INTO players (name, nickname, email, phone, notes, avatar_color)
        VALUES (@name, @nickname, @email, @phone, @notes, @avatar_color)
      `),
      getPlayer: this.db.prepare('SELECT * FROM players WHERE id = ?'),
      getAllPlayers: this.db.prepare('SELECT * FROM players ORDER BY name'),
      searchPlayers: this.db.prepare('SELECT * FROM players WHERE name LIKE ? ORDER BY name LIMIT 50'),
      updatePlayer: this.db.prepare(`
        UPDATE players SET name = COALESCE(@name, name), nickname = COALESCE(@nickname, nickname),
          email = COALESCE(@email, email), phone = COALESCE(@phone, phone), notes = COALESCE(@notes, notes)
        WHERE id = @id
      `),

      // Tournament players
      register: this.db.prepare(`
        INSERT INTO tournament_players (tournament_id, player_id, status)
        VALUES (@tournament_id, @player_id, 'registered')
      `),
      getTournamentPlayers: this.db.prepare(`
        SELECT tp.*, p.name as player_name, p.nickname as player_nickname
        FROM tournament_players tp
        JOIN players p ON tp.player_id = p.id
        WHERE tp.tournament_id = ?
        ORDER BY
          CASE tp.status
            WHEN 'active' THEN 1
            WHEN 'registered' THEN 2
            WHEN 'waiting' THEN 3
            WHEN 'busted' THEN 4
          END,
          tp.finish_place ASC,
          p.name ASC
      `),
      getTournamentPlayer: this.db.prepare(`
        SELECT tp.*, p.name as player_name, p.nickname as player_nickname
        FROM tournament_players tp
        JOIN players p ON tp.player_id = p.id
        WHERE tp.tournament_id = ? AND tp.player_id = ?
      `),
      updateStatus: this.db.prepare(`
        UPDATE tournament_players SET status = ?, busted_at = ? WHERE tournament_id = ? AND player_id = ?
      `),
      setFinishPlace: this.db.prepare(`
        UPDATE tournament_players SET finish_place = ? WHERE tournament_id = ? AND player_id = ?
      `),
      setKnockedOutBy: this.db.prepare(`
        UPDATE tournament_players SET knocked_out_by_player_id = ? WHERE tournament_id = ? AND player_id = ?
      `),
      incrementRebuys: this.db.prepare(`
        UPDATE tournament_players SET rebuys = rebuys + 1 WHERE tournament_id = ? AND player_id = ?
      `),
      incrementAddons: this.db.prepare(`
        UPDATE tournament_players SET addons = addons + 1 WHERE tournament_id = ? AND player_id = ?
      `),
      removeFromTournament: this.db.prepare(
        'DELETE FROM tournament_players WHERE tournament_id = ? AND player_id = ?'
      ),
      countActive: this.db.prepare(
        "SELECT COUNT(*) as count FROM tournament_players WHERE tournament_id = ? AND status IN ('active', 'registered')"
      ),
      countTotal: this.db.prepare(
        'SELECT COUNT(*) as count FROM tournament_players WHERE tournament_id = ?'
      ),
      setTableSeat: this.db.prepare(`
        UPDATE tournament_players SET table_id = ?, seat_number = ? WHERE tournament_id = ? AND player_id = ?
      `),
      activateAll: this.db.prepare(`
        UPDATE tournament_players SET status = 'active' WHERE tournament_id = ? AND status = 'registered'
      `),

      // Knockouts
      createKnockout: this.db.prepare(`
        INSERT INTO knockouts (tournament_id, eliminator_player_id, eliminated_player_id)
        VALUES (@tournament_id, @eliminator_player_id, @eliminated_player_id)
      `),

      // Stats
      getPlayerTournaments: this.db.prepare(`
        SELECT tp.*, t.name as tournament_name, t.date as tournament_date, t.buy_in_amount
        FROM tournament_players tp
        JOIN tournaments t ON tp.tournament_id = t.id
        WHERE tp.player_id = ?
        ORDER BY t.date DESC
      `),
    };
  }

  // Global players
  createPlayer(data: Record<string, any>): Player {
    const info = this.stmts.createPlayer.run(data);
    return this.db.prepare('SELECT * FROM players WHERE rowid = ?').get(info.lastInsertRowid) as Player;
  }

  getPlayer(id: string): Player | undefined {
    return this.stmts.getPlayer.get(id) as Player | undefined;
  }

  getAllPlayers(): Player[] {
    return this.stmts.getAllPlayers.all() as Player[];
  }

  searchPlayers(query: string): Player[] {
    return this.stmts.searchPlayers.all(`%${query}%`) as Player[];
  }

  updatePlayer(id: string, data: Record<string, any>): Player | undefined {
    this.stmts.updatePlayer.run({ ...data, id });
    return this.getPlayer(id);
  }

  // Players with stats (aggregated)
  getAllPlayersWithStats(): PlayerWithStats[] {
    return this.db.prepare(`
      SELECT
        p.*,
        COUNT(DISTINCT CASE WHEN t.status = 'finished' THEN tp.tournament_id END) as tournaments_played,
        SUM(CASE WHEN tp.finish_place = 1 AND t.status = 'finished' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN tp.finish_place <= 3 AND tp.finish_place IS NOT NULL AND t.status = 'finished' THEN 1 ELSE 0 END) as itm_count,
        MIN(CASE WHEN tp.finish_place IS NOT NULL AND t.status = 'finished' THEN tp.finish_place END) as best_finish,
        ROUND(AVG(CASE WHEN tp.finish_place IS NOT NULL AND t.status = 'finished' THEN tp.finish_place END), 1) as avg_finish,
        COALESCE(SUM(CASE WHEN t.status = 'finished' THEN tp.prize_won ELSE 0 END), 0) as total_prize_won,
        COALESCE((
          SELECT SUM(tx.amount) FROM transactions tx
          WHERE tx.player_id = p.id AND tx.type IN ('buyin','rebuy','addon')
        ), 0) as total_invested,
        COALESCE(SUM(CASE WHEN t.status = 'finished' THEN tp.prize_won ELSE 0 END), 0) -
          COALESCE((
            SELECT SUM(tx.amount) FROM transactions tx
            WHERE tx.player_id = p.id AND tx.type IN ('buyin','rebuy','addon')
          ), 0) as net_pnl,
        (SELECT COUNT(*) FROM knockouts k WHERE k.eliminator_player_id = p.id) as knockouts_dealt
      FROM players p
      LEFT JOIN tournament_players tp ON p.id = tp.player_id
      LEFT JOIN tournaments t ON tp.tournament_id = t.id
      GROUP BY p.id
      ORDER BY p.name
    `).all() as PlayerWithStats[];
  }

  getPlayerWithStats(id: string): PlayerWithStats | undefined {
    return this.db.prepare(`
      SELECT
        p.*,
        COUNT(DISTINCT CASE WHEN t.status = 'finished' THEN tp.tournament_id END) as tournaments_played,
        SUM(CASE WHEN tp.finish_place = 1 AND t.status = 'finished' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN tp.finish_place <= 3 AND tp.finish_place IS NOT NULL AND t.status = 'finished' THEN 1 ELSE 0 END) as itm_count,
        MIN(CASE WHEN tp.finish_place IS NOT NULL AND t.status = 'finished' THEN tp.finish_place END) as best_finish,
        ROUND(AVG(CASE WHEN tp.finish_place IS NOT NULL AND t.status = 'finished' THEN tp.finish_place END), 1) as avg_finish,
        COALESCE(SUM(CASE WHEN t.status = 'finished' THEN tp.prize_won ELSE 0 END), 0) as total_prize_won,
        COALESCE((
          SELECT SUM(tx.amount) FROM transactions tx
          WHERE tx.player_id = p.id AND tx.type IN ('buyin','rebuy','addon')
        ), 0) as total_invested,
        COALESCE(SUM(CASE WHEN t.status = 'finished' THEN tp.prize_won ELSE 0 END), 0) -
          COALESCE((
            SELECT SUM(tx.amount) FROM transactions tx
            WHERE tx.player_id = p.id AND tx.type IN ('buyin','rebuy','addon')
          ), 0) as net_pnl,
        (SELECT COUNT(*) FROM knockouts k WHERE k.eliminator_player_id = p.id) as knockouts_dealt
      FROM players p
      LEFT JOIN tournament_players tp ON p.id = tp.player_id
      LEFT JOIN tournaments t ON tp.tournament_id = t.id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(id) as PlayerWithStats | undefined;
  }

  getPlayerHistory(playerId: string): TournamentHistoryEntry[] {
    return this.db.prepare(`
      SELECT
        tp.tournament_id,
        t.name as tournament_name,
        t.date as tournament_date,
        tp.finish_place,
        tp.rebuys,
        tp.addons,
        tp.status,
        tp.prize_won,
        COALESCE((
          SELECT SUM(tx.amount) FROM transactions tx
          WHERE tx.tournament_id = tp.tournament_id AND tx.player_id = tp.player_id
            AND tx.type IN ('buyin','rebuy','addon')
        ), 0) as total_invested,
        tp.prize_won - COALESCE((
          SELECT SUM(tx.amount) FROM transactions tx
          WHERE tx.tournament_id = tp.tournament_id AND tx.player_id = tp.player_id
            AND tx.type IN ('buyin','rebuy','addon')
        ), 0) as net_result
      FROM tournament_players tp
      JOIN tournaments t ON tp.tournament_id = t.id
      WHERE tp.player_id = ?
      ORDER BY t.date DESC
    `).all(playerId) as TournamentHistoryEntry[];
  }

  getPlayerRivals(playerId: string): { knocked_out_by: RivalEntry[]; knocked_out: RivalEntry[] } {
    const knockedOutBy = this.db.prepare(`
      SELECT
        k.eliminator_player_id as player_id,
        p.name as player_name,
        p.avatar_color,
        COUNT(*) as count
      FROM knockouts k
      JOIN players p ON p.id = k.eliminator_player_id
      WHERE k.eliminated_player_id = ?
      GROUP BY k.eliminator_player_id
      ORDER BY count DESC
      LIMIT 5
    `).all(playerId) as RivalEntry[];

    const knockedOut = this.db.prepare(`
      SELECT
        k.eliminated_player_id as player_id,
        p.name as player_name,
        p.avatar_color,
        COUNT(*) as count
      FROM knockouts k
      JOIN players p ON p.id = k.eliminated_player_id
      WHERE k.eliminator_player_id = ?
      GROUP BY k.eliminated_player_id
      ORDER BY count DESC
      LIMIT 5
    `).all(playerId) as RivalEntry[];

    return { knocked_out_by: knockedOutBy, knocked_out: knockedOut };
  }

  // Tournament players
  register(tournamentId: string, playerId: string): TournamentPlayer {
    this.stmts.register.run({ tournament_id: tournamentId, player_id: playerId });
    return this.getTournamentPlayer(tournamentId, playerId)!;
  }

  getTournamentPlayers(tournamentId: string): TournamentPlayer[] {
    return this.stmts.getTournamentPlayers.all(tournamentId) as TournamentPlayer[];
  }

  getTournamentPlayer(tournamentId: string, playerId: string): TournamentPlayer | undefined {
    return this.stmts.getTournamentPlayer.get(tournamentId, playerId) as TournamentPlayer | undefined;
  }

  bustOut(tournamentId: string, playerId: string, knockedOutByPlayerId?: string): void {
    const now = new Date().toISOString();
    this.stmts.updateStatus.run('busted', now, tournamentId, playerId);

    // Calculate finish place based on remaining active players
    const active = this.stmts.countActive.get(tournamentId) as { count: number };
    this.stmts.setFinishPlace.run(active.count + 1, tournamentId, playerId);

    // Record knockout if provided
    if (knockedOutByPlayerId) {
      this.stmts.setKnockedOutBy.run(knockedOutByPlayerId, tournamentId, playerId);
      this.stmts.createKnockout.run({
        tournament_id: tournamentId,
        eliminator_player_id: knockedOutByPlayerId,
        eliminated_player_id: playerId,
      });
    }
  }

  rebuy(tournamentId: string, playerId: string): void {
    this.stmts.incrementRebuys.run(tournamentId, playerId);
    // If player was busted, reactivate them
    this.stmts.updateStatus.run('active', null, tournamentId, playerId);
    this.stmts.setFinishPlace.run(null, tournamentId, playerId);
  }

  addon(tournamentId: string, playerId: string): void {
    this.stmts.incrementAddons.run(tournamentId, playerId);
  }

  removeFromTournament(tournamentId: string, playerId: string): void {
    this.stmts.removeFromTournament.run(tournamentId, playerId);
  }

  countActive(tournamentId: string): number {
    return (this.stmts.countActive.get(tournamentId) as { count: number }).count;
  }

  countTotal(tournamentId: string): number {
    return (this.stmts.countTotal.get(tournamentId) as { count: number }).count;
  }

  setTableSeat(tournamentId: string, playerId: string, tableId: string | null, seat: number | null): void {
    this.stmts.setTableSeat.run(tableId, seat, tournamentId, playerId);
  }

  activateAll(tournamentId: string): void {
    this.stmts.activateAll.run(tournamentId);
  }

  getPlayerTournaments(playerId: string): any[] {
    return this.stmts.getPlayerTournaments.all(playerId);
  }
}
