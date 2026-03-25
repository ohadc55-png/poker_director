import { Database } from '../db/connection.js';
import type { Server as SocketServer } from 'socket.io';
import { TableRepo } from '../repositories/table.repo.js';
import { PlayerRepo } from '../repositories/player.repo.js';
import type { SeatAssignment } from '@poker/shared';

export class TableService {
  private tableRepo: TableRepo;
  private playerRepo: PlayerRepo;

  constructor(private db: Database, private io?: SocketServer) {
    this.tableRepo = new TableRepo(db);
    this.playerRepo = new PlayerRepo(db);
  }

  createTables(tournamentId: string, count: number, maxSeats: number) {
    return this.tableRepo.createMultiple(tournamentId, count, maxSeats);
  }

  getTables(tournamentId: string) {
    const tables = this.tableRepo.getAll(tournamentId);
    return tables.map((table) => ({
      ...table,
      players: this.tableRepo.getPlayersAtTable(table.id),
      player_count: this.tableRepo.countPlayersAtTable(table.id),
    }));
  }

  // Fisher-Yates shuffle for random seating
  randomSeat(tournamentId: string): SeatAssignment[] {
    const tables = this.tableRepo.getAll(tournamentId);
    const players = this.playerRepo.getTournamentPlayers(tournamentId)
      .filter((p) => p.status === 'active' || p.status === 'registered');

    if (tables.length === 0 || players.length === 0) return [];

    // Shuffle players
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const assignments: SeatAssignment[] = [];
    let playerIdx = 0;

    // Distribute evenly across tables
    const playersPerTable = Math.ceil(shuffled.length / tables.length);

    for (const table of tables) {
      let seat = 1;
      while (seat <= table.max_seats && playerIdx < shuffled.length) {
        const player = shuffled[playerIdx];
        this.playerRepo.setTableSeat(tournamentId, player.player_id, table.id, seat);
        assignments.push({
          table_id: table.id,
          table_number: table.table_number,
          seat_number: seat,
          player_id: player.player_id,
          player_name: player.player_name || '',
        });
        seat++;
        playerIdx++;

        // Move to next table after filling evenly
        if (seat - 1 >= playersPerTable && playerIdx < shuffled.length) break;
      }
    }

    this.emitTablesUpdate(tournamentId);
    return assignments;
  }

  // Balance tables after players bust out
  balanceTables(tournamentId: string): { from: string; to: string; player_name: string }[] {
    const tables = this.getTables(tournamentId).filter((t) => t.is_active);
    if (tables.length <= 1) return [];

    const moves: { from: string; to: string; player_name: string }[] = [];

    // Find target count per table
    const totalPlayers = tables.reduce((sum, t) => sum + t.player_count, 0);
    const targetPerTable = Math.ceil(totalPlayers / tables.length);

    // Sort by player count
    tables.sort((a, b) => b.player_count - a.player_count);

    for (const bigTable of tables) {
      while (bigTable.player_count > targetPerTable) {
        // Find smallest table
        const smallTable = tables
          .filter((t) => t.id !== bigTable.id && t.player_count < targetPerTable)
          .sort((a, b) => a.player_count - b.player_count)[0];

        if (!smallTable) break;

        // Move last seated player from big to small
        const players = this.tableRepo.getPlayersAtTable(bigTable.id);
        const playerToMove = players[players.length - 1];
        if (!playerToMove) break;

        const nextSeat = smallTable.player_count + 1;
        this.playerRepo.setTableSeat(tournamentId, playerToMove.player_id, smallTable.id, nextSeat);

        moves.push({
          from: `Table ${bigTable.table_number}`,
          to: `Table ${smallTable.table_number}`,
          player_name: playerToMove.player_name,
        });

        bigTable.player_count--;
        smallTable.player_count++;
      }
    }

    if (moves.length > 0) {
      this.emitTablesUpdate(tournamentId);
    }

    return moves;
  }

  // Break (close) a table and redistribute players
  breakTable(tournamentId: string, tableId: string): void {
    const players = this.tableRepo.getPlayersAtTable(tableId);
    this.tableRepo.deactivate(tableId);

    // Unseat all players from this table
    for (const player of players) {
      this.playerRepo.setTableSeat(tournamentId, player.player_id, null, null);
    }

    // Re-balance
    this.balanceTables(tournamentId);
    this.emitTablesUpdate(tournamentId);
  }

  private emitTablesUpdate(tournamentId: string) {
    if (!this.io) return;
    const tables = this.tableRepo.getAll(tournamentId);
    this.io.to(`tournament:${tournamentId}`).emit('tables:updated', {
      tournament_id: tournamentId,
      tables,
    });
  }
}
