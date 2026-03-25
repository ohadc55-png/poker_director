import { Database } from '../db/connection.js';
import type { TimerState } from '@poker/shared';

export class TimerRepo {
  private stmts: ReturnType<typeof this.prepareStatements>;

  constructor(private db: Database) {
    this.stmts = this.prepareStatements();
  }

  private prepareStatements() {
    return {
      get: this.db.prepare('SELECT * FROM timer_state WHERE tournament_id = ?'),
      upsert: this.db.prepare(`
        INSERT INTO timer_state (tournament_id, current_level, time_remaining_ms, is_running, started_at, paused_at, total_elapsed_ms, updated_at)
        VALUES (@tournament_id, @current_level, @time_remaining_ms, @is_running, @started_at, @paused_at, @total_elapsed_ms, datetime('now'))
        ON CONFLICT(tournament_id) DO UPDATE SET
          current_level = @current_level,
          time_remaining_ms = @time_remaining_ms,
          is_running = @is_running,
          started_at = @started_at,
          paused_at = @paused_at,
          total_elapsed_ms = @total_elapsed_ms,
          updated_at = datetime('now')
      `),
      getRunning: this.db.prepare('SELECT * FROM timer_state WHERE is_running = 1'),
      delete: this.db.prepare('DELETE FROM timer_state WHERE tournament_id = ?'),
    };
  }

  get(tournamentId: string): TimerState | undefined {
    return this.stmts.get.get(tournamentId) as TimerState | undefined;
  }

  save(state: {
    tournament_id: string;
    current_level: number;
    time_remaining_ms: number;
    is_running: boolean;
    started_at: string | null;
    paused_at: string | null;
    total_elapsed_ms: number;
  }): void {
    this.stmts.upsert.run({
      ...state,
      is_running: state.is_running ? 1 : 0,
    });
  }

  getRunning(): TimerState[] {
    return this.stmts.getRunning.all() as TimerState[];
  }

  delete(tournamentId: string): void {
    this.stmts.delete.run(tournamentId);
  }
}
