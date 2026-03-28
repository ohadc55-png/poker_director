import { Database } from '../db/connection.js';
import type { Transaction } from '@poker/shared';

export class FinancialRepo {
  private stmts: ReturnType<typeof this.prepareStatements>;

  constructor(private db: Database) {
    this.stmts = this.prepareStatements();
  }

  private prepareStatements() {
    return {
      addTransaction: this.db.prepare(`
        INSERT INTO transactions (tournament_id, player_id, type, amount)
        VALUES (@tournament_id, @player_id, @type, @amount)
      `),
      getTransactions: this.db.prepare(
        'SELECT * FROM transactions WHERE tournament_id = ? ORDER BY created_at'
      ),
      getByType: this.db.prepare(
        'SELECT * FROM transactions WHERE tournament_id = ? AND type = ? ORDER BY created_at'
      ),
      sumByType: this.db.prepare(
        'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE tournament_id = ? AND type = ?'
      ),
      getTournamentSummary: this.db.prepare(`
        SELECT type, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
        FROM transactions WHERE tournament_id = ?
        GROUP BY type
      `),
      removeByPlayerAndType: this.db.prepare(
        'DELETE FROM transactions WHERE tournament_id = ? AND player_id = ? AND type = ?'
      ),
    };
  }

  removeTransactions(tournamentId: string, playerId: string, type: string): void {
    this.stmts.removeByPlayerAndType.run(tournamentId, playerId, type);
  }

  addTransaction(data: { tournament_id: string; player_id?: string; type: string; amount: number }): void {
    this.stmts.addTransaction.run({
      ...data,
      player_id: data.player_id || null,
    });
  }

  getTransactions(tournamentId: string): Transaction[] {
    return this.stmts.getTransactions.all(tournamentId) as Transaction[];
  }

  getByType(tournamentId: string, type: string): Transaction[] {
    return this.stmts.getByType.all(tournamentId, type) as Transaction[];
  }

  sumByType(tournamentId: string, type: string): number {
    return (this.stmts.sumByType.get(tournamentId, type) as { total: number }).total;
  }

  getTournamentSummary(tournamentId: string): { type: string; count: number; total: number }[] {
    return this.stmts.getTournamentSummary.all(tournamentId) as any[];
  }
}
