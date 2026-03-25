import type { BlindLevelInput } from '@poker/shared';

interface GenerateParams {
  starting_chips: number;
  num_players: number;
  target_duration_hours: number;
  level_duration_minutes: number;
  style: 'turbo' | 'regular' | 'deep_stack';
  include_antes: boolean;
  ante_start_level: number;
  break_every_n_levels: number;
  break_duration_minutes: number;
}

const STYLE_FACTORS = {
  turbo: { growthRate: 1.6, startFraction: 200 },
  regular: { growthRate: 1.5, startFraction: 400 },
  deep_stack: { growthRate: 1.4, startFraction: 500 },
};

export function generateBlindStructure(params: GenerateParams): BlindLevelInput[] {
  const { starting_chips, target_duration_hours, level_duration_minutes, style, include_antes, ante_start_level, break_every_n_levels, break_duration_minutes } = params;
  const { growthRate, startFraction } = STYLE_FACTORS[style];

  const totalMinutes = target_duration_hours * 60;
  const breakMinutes = break_duration_minutes;
  const levelsNeeded = Math.ceil(totalMinutes / (level_duration_minutes + breakMinutes / break_every_n_levels));

  const startBB = Math.max(Math.round(starting_chips / startFraction / 25) * 25, 50);
  const startSB = Math.round(startBB / 2);

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
        duration_minutes: breakMinutes,
        is_break: true,
        break_name: `Break`,
      });
    }

    const factor = Math.pow(growthRate, i);
    let bb = Math.round((startBB * factor) / 25) * 25;
    if (bb < 50) bb = 50;
    let sb = Math.round(bb / 2 / 25) * 25;
    if (sb < 25) sb = 25;

    // Ensure bb is exactly 2x sb for clean numbers
    if (bb < sb * 2) bb = sb * 2;

    let ante = 0;
    let bbAnte = 0;
    if (include_antes && (i + 1) >= ante_start_level) {
      // BB ante = BB value
      bbAnte = bb;
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
