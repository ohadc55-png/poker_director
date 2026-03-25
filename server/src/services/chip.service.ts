import type { ChipDenomination } from '@poker/shared';
import type { ChipDistributionResult } from '@poker/shared';

export function calculateChipDistribution(
  denominations: ChipDenomination[],
  startingStack: number,
  numPlayers: number
): ChipDistributionResult {
  // Sort denominations by value descending for greedy algorithm
  const sorted = [...denominations].sort((a, b) => b.value - a.value);

  let remaining = startingStack;
  const perPlayer: { value: number; color: string; count: number }[] = [];

  for (const denom of sorted) {
    if (remaining <= 0) break;

    // How many of this denomination can fit?
    const maxFromStack = Math.floor(remaining / denom.value);
    const maxAvailable = Math.floor(denom.quantity / numPlayers);
    const count = Math.min(maxFromStack, maxAvailable);

    if (count > 0) {
      perPlayer.push({
        value: denom.value,
        color: denom.color,
        count,
      });
      remaining -= count * denom.value;
    }
  }

  // If we couldn't reach exact starting stack, try adjusting with smallest denomination
  if (remaining > 0 && sorted.length > 0) {
    const smallest = sorted[sorted.length - 1];
    const extraNeeded = Math.ceil(remaining / smallest.value);
    const existing = perPlayer.find((p) => p.value === smallest.value);
    if (existing) {
      existing.count += extraNeeded;
    } else {
      perPlayer.push({
        value: smallest.value,
        color: smallest.color,
        count: extraNeeded,
      });
    }
    remaining = 0;
  }

  // Sort by value ascending for display
  perPlayer.sort((a, b) => a.value - b.value);

  const totalPerPlayer = perPlayer.reduce((sum, p) => sum + p.value * p.count, 0);
  const totalChipsNeeded = perPlayer.reduce((sum, p) => sum + p.count, 0) * numPlayers;

  // Check if we have enough chips
  let warning: string | undefined;
  for (const pp of perPlayer) {
    const denom = denominations.find((d) => d.value === pp.value);
    if (denom && pp.count * numPlayers > denom.quantity) {
      warning = `Not enough ${pp.value} chips: need ${pp.count * numPlayers}, have ${denom.quantity}`;
      break;
    }
  }

  return {
    per_player: perPlayer,
    total_per_player: totalPerPlayer,
    total_chips_needed: totalChipsNeeded,
    warning,
  };
}

export function suggestColorUp(
  denominations: ChipDenomination[],
  currentSmallBlind: number
): { denomination: ChipDenomination; replaceWith: ChipDenomination; ratio: number } | null {
  const sorted = [...denominations].sort((a, b) => a.value - b.value);

  for (let i = 0; i < sorted.length - 1; i++) {
    const chip = sorted[i];
    // A chip is no longer useful when it's less than 1/4 of the small blind
    if (chip.value < currentSmallBlind / 4) {
      const nextChip = sorted[i + 1];
      return {
        denomination: chip,
        replaceWith: nextChip,
        ratio: nextChip.value / chip.value,
      };
    }
  }

  return null;
}
