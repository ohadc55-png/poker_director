import type { BlindLevelInput } from '@poker/shared';

interface GenerateParams {
  starting_chips: number;
  num_players: number;
  target_duration_hours: number;
  level_duration_minutes: number;
  style: 'turbo' | 'regular' | 'deep_stack';
  starting_big_blind: number;
  ante_type: 'none' | 'regular' | 'bb_ante';
  ante_start_level: number;
  break_every_n_levels: number;
  break_duration_minutes: number;
}

const STYLE_FACTORS = {
  turbo: { growthRate: 1.6 },
  regular: { growthRate: 1.5 },
  deep_stack: { growthRate: 1.4 },
};

// Standard chip denominations for rounding
const CHIP_VALUES = [25, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 2500, 3000, 5000, 10000, 15000, 20000, 25000, 50000];

// Round to a "clean" poker blind number
function roundBlind(value: number): number {
  if (value <= 0) return 25;
  if (value <= 100) return Math.max(25, Math.round(value / 25) * 25);
  if (value <= 500) return Math.round(value / 50) * 50;
  if (value <= 2000) return Math.round(value / 100) * 100;
  if (value <= 10000) return Math.round(value / 500) * 500;
  return Math.round(value / 1000) * 1000;
}

// Round ante to the nearest chip denomination
function roundAnte(value: number): number {
  if (value <= 0) return 0;
  let closest = CHIP_VALUES[0];
  let minDiff = Math.abs(value - closest);
  for (const chip of CHIP_VALUES) {
    const diff = Math.abs(value - chip);
    if (diff < minDiff) {
      minDiff = diff;
      closest = chip;
    }
  }
  return closest;
}

export function generateBlindStructure(params: GenerateParams): BlindLevelInput[] {
  const {
    target_duration_hours, level_duration_minutes, style,
    starting_big_blind, ante_type, ante_start_level,
    break_every_n_levels, break_duration_minutes,
  } = params;

  const { growthRate } = STYLE_FACTORS[style];

  const totalMinutes = target_duration_hours * 60;
  const avgLevelWithBreak = level_duration_minutes + (break_duration_minutes / break_every_n_levels);
  const levelsNeeded = Math.ceil(totalMinutes / avgLevelWithBreak);

  const startBB = roundBlind(starting_big_blind);
  const startSB = roundBlind(startBB / 2);

  const levels: BlindLevelInput[] = [];
  let levelNumber = 1;

  for (let i = 0; i < levelsNeeded; i++) {
    // Insert break
    if (i > 0 && i % break_every_n_levels === 0) {
      levels.push({
        level_number: levelNumber++,
        small_blind: 0,
        big_blind: 0,
        ante: 0,
        big_blind_ante: 0,
        duration_minutes: break_duration_minutes,
        is_break: true,
        break_name: 'Break',
      });
    }

    const factor = Math.pow(growthRate, i);
    const sb = roundBlind(startSB * factor);
    const bb = sb * 2;

    let ante = 0;
    let bbAnte = 0;
    if (ante_type !== 'none' && (i + 1) >= ante_start_level) {
      if (ante_type === 'bb_ante') {
        bbAnte = bb;
      } else {
        // Regular ante = 12% of BB, rounded to nearest chip
        ante = roundAnte(bb * 0.12);
        if (ante > bb) ante = bb;
      }
    }

    levels.push({
      level_number: levelNumber++,
      small_blind: sb,
      big_blind: bb,
      ante,
      big_blind_ante: bbAnte,
      duration_minutes: level_duration_minutes,
      is_break: false,
    });
  }

  return levels;
}
