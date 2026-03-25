import type { Tournament, BlindLevel, ChipDenomination, PrizeLevel } from './tournament.js';

// Tournament API
export interface CreateTournamentRequest {
  name: string;
  date: string;
  location?: string;
  game_type?: string;
  buy_in_amount: number;
  buy_in_fee?: number;
  starting_chips: number;
  rebuy_amount?: number;
  rebuy_chips?: number;
  max_rebuys?: number;
  rebuy_deadline_level?: number;
  rebuy_condition?: string;
  addon_amount?: number;
  addon_chips?: number;
  addon_window_level?: number;
  late_reg_level?: number;
  guarantee?: number;
  currency?: string;
  notes?: string;
}

export type UpdateTournamentRequest = Partial<CreateTournamentRequest>;

// Blind Structure
export interface BlindLevelInput {
  level_number: number;
  small_blind: number;
  big_blind: number;
  ante?: number;
  big_blind_ante?: number;
  duration_minutes: number;
  is_break?: boolean;
  break_name?: string;
}

export interface GenerateBlindStructureRequest {
  starting_chips: number;
  num_players: number;
  target_duration_hours: number;
  level_duration_minutes: number;
  style: 'turbo' | 'regular' | 'deep_stack';
  include_antes?: boolean;
  ante_start_level?: number;
  break_every_n_levels?: number;
  break_duration_minutes?: number;
}

// Chip Distribution
export interface ChipDenominationInput {
  value: number;
  color: string;
  color_name?: string;
  stripe_color?: string;
  quantity: number;
}

export interface ChipDistributionResult {
  per_player: { value: number; color: string; count: number }[];
  total_per_player: number;
  total_chips_needed: number;
  warning?: string;
}

// Prize
export interface PrizeLevelInput {
  place: number;
  percentage?: number;
  fixed_amount?: number;
}

export interface PrizeCalculationResult {
  total_prize_pool: number;
  total_buyins: number;
  total_rebuys: number;
  total_addons: number;
  total_fees: number;
  guarantee_shortfall: number;
  payouts: { place: number; percentage: number; amount: number }[];
}

// Player Registration
export interface RegisterPlayerRequest {
  player_id?: string;
  name?: string;
  nickname?: string;
  email?: string;
  phone?: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
