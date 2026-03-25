export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface TimerState {
  tournament_id: string;
  current_level: number;
  time_remaining_ms: number;
  is_running: boolean;
  started_at: string | null;
  paused_at: string | null;
  total_elapsed_ms: number;
  updated_at: string;
}

export interface TimerTickPayload {
  tournament_id: string;
  remaining_ms: number;
  current_level: number;
  is_running: boolean;
  total_elapsed_ms: number;
  server_timestamp: number;
}

export interface TimerLevelChangedPayload {
  tournament_id: string;
  current_level: number;
  remaining_ms: number;
  is_break: boolean;
  break_name: string | null;
}

export interface TimerAddTimePayload {
  tournament_id: string;
  seconds: number;
}
