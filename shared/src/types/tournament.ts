export type TournamentStatus = 'setup' | 'running' | 'paused' | 'finished';
export type GameType = 'Texas Hold\'em' | 'Omaha' | 'PLO' | 'PLO5' | 'Mixed';
export type RebuyCondition = 'anytime' | 'below_starting' | 'zero';

export interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string | null;
  game_type: GameType;
  status: TournamentStatus;
  buy_in_amount: number;
  buy_in_fee: number;
  starting_chips: number;
  rebuy_amount: number | null;
  rebuy_chips: number | null;
  max_rebuys: number | null;
  rebuy_deadline_level: number | null;
  rebuy_condition: RebuyCondition;
  addon_amount: number | null;
  addon_chips: number | null;
  addon_window_level: number | null;
  late_reg_level: number | null;
  guarantee: number | null;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlindLevel {
  id: string;
  tournament_id: string;
  level_number: number;
  small_blind: number;
  big_blind: number;
  ante: number;
  big_blind_ante: number;
  duration_minutes: number;
  is_break: boolean;
  break_name: string | null;
}

export interface ChipDenomination {
  id: string;
  tournament_id: string;
  value: number;
  color: string;
  color_name: string | null;
  stripe_color: string | null;
  quantity: number;
  per_player: number | null;
}

export interface PrizeLevel {
  id: string;
  tournament_id: string;
  place: number;
  percentage: number | null;
  fixed_amount: number | null;
}

export interface BlindTemplate {
  id: string;
  name: string;
  description: string | null;
  style: 'turbo' | 'regular' | 'deep_stack' | 'custom';
  levels_json: string;
  created_at: string;
}

export interface TournamentTemplate {
  id: string;
  name: string;
  description: string | null;
  config_json: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  tournament_id: string;
  player_id: string | null;
  type: 'buyin' | 'rebuy' | 'addon' | 'payout' | 'fee';
  amount: number;
  created_at: string;
}
