import type { TimerTickPayload, TimerLevelChangedPayload, TimerAddTimePayload } from './timer.js';
import type { TournamentPlayer } from './player.js';
import type { Table } from './table.js';

// Events emitted from client to server
export interface ClientToServerEvents {
  'tournament:join': (data: { tournament_id: string }) => void;
  'tournament:leave': (data: { tournament_id: string }) => void;
  'timer:start': (data: { tournament_id: string }) => void;
  'timer:pause': (data: { tournament_id: string }) => void;
  'timer:resume': (data: { tournament_id: string }) => void;
  'timer:stop': (data: { tournament_id: string }) => void;
  'timer:nextLevel': (data: { tournament_id: string }) => void;
  'timer:prevLevel': (data: { tournament_id: string }) => void;
  'timer:setLevel': (data: { tournament_id: string; level: number }) => void;
  'timer:addTime': (data: TimerAddTimePayload) => void;
}

// Events emitted from server to client
export interface ServerToClientEvents {
  'timer:tick': (data: TimerTickPayload) => void;
  'timer:levelChanged': (data: TimerLevelChangedPayload) => void;
  'timer:stateChanged': (data: { tournament_id: string; is_running: boolean }) => void;
  'timer:finished': (data: { tournament_id: string }) => void;
  'tournament:updated': (data: { tournament_id: string }) => void;
  'players:updated': (data: { tournament_id: string; players: TournamentPlayer[] }) => void;
  'tables:updated': (data: { tournament_id: string; tables: Table[] }) => void;
  'prizePool:updated': (data: { tournament_id: string; total: number }) => void;
}
