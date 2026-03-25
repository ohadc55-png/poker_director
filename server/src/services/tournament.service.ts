import { Database } from '../db/connection.js';
import { TournamentRepo } from '../repositories/tournament.repo.js';
import { PlayerRepo } from '../repositories/player.repo.js';
import { FinancialRepo } from '../repositories/financial.repo.js';
import { AppError } from '../middleware/errorHandler.js';

export class TournamentService {
  private tournamentRepo: TournamentRepo;
  private playerRepo: PlayerRepo;
  private financialRepo: FinancialRepo;

  constructor(db: Database) {
    this.tournamentRepo = new TournamentRepo(db);
    this.playerRepo = new PlayerRepo(db);
    this.financialRepo = new FinancialRepo(db);
  }

  create(data: Record<string, any>) {
    return this.tournamentRepo.create(data);
  }

  getAll() {
    return this.tournamentRepo.getAll();
  }

  getById(id: string) {
    const tournament = this.tournamentRepo.getById(id);
    if (!tournament) throw new AppError(404, 'Tournament not found');
    return tournament;
  }

  getFullDetails(id: string) {
    const tournament = this.getById(id);
    const blinds = this.tournamentRepo.getBlinds(id);
    const players = this.playerRepo.getTournamentPlayers(id);
    const chips = this.tournamentRepo.getChips(id);
    const prizes = this.tournamentRepo.getPrizes(id);
    const summary = this.financialRepo.getTournamentSummary(id);

    const activePlayers = players.filter(p => p.status === 'active' || p.status === 'registered').length;
    const totalRebuys = players.reduce((sum, p) => sum + p.rebuys, 0);
    const totalAddons = players.reduce((sum, p) => sum + p.addons, 0);

    const prizePool =
      (players.length * tournament.buy_in_amount) +
      (totalRebuys * (tournament.rebuy_amount || 0)) +
      (totalAddons * (tournament.addon_amount || 0));

    const totalFees =
      (players.length * tournament.buy_in_fee) +
      (totalRebuys * (tournament.rebuy_amount ? tournament.buy_in_fee : 0));

    return {
      ...tournament,
      blinds,
      players,
      chips,
      prizes,
      stats: {
        total_players: players.length,
        active_players: activePlayers,
        total_rebuys: totalRebuys,
        total_addons: totalAddons,
        prize_pool: prizePool,
        total_fees: totalFees,
        average_stack: activePlayers > 0
          ? Math.round(
              (players.length * tournament.starting_chips +
                totalRebuys * (tournament.rebuy_chips || 0) +
                totalAddons * (tournament.addon_chips || 0)) /
                activePlayers
            )
          : 0,
      },
      financial_summary: summary,
    };
  }

  update(id: string, data: Record<string, any>) {
    this.getById(id); // Ensure exists
    return this.tournamentRepo.update(id, data);
  }

  delete(id: string) {
    this.getById(id);
    this.tournamentRepo.delete(id);
  }

  // Blind levels
  getBlinds(tournamentId: string) {
    return this.tournamentRepo.getBlinds(tournamentId);
  }

  setBlinds(tournamentId: string, levels: any[]) {
    this.getById(tournamentId);
    return this.tournamentRepo.setBlinds(tournamentId, levels);
  }

  // Chips
  getChips(tournamentId: string) {
    return this.tournamentRepo.getChips(tournamentId);
  }

  setChips(tournamentId: string, chips: any[]) {
    this.getById(tournamentId);
    return this.tournamentRepo.setChips(tournamentId, chips);
  }

  // Prizes
  getPrizes(tournamentId: string) {
    return this.tournamentRepo.getPrizes(tournamentId);
  }

  setPrizes(tournamentId: string, prizes: any[]) {
    this.getById(tournamentId);
    return this.tournamentRepo.setPrizes(tournamentId, prizes);
  }
}
