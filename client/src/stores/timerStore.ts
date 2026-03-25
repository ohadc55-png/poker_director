import { create } from 'zustand';
import type { BlindLevel, TimerTickPayload, TimerLevelChangedPayload } from '@poker/shared';
import { getSocket } from '../lib/socket';

interface TimerStore {
  remainingMs: number;
  currentLevel: number;
  isRunning: boolean;
  totalElapsedMs: number;
  lastServerTimestamp: number;
  lastServerRemainingMs: number;
  isBreak: boolean;
  breakName: string | null;
  isFinished: boolean;

  // Actions — send commands via socket
  start: (tournamentId: string) => void;
  pause: (tournamentId: string) => void;
  resume: (tournamentId: string) => void;
  stop: (tournamentId: string) => void;
  nextLevel: (tournamentId: string) => void;
  prevLevel: (tournamentId: string) => void;
  addTime: (tournamentId: string, seconds: number) => void;

  // Internal — called by socket event handlers
  onTick: (data: TimerTickPayload) => void;
  onLevelChanged: (data: TimerLevelChangedPayload) => void;
  onStateChanged: (data: { tournament_id: string; is_running: boolean }) => void;
  onFinished: () => void;
  reset: () => void;
}

export const useTimerStore = create<TimerStore>((set) => ({
  remainingMs: 0,
  currentLevel: 1,
  isRunning: false,
  totalElapsedMs: 0,
  lastServerTimestamp: 0,
  lastServerRemainingMs: 0,
  isBreak: false,
  breakName: null,
  isFinished: false,

  start: (tournamentId) => {
    getSocket().emit('timer:start', { tournament_id: tournamentId });
  },

  pause: (tournamentId) => {
    getSocket().emit('timer:pause', { tournament_id: tournamentId });
  },

  resume: (tournamentId) => {
    getSocket().emit('timer:resume', { tournament_id: tournamentId });
  },

  stop: (tournamentId) => {
    getSocket().emit('timer:stop', { tournament_id: tournamentId });
  },

  nextLevel: (tournamentId) => {
    getSocket().emit('timer:nextLevel', { tournament_id: tournamentId });
  },

  prevLevel: (tournamentId) => {
    getSocket().emit('timer:prevLevel', { tournament_id: tournamentId });
  },

  addTime: (tournamentId, seconds) => {
    getSocket().emit('timer:addTime', { tournament_id: tournamentId, seconds });
  },

  onTick: (data) => {
    set({
      remainingMs: data.remaining_ms,
      currentLevel: data.current_level,
      isRunning: data.is_running,
      totalElapsedMs: data.total_elapsed_ms,
      lastServerTimestamp: data.server_timestamp,
      lastServerRemainingMs: data.remaining_ms,
      isFinished: false,
    });
  },

  onLevelChanged: (data) => {
    set({
      currentLevel: data.current_level,
      remainingMs: data.remaining_ms,
      isBreak: data.is_break,
      breakName: data.break_name,
    });
  },

  onStateChanged: (data) => {
    if (data.is_running) {
      // Resuming — reset timestamp so RAF interpolates from current remainingMs
      set((state) => ({
        isRunning: true,
        lastServerTimestamp: Date.now(),
        lastServerRemainingMs: state.remainingMs,
      }));
    } else {
      // Pausing — freeze display at current remainingMs
      set((state) => ({
        isRunning: false,
        lastServerRemainingMs: state.remainingMs,
      }));
    }
  },

  onFinished: () => {
    set({ isRunning: false, isFinished: true, remainingMs: 0 });
  },

  reset: () => {
    set({
      remainingMs: 0,
      currentLevel: 1,
      isRunning: false,
      totalElapsedMs: 0,
      lastServerTimestamp: 0,
      lastServerRemainingMs: 0,
      isBreak: false,
      breakName: null,
      isFinished: false,
    });
  },
}));
