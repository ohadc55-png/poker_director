import { z } from 'zod';

export const createTournamentSchema = z.object({
  name: z.string().min(1).max(200),
  date: z.string().min(1),
  location: z.string().max(200).optional(),
  game_type: z.string().default("Texas Hold'em"),
  buy_in_amount: z.number().positive(),
  buy_in_fee: z.number().min(0).default(0),
  starting_chips: z.number().int().positive(),
  rebuy_amount: z.number().positive().optional(),
  rebuy_chips: z.number().int().positive().optional(),
  max_rebuys: z.number().int().min(0).optional(),
  rebuy_deadline_level: z.number().int().positive().optional(),
  rebuy_condition: z.enum(['anytime', 'below_starting', 'zero']).default('anytime'),
  addon_amount: z.number().positive().optional(),
  addon_chips: z.number().int().positive().optional(),
  addon_window_level: z.number().int().positive().optional(),
  late_reg_level: z.number().int().positive().optional(),
  guarantee: z.number().positive().optional(),
  currency: z.string().default('₪'),
  notes: z.string().optional(),
});

export const updateTournamentSchema = createTournamentSchema.partial();

export const blindLevelInputSchema = z.object({
  level_number: z.number().int().positive(),
  small_blind: z.number().int().positive(),
  big_blind: z.number().int().positive(),
  ante: z.number().int().min(0).default(0),
  big_blind_ante: z.number().int().min(0).default(0),
  duration_minutes: z.number().int().positive(),
  is_break: z.boolean().default(false),
  break_name: z.string().optional(),
});

export const generateBlindsSchema = z.object({
  starting_chips: z.number().int().positive(),
  num_players: z.number().int().positive(),
  target_duration_hours: z.number().positive(),
  level_duration_minutes: z.number().int().positive().default(20),
  style: z.enum(['turbo', 'regular', 'deep_stack']),
  include_antes: z.boolean().default(true),
  ante_start_level: z.number().int().positive().default(5),
  break_every_n_levels: z.number().int().positive().default(4),
  break_duration_minutes: z.number().int().positive().default(10),
});

export const registerPlayerSchema = z.object({
  player_id: z.string().optional(),
  name: z.string().min(1).max(200).optional(),
  nickname: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
}).refine(
  (data) => data.player_id || data.name,
  { message: 'Either player_id or name must be provided' }
);

export const createPlayerSchema = z.object({
  name: z.string().min(1).max(200),
  nickname: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  notes: z.string().optional(),
});

export const chipDenominationSchema = z.object({
  value: z.number().int().positive(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  color_name: z.string().optional(),
  stripe_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  quantity: z.number().int().positive(),
});

export const prizeLevelSchema = z.object({
  place: z.number().int().positive(),
  percentage: z.number().min(0).max(100).optional(),
  fixed_amount: z.number().min(0).optional(),
});

export const updatePlayerSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  nickname: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  notes: z.string().optional(),
});

export const bustWithKnockoutSchema = z.object({
  knocked_out_by_player_id: z.string().optional(),
});
