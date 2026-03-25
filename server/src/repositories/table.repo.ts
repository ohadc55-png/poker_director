import { Database } from '../db/connection.js';
import type { Table as TournamentTable } from '@poker/shared';

export class TableRepo {
  private stmts: ReturnType<typeof this.prepareStatements>;

  constructor(private db: Database) {
    this.stmts = this.prepareStatements();
  }

  private prepareStatements() {
    return {
      create: this.db.prepare(`
        INSERT INTO tables (tournament_id, table_number, table_name, max_seats)
        VALUES (@tournament_id, @table_number, @table_name, @max_seats)
      `),
      getAll: this.db.prepare(
        'SELECT * FROM tables WHERE tournament_id = ? AND is_active = 1 ORDER BY table_number'
      ),
      getAllIncludingInactive: this.db.prepare(
        'SELECT * FROM tables WHERE tournament_id = ? ORDER BY table_number'
      ),
      getById: this.db.prepare('SELECT * FROM tables WHERE id = ?'),
      deactivate: this.db.prepare(
        'UPDATE tables SET is_active = 0 WHERE id = ?'
      ),
      delete: this.db.prepare('DELETE FROM tables WHERE tournament_id = ?'),
      getPlayersAtTable: this.db.prepare(`
        SELECT tp.*, p.name as player_name, p.nickname as player_nickname
        FROM tournament_players tp
        JOIN players p ON tp.player_id = p.id
        WHERE tp.table_id = ? AND tp.status IN ('active', 'registered')
        ORDER BY tp.seat_number
      `),
      countPlayersAtTable: this.db.prepare(`
        SELECT COUNT(*) as count FROM tournament_players
        WHERE table_id = ? AND status IN ('active', 'registered')
      `),
    };
  }

  create(data: { tournament_id: string; table_number: number; table_name?: string; max_seats: number }): TournamentTable {
    const info = this.stmts.create.run({
      ...data,
      table_name: data.table_name || `Table ${data.table_number}`,
    });
    return this.db.prepare('SELECT * FROM tables WHERE rowid = ?').get(info.lastInsertRowid) as TournamentTable;
  }

  createMultiple(tournamentId: string, count: number, maxSeats: number): TournamentTable[] {
    const tables: TournamentTable[] = [];
    const transaction = this.db.transaction(() => {
      for (let i = 1; i <= count; i++) {
        tables.push(this.create({
          tournament_id: tournamentId,
          table_number: i,
          table_name: `Table ${i}`,
          max_seats: maxSeats,
        }));
      }
    });
    transaction();
    return tables;
  }

  getAll(tournamentId: string): TournamentTable[] {
    return this.stmts.getAll.all(tournamentId).map((row: any) => ({
      ...row,
      is_active: !!row.is_active,
    })) as TournamentTable[];
  }

  getById(id: string): TournamentTable | undefined {
    const row = this.stmts.getById.get(id) as any;
    return row ? { ...row, is_active: !!row.is_active } : undefined;
  }

  deactivate(id: string): void {
    this.stmts.deactivate.run(id);
  }

  deleteAll(tournamentId: string): void {
    this.stmts.delete.run(tournamentId);
  }

  getPlayersAtTable(tableId: string): any[] {
    return this.stmts.getPlayersAtTable.all(tableId);
  }

  countPlayersAtTable(tableId: string): number {
    return (this.stmts.countPlayersAtTable.get(tableId) as { count: number }).count;
  }
}
