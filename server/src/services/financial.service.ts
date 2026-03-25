import { Database } from '../db/connection.js';
import { TournamentRepo } from '../repositories/tournament.repo.js';
import { PlayerRepo } from '../repositories/player.repo.js';
import { FinancialRepo } from '../repositories/financial.repo.js';
import type { PrizeCalculationResult } from '@poker/shared';

export class FinancialService {
  private tournamentRepo: TournamentRepo;
  private playerRepo: PlayerRepo;
  private financialRepo: FinancialRepo;

  constructor(db: Database) {
    this.tournamentRepo = new TournamentRepo(db);
    this.playerRepo = new PlayerRepo(db);
    this.financialRepo = new FinancialRepo(db);
  }

  calculatePrizePool(tournamentId: string): PrizeCalculationResult {
    const tournament = this.tournamentRepo.getById(tournamentId);
    if (!tournament) throw new Error('Tournament not found');

    const players = this.playerRepo.getTournamentPlayers(tournamentId);
    const prizes = this.tournamentRepo.getPrizes(tournamentId);

    const totalPlayers = players.length;
    const totalRebuys = players.reduce((sum, p) => sum + p.rebuys, 0);
    const totalAddons = players.reduce((sum, p) => sum + p.addons, 0);

    const totalBuyins = totalPlayers * tournament.buy_in_amount;
    const totalRebuyAmount = totalRebuys * (tournament.rebuy_amount || 0);
    const totalAddonAmount = totalAddons * (tournament.addon_amount || 0);
    const totalFees = totalPlayers * tournament.buy_in_fee;

    let totalPrizePool = totalBuyins + totalRebuyAmount + totalAddonAmount;

    // Check guarantee
    let guaranteeShortfall = 0;
    if (tournament.guarantee && totalPrizePool < tournament.guarantee) {
      guaranteeShortfall = tournament.guarantee - totalPrizePool;
      totalPrizePool = tournament.guarantee;
    }

    // Calculate payouts
    const payouts = prizes.map((p) => {
      const percentage = p.percentage || 0;
      const amount = p.fixed_amount || Math.round(totalPrizePool * percentage / 100);
      return {
        place: p.place,
        percentage,
        amount,
      };
    });

    return {
      total_prize_pool: totalPrizePool,
      total_buyins: totalBuyins,
      total_rebuys: totalRebuyAmount,
      total_addons: totalAddonAmount,
      total_fees: totalFees,
      guarantee_shortfall: guaranteeShortfall,
      payouts,
    };
  }

  // ICM Calculator (Malmuth-Harville method)
  calculateICM(chipCounts: number[], prizes: number[]): number[] {
    const totalChips = chipCounts.reduce((a, b) => a + b, 0);
    if (totalChips === 0) return chipCounts.map(() => 0);

    const n = chipCounts.length;
    const equity = new Array(n).fill(0);

    const calculatePlaceProb = (
      playerIdx: number,
      place: number,
      remainingPlayers: Set<number>,
      remainingChips: number
    ): number => {
      if (place === 1) {
        return chipCounts[playerIdx] / remainingChips;
      }

      let prob = 0;
      for (const otherIdx of remainingPlayers) {
        if (otherIdx === playerIdx) continue;
        const winProb = chipCounts[otherIdx] / remainingChips;
        const newRemaining = new Set(remainingPlayers);
        newRemaining.delete(otherIdx);
        prob += winProb * calculatePlaceProb(
          playerIdx,
          place - 1,
          newRemaining,
          remainingChips - chipCounts[otherIdx]
        );
      }
      return prob;
    };

    const allPlayers = new Set(Array.from({ length: n }, (_, i) => i));

    for (let i = 0; i < n; i++) {
      if (chipCounts[i] === 0) continue;

      for (let place = 0; place < Math.min(prizes.length, n); place++) {
        const prob = calculatePlaceProb(i, place + 1, allPlayers, totalChips);
        equity[i] += prob * prizes[place];
      }
    }

    return equity.map((e) => Math.round(e * 100) / 100);
  }
}
