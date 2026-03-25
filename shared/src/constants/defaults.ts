export const DEFAULT_CURRENCY = '₪';
export const DEFAULT_GAME_TYPE = "Texas Hold'em";
export const DEFAULT_MAX_SEATS = 9;
export const DEFAULT_LEVEL_DURATION = 20;
export const DEFAULT_BREAK_DURATION = 10;
export const DEFAULT_STARTING_CHIPS = 10000;

export const TIMER_TICK_INTERVAL_MS = 1000;
export const TIMER_WARNING_THRESHOLDS = [60, 30, 10]; // seconds

export const PRIZE_TEMPLATES = {
  winner_takes_all: [{ place: 1, percentage: 100 }],
  top_3: [
    { place: 1, percentage: 50 },
    { place: 2, percentage: 30 },
    { place: 3, percentage: 20 },
  ],
  top_5: [
    { place: 1, percentage: 40 },
    { place: 2, percentage: 25 },
    { place: 3, percentage: 15 },
    { place: 4, percentage: 12 },
    { place: 5, percentage: 8 },
  ],
  top_7: [
    { place: 1, percentage: 35 },
    { place: 2, percentage: 22 },
    { place: 3, percentage: 15 },
    { place: 4, percentage: 10 },
    { place: 5, percentage: 8 },
    { place: 6, percentage: 6 },
    { place: 7, percentage: 4 },
  ],
} as const;

export const DEFAULT_CHIP_COLORS = [
  { value: 25, color: '#22C55E', color_name: 'Green' },
  { value: 100, color: '#000000', color_name: 'Black' },
  { value: 500, color: '#8B5CF6', color_name: 'Purple' },
  { value: 1000, color: '#F59E0B', color_name: 'Yellow' },
  { value: 5000, color: '#EF4444', color_name: 'Red' },
  { value: 10000, color: '#3B82F6', color_name: 'Blue' },
  { value: 25000, color: '#EC4899', color_name: 'Pink' },
] as const;
