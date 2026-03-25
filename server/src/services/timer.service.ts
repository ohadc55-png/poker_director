import { Database } from '../db/connection.js';
import type { Server as SocketServer } from 'socket.io';
import type { BlindLevel, TimerTickPayload, TimerLevelChangedPayload } from '@poker/shared';
import { TIMER_TICK_INTERVAL_MS } from '@poker/shared';
import { TimerRepo } from '../repositories/timer.repo.js';
import { TournamentRepo } from '../repositories/tournament.repo.js';

interface RunningTimer {
  tournamentId: string;
  interval: ReturnType<typeof setInterval>;
  startedAt: number; // unix ms when this run started
  remainingAtStart: number; // ms remaining when started/resumed
  totalElapsedAtStart: number; // total elapsed when started/resumed
}

export class TimerService {
  private static instance: TimerService;
  private timers = new Map<string, RunningTimer>();
  private timerRepo!: TimerRepo;
  private tournamentRepo!: TournamentRepo;
  private io!: SocketServer;

  private constructor() {}

  static getInstance(): TimerService {
    if (!TimerService.instance) {
      TimerService.instance = new TimerService();
    }
    return TimerService.instance;
  }

  init(db: Database, io: SocketServer): void {
    this.timerRepo = new TimerRepo(db);
    this.tournamentRepo = new TournamentRepo(db);
    this.io = io;

    // Recover running timers from DB
    const running = this.timerRepo.getRunning();
    for (const state of running) {
      if (state.started_at) {
        const startedAt = new Date(state.started_at).getTime();
        const elapsed = Date.now() - startedAt;
        const remaining = state.time_remaining_ms - elapsed;

        if (remaining > 0) {
          this.startInterval(state.tournament_id, remaining, state.current_level, state.total_elapsed_ms + elapsed);
        } else {
          // Timer expired while server was down — advance level
          this.advanceLevel(state.tournament_id, state.current_level, state.total_elapsed_ms + state.time_remaining_ms);
        }
      }
    }
  }

  getState(tournamentId: string) {
    const dbState = this.timerRepo.get(tournamentId);
    if (!dbState) return null;

    const running = this.timers.get(tournamentId);
    if (running) {
      const elapsed = Date.now() - running.startedAt;
      return {
        ...dbState,
        time_remaining_ms: Math.max(0, running.remainingAtStart - elapsed),
        total_elapsed_ms: running.totalElapsedAtStart + elapsed,
        is_running: true,
      };
    }

    return dbState;
  }

  start(tournamentId: string): any {
    const blinds = this.tournamentRepo.getBlinds(tournamentId);
    if (blinds.length === 0) {
      throw new Error('No blind structure defined');
    }

    let state = this.timerRepo.get(tournamentId);
    if (!state) {
      // Initialize timer state
      const firstLevel = blinds[0];
      const remainingMs = firstLevel.duration_minutes * 60 * 1000;
      this.timerRepo.save({
        tournament_id: tournamentId,
        current_level: 1,
        time_remaining_ms: remainingMs,
        is_running: true,
        started_at: new Date().toISOString(),
        paused_at: null,
        total_elapsed_ms: 0,
      });
      state = this.timerRepo.get(tournamentId)!;
      this.startInterval(tournamentId, remainingMs, 1, 0);
    } else {
      // Resume from current state
      const remaining = state.time_remaining_ms;
      this.timerRepo.save({
        ...state,
        is_running: true,
        started_at: new Date().toISOString(),
        paused_at: null,
      });
      this.startInterval(tournamentId, remaining, state.current_level, state.total_elapsed_ms);
    }

    // Update tournament status
    this.tournamentRepo.updateStatus(tournamentId, 'running');
    this.io.to(`tournament:${tournamentId}`).emit('timer:stateChanged', {
      tournament_id: tournamentId,
      is_running: true,
    });

    return this.getState(tournamentId);
  }

  pause(tournamentId: string): any {
    const running = this.timers.get(tournamentId);
    if (!running) return this.getState(tournamentId);

    const elapsed = Date.now() - running.startedAt;
    const remaining = Math.max(0, running.remainingAtStart - elapsed);
    const totalElapsed = running.totalElapsedAtStart + elapsed;

    this.stopInterval(tournamentId);

    this.timerRepo.save({
      tournament_id: tournamentId,
      current_level: this.getState(tournamentId)?.current_level ?? 1,
      time_remaining_ms: remaining,
      is_running: false,
      started_at: null,
      paused_at: new Date().toISOString(),
      total_elapsed_ms: totalElapsed,
    });

    this.tournamentRepo.updateStatus(tournamentId, 'paused');
    this.io.to(`tournament:${tournamentId}`).emit('timer:stateChanged', {
      tournament_id: tournamentId,
      is_running: false,
    });

    return this.getState(tournamentId);
  }

  resume(tournamentId: string): any {
    return this.start(tournamentId);
  }

  stop(tournamentId: string): any {
    this.stopInterval(tournamentId);
    this.timerRepo.delete(tournamentId);
    this.tournamentRepo.updateStatus(tournamentId, 'finished');
    this.io.to(`tournament:${tournamentId}`).emit('timer:finished', {
      tournament_id: tournamentId,
    });
    return null;
  }

  nextLevel(tournamentId: string): any {
    const state = this.getState(tournamentId);
    if (!state) return null;

    const wasRunning = this.timers.has(tournamentId);
    if (wasRunning) this.stopInterval(tournamentId);

    return this.setLevel(tournamentId, state.current_level + 1, state.total_elapsed_ms, wasRunning);
  }

  prevLevel(tournamentId: string): any {
    const state = this.getState(tournamentId);
    if (!state || state.current_level <= 1) return this.getState(tournamentId);

    const wasRunning = this.timers.has(tournamentId);
    if (wasRunning) this.stopInterval(tournamentId);

    return this.setLevel(tournamentId, state.current_level - 1, state.total_elapsed_ms, wasRunning);
  }

