export type PlayerStatus = 'registered' | 'active' | 'busted' | 'waiting';

export interface Player {
  id: string;
  name: string;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  avatar_url: string | null;
  avatar_color: string | null;
  created_at: string;
}

export interface TournamentPlayer {
  id: string;
  tournament_id: string;
  player_id: string;
  table_id: string | null;
  seat_number: number | null;
  status: PlayerStatus;
  finish_place: number | null;
  rebuys: number;
  addons: number;
  prize_won: number;
  knocked_out_by_player_id: string | null;
  registered_at: string;
  busted_at: string | null;
  // Joined fields
  player_name?: string;
  player_nickname?: string;
}

export interface PlayerStats {
  player_id: string;
  player_name: string;
  tournaments_played: number;
  wins: number;
  total_buyins: number;
  total_winnings: number;
  itm_count: number;
  itm_percentage: number;
  best_finish: number | null;
  avg_finish: number | null;
}

export interface PlayerWithStats extends Player {
  tournaments_played: number;
  wins: number;
  total_invested: number;
  total_prize_won: number;
  net_pnl: number;
  itm_count: number;
  itm_percentage: number;
  best_finish: number | null;
  avg_finish: number | null;
  knockouts_dealt: number;
}

export interface TournamentHistoryEntry {
  tournament_id: string;
  tournament_name: string;
  tournament_date: string;
  finish_place: number | null;
  rebuys: number;
  addons: number;
  total_invested: number;
  prize_won: number;
  net_result: number;
  status: string;
}

export interface RivalEntry {
  player_id: string;
  player_name: string;
  avatar_color: string | null;
  count: number;
}

export interface PlayerRivals {
  knocked_out_by: RivalEntry[];
  knocked_out: RivalEntry[];
}

export interface LeaderboardEntry extends PlayerWithStats {
  rank: number;
}
