import { Database } from '../db/connection.js';

export class StatisticsService {
  constructor(private db: Database) {}

  getLeaderboard(limit = 50, year?: string, sort?: string) {
    const yearFilter = year ? `AND strftime('%Y', t.date) = ?` : '';
    const orderBy = this.getLeaderboardOrderBy(sort);

    const query = `
      SELECT
        p.id as player_id,
        p.name as player_name,
        p.avatar_color,
        COUNT(DISTINCT tp.tournament_id) as tournaments_played,
        SUM(CASE WHEN tp.finish_place = 1 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN tp.finish_place <= 3 AND tp.finish_place IS NOT NULL THEN 1 ELSE 0 END) as itm_count,
        MIN(CASE WHEN tp.finish_place IS NOT NULL THEN tp.finish_place END) as best_finish,
        ROUND(AVG(CASE WHEN tp.finish_place IS NOT NULL THEN tp.finish_place END), 1) as avg_finish,
        SUM(tp.rebuys) as total_rebuys,
        COALESCE(SUM(tp.prize_won), 0) as total_prize_won,
        COALESCE((
          SELECT SUM(tx.amount) FROM transactions tx
          JOIN tournament_players tp2 ON tx.player_id = tp2.player_id AND tx.tournament_id = tp2.tournament_id
          JOIN tournaments t2 ON t2.id = tx.tournament_id AND t2.status = 'finished'
          WHERE tx.player_id = p.id AND tx.type IN ('buyin','rebuy','addon')
          ${year ? `AND strftime('%Y', t2.date) = '${year}'` : ''}
        ), 0) as total_invested,
        COALESCE(SUM(tp.prize_won), 0) -
          COALESCE((
            SELECT SUM(tx.amount) FROM transactions tx
            JOIN tournament_players tp2 ON tx.player_id = tp2.player_id AND tx.tournament_id = tp2.tournament_id
            JOIN tournaments t2 ON t2.id = tx.tournament_id AND t2.status = 'finished'
            WHERE tx.player_id = p.id AND tx.type IN ('buyin','rebuy','addon')
            ${year ? `AND strftime('%Y', t2.date) = '${year}'` : ''}
          ), 0) as net_pnl,
        (SELECT COUNT(*) FROM knockouts k
         JOIN tournaments kt ON kt.id = k.tournament_id AND kt.status = 'finished'
         WHERE k.eliminator_player_id = p.id
         ${year ? `AND strftime('%Y', kt.date) = '${year}'` : ''}
        ) as knockouts_dealt
      FROM players p
      JOIN tournament_players tp ON p.id = tp.player_id
      JOIN tournaments t ON tp.tournament_id = t.id AND t.status = 'finished'
      ${yearFilter}
      GROUP BY p.id
      ${orderBy}
      LIMIT ?
    `;

    const params: any[] = [];
    if (year) params.push(year);
    params.push(limit);

    return this.db.prepare(query).all(...params);
  }

  private getLeaderboardOrderBy(sort?: string): string {
    switch (sort) {
      case 'profit':
        return 'ORDER BY net_pnl DESC, wins DESC';
      case 'played':
        return 'ORDER BY tournaments_played DESC, wins DESC';
      case 'knockouts':
        return 'ORDER BY knockouts_dealt DESC, wins DESC';
      case 'wins':
      default:
        return 'ORDER BY wins DESC, itm_count DESC, tournaments_played DESC';
    }
  }

  getTournamentResults(tournamentId: string) {
    return this.db.prepare(`
      SELECT
        tp.*,
        p.name as player_name,
        p.nickname as player_nickname
      FROM tournament_players tp
      JOIN players p ON tp.player_id = p.id
      WHERE tp.tournament_id = ?
      ORDER BY
        CASE WHEN tp.finish_place IS NULL THEN 999999 ELSE tp.finish_place END ASC
    `).all(tournamentId);
  }

  getCompletedTournaments() {
    return this.db.prepare(`
      SELECT
        t.*,
        COUNT(tp.id) as total_players,
        SUM(tp.rebuys) as total_rebuys,
        SUM(tp.addons) as total_addons
      FROM tournaments t
      LEFT JOIN tournament_players tp ON t.id = tp.tournament_id
      WHERE t.status = 'finished'
      GROUP BY t.id
      ORDER BY t.date DESC
    `).all();
  }
}