  setLevel(tournamentId: string, level: number, totalElapsed?: number, autoResume = false): any {
    const blinds = this.tournamentRepo.getBlinds(tournamentId);
    if (level < 1 || level > blinds.length) return this.getState(tournamentId);

    const targetLevel = blinds[level - 1];
    const remaining = targetLevel.duration_minutes * 60 * 1000;
    const state = this.getState(tournamentId);
    const elapsed = totalElapsed ?? state?.total_elapsed_ms ?? 0;

    this.timerRepo.save({
      tournament_id: tournamentId,
      current_level: level,
      time_remaining_ms: remaining,
      is_running: autoResume,
      started_at: autoResume ? new Date().toISOString() : null,
      paused_at: autoResume ? null : new Date().toISOString(),
      total_elapsed_ms: elapsed,
    });

    this.emitLevelChanged(tournamentId, level, remaining, targetLevel);

    // If timer was running before level change, keep it running
    if (autoResume) {
      this.startInterval(tournamentId, remaining, level, elapsed);
      this.io.to(`tournament:${tournamentId}`).emit('timer:stateChanged', {
        tournament_id: tournamentId,
        is_running: true,
      });
    }

    return this.getState(tournamentId);
  }

  addTime(tournamentId: string, seconds: number): any {
    const state = this.getState(tournamentId);
    if (!state) return null;

    const running = this.timers.get(tournamentId);
    if (running) {
      // Add time to running timer
      running.remainingAtStart += seconds * 1000;
    }

    // Also update DB
    const currentRemaining = state.time_remaining_ms + seconds * 1000;
    this.timerRepo.save({
      ...state,
      time_remaining_ms: currentRemaining,
      is_running: !!running,
    });

    return this.getState(tournamentId);
  }

  private startInterval(tournamentId: string, remainingMs: number, level: number, totalElapsed: number): void {
    this.stopInterval(tournamentId);

    const startedAt = Date.now();
    const interval = setInterval(() => this.tick(tournamentId), TIMER_TICK_INTERVAL_MS);

    this.timers.set(tournamentId, {
      tournamentId,
      interval,
      startedAt,
      remainingAtStart: remainingMs,
      totalElapsedAtStart: totalElapsed,
    });
  }

  private stopInterval(tournamentId: string): void {
    const timer = this.timers.get(tournamentId);
    if (timer) {
      clearInterval(timer.interval);
      this.timers.delete(tournamentId);
    }
  }

  private tick(tournamentId: string): void {
    const running = this.timers.get(tournamentId);
    if (!running) return;

    const elapsed = Date.now() - running.startedAt;
    const remaining = running.remainingAtStart - elapsed;
    const totalElapsed = running.totalElapsedAtStart + elapsed;

    if (remaining <= 0) {
      // Level finished — advance
      const state = this.timerRepo.get(tournamentId);
      if (state) {
        this.advanceLevel(tournamentId, state.current_level, totalElapsed);
      }
      return;
    }

    // Emit tick to all clients in tournament room
    const payload: TimerTickPayload = {
      tournament_id: tournamentId,
      remaining_ms: Math.max(0, remaining),
      current_level: this.timerRepo.get(tournamentId)?.current_level ?? 1,
      is_running: true,
      total_elapsed_ms: totalElapsed,
      server_timestamp: Date.now(),
    };

    this.io.to(`tournament:${tournamentId}`).emit('timer:tick', payload);

    // Persist state periodically (every 10 seconds to reduce writes)
    if (Math.floor(elapsed / 1000) % 10 === 0) {
      this.timerRepo.save({
        tournament_id: tournamentId,
        current_level: payload.current_level,
        time_remaining_ms: remaining,
        is_running: true,
        started_at: new Date(running.startedAt).toISOString(),
        paused_at: null,
        total_elapsed_ms: totalElapsed,
      });
    }
  }

  private advanceLevel(tournamentId: string, currentLevel: number, totalElapsed: number): void {
    this.stopInterval(tournamentId);

    const blinds = this.tournamentRepo.getBlinds(tournamentId);
    const nextLevelNum = currentLevel + 1;

    if (nextLevelNum > blinds.length) {
      // Tournament finished (no more levels)
      this.timerRepo.save({
        tournament_id: tournamentId,
        current_level: currentLevel,
        time_remaining_ms: 0,
        is_running: false,
        started_at: null,
        paused_at: null,
        total_elapsed_ms: totalElapsed,
      });
      this.io.to(`tournament:${tournamentId}`).emit('timer:finished', {
        tournament_id: tournamentId,
      });
      return;
    }

    const nextLevel = blinds[nextLevelNum - 1];
    const remaining = nextLevel.duration_minutes * 60 * 1000;

    this.timerRepo.save({
      tournament_id: tournamentId,
      current_level: nextLevelNum,
      time_remaining_ms: remaining,
      is_running: true,
      started_at: new Date().toISOString(),
      paused_at: null,
      total_elapsed_ms: totalElapsed,
    });

    this.emitLevelChanged(tournamentId, nextLevelNum, remaining, nextLevel);
    this.startInterval(tournamentId, remaining, nextLevelNum, totalElapsed);
  }

  private emitLevelChanged(tournamentId: string, level: number, remaining: number, blindLevel: BlindLevel): void {
    const payload: TimerLevelChangedPayload = {
      tournament_id: tournamentId,
      current_level: level,
      remaining_ms: remaining,
      is_break: blindLevel.is_break,
      break_name: blindLevel.break_name,
    };
    this.io.to(`tournament:${tournamentId}`).emit('timer:levelChanged', payload);
  }
}
