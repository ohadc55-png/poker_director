import { Database } from '../db/connection.js';
import type { Server as SocketServer } from 'socket.io';
import { PlayerRepo } from '../repositories/player.repo.js';
import { FinancialRepo } from '../repositories/financial.repo.js';
import { TournamentRepo } from '../repositories/tournament.repo.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateAvatarColor } from '../lib/avatarColor.js';

export class PlayerService {
  private playerRepo: PlayerRepo;
  private financialRepo: FinancialRepo;
  private tournamentRepo: TournamentRepo;

  constructor(private db: Database, private io?: SocketServer) {
    this.playerRepo = new PlayerRepo(db);
    this.financialRepo = new FinancialRepo(db);
    this.tournamentRepo = new TournamentRepo(db);
  }

  // Global player database
  createPlayer(data: Record<string, any>) {
    const avatar_color = generateAvatarColor(data.name || '');
    return this.playerRepo.createPlayer({ ...data, avatar_color });
  }

  getPlayer(id: string) {
    const player = this.playerRepo.getPlayerWithStats(id);
    if (!player) throw new AppError(404, 'Player not found');
    return player;
  }

  getAllPlayers() {
    return this.playerRepo.getAllPlayersWithStats();
  }

  searchPlayers(query: string) {
    return this.playerRepo.searchPlayers(query);
  }

  updatePlayer(id: string, data: Record<string, any>) {
    const player = this.playerRepo.getPlayer(id);
    if (!player) throw new AppError(404, 'Player not found');
    return this.playerRepo.updatePlayer(id, data);
  }

  getPlayerHistory(id: string) {
    const player = this.playerRepo.getPlayer(id);
    if (!player) throw new AppError(404, 'Player not found');
    return this.playerRepo.getPlayerHistory(id);
  }

  getPlayerRivals(id: string) {
    const player = this.playerRepo.getPlayer(id);
    if (!player) throw new AppError(404, 'Player not found');
    return this.playerRepo.getPlayerRivals(id);
  }

  // Tournament player operations
  registerToTournament(tournamentId: string, data: { player_id?: string; name?: string; nickname?: string; email?: string; phone?: string }) {
    const tournament = this.tournamentRepo.getById(tournamentId);
    if (!tournament) throw new AppError(404, 'Tournament not found');

    let playerId = data.player_id;

    // Create new player if no ID provided
    if (!playerId && data.name) {
      const player = this.createPlayer({
        name: data.name,
        nickname: data.nickname || null,
        email: data.email || null,
        phone: data.phone || null,
        notes: null,
      });
      playerId = player.id;
    }

    if (!playerId) throw new AppError(400, 'Player ID or name required');

    // Check if already registered
    const existing = this.playerRepo.getTournamentPlayer(tournamentId, playerId);
    if (existing) throw new AppError(400, 'Player already registered');

    // Register (without payment — entry is separate)
    const tp = this.playerRepo.register(tournamentId, playerId);

    this.emitPlayersUpdate(tournamentId);

    return tp;
  }

  // Entry = pay buy-in
  entry(tournamentId: string, playerId: string) {
    const tournament = this.tournamentRepo.getById(tournamentId);
    if (!tournament) throw new AppError(404, 'Tournament not found');

    const tp = this.playerRepo.getTournamentPlayer(tournamentId, playerId);
    if (!tp) throw new AppError(404, 'Player not in tournament');
    if (tp.has_entry) throw new AppError(400, 'Player already has entry');

    this.playerRepo.setEntry(tournamentId, playerId, true);

    this.financialRepo.addTransaction({
      tournament_id: tournamentId,
      player_id: playerId,
      type: 'buyin',
      amount: tournament.buy_in_amount,
    });
    if (tournament.buy_in_fee > 0) {
      this.financialRepo.addTransaction({
        tournament_id: tournamentId,
        player_id: playerId,
        type: 'fee',
        amount: tournament.buy_in_fee,
      });
    }

    this.emitPlayersUpdate(tournamentId);
    this.emitPrizePoolUpdate(tournamentId);

    return this.playerRepo.getTournamentPlayer(tournamentId, playerId);
  }

  // Cancel entry = undo buy-in
  cancelEntry(tournamentId: string, playerId: string) {
    const tp = this.playerRepo.getTournamentPlayer(tournamentId, playerId);
    if (!tp) throw new AppError(404, 'Player not in tournament');
    if (!tp.has_entry) throw new AppError(400, 'Player has no entry to cancel');

    this.playerRepo.setEntry(tournamentId, playerId, false);

    // Remove buyin + fee transactions for this player
    this.financialRepo.removeTransactions(tournamentId, playerId, 'buyin');
    this.financialRepo.removeTransactions(tournamentId, playerId, 'fee');

    this.emitPlayersUpdate(tournamentId);
    this.emitPrizePoolUpdate(tournamentId);

    return this.playerRepo.getTournamentPlayer(tournamentId, playerId);
  }

  getTournamentPlayers(tournamentId: string) {
    return this.playerRepo.getTournamentPlayers(tournamentId);
  }

  bustOut(tournamentId: string, playerId: string, knockedOutByPlayerId?: string) {
    const tp = this.playerRepo.getTournamentPlayer(tournamentId, playerId);
    if (!tp) throw new AppError(404, 'Player not in tournament');
    if (tp.status === 'busted') throw new AppError(400, 'Player already busted');

    this.playerRepo.bustOut(tournamentId, playerId, knockedOutByPlayerId);
    this.emitPlayersUpdate(tournamentId);

    return this.playerRepo.getTournamentPlayer(tournamentId, playerId);
  }

  rebuy(tournamentId: string, playerId: string) {
    const tournament = this.tournamentRepo.getById(tournamentId);
    if (!tournament) throw new AppError(404, 'Tournament not found');
    if (!tournament.rebuy_amount) throw new AppError(400, 'Rebuys not allowed');

    const tp = this.playerRepo.getTournamentPlayer(tournamentId, playerId);
    if (!tp) throw new AppError(404, 'Player not in tournament');

    // Check max rebuys
    if (tournament.max_rebuys !== null && tp.rebuys >= tournament.max_rebuys) {
      throw new AppError(400, 'Maximum rebuys reached');
    }

    this.playerRepo.rebuy(tournamentId, playerId);

    // Record transaction
    this.financialRepo.addTransaction({
      tournament_id: tournamentId,
      player_id: playerId,
      type: 'rebuy',
      amount: tournament.rebuy_amount,
    });

    this.emitPlayersUpdate(tournamentId);
    this.emitPrizePoolUpdate(tournamentId);

    return this.playerRepo.getTournamentPlayer(tournamentId, playerId);
  }

  addon(tournamentId: string, playerId: string) {
    const tournament = this.tournamentRepo.getById(tournamentId);
    if (!tournament) throw new AppError(404, 'Tournament not found');
    if (!tournament.addon_amount) throw new AppError(400, 'Add-ons not allowed');

    const tp = this.playerRepo.getTournamentPlayer(tournamentId, playerId);
    if (!tp) throw new AppError(404, 'Player not in tournament');
    if (tp.addons > 0) throw new AppError(400, 'Player already took add-on');

    this.playerRepo.addon(tournamentId, playerId);

    this.financialRepo.addTransaction({
      tournament_id: tournamentId,
      player_id: playerId,
      type: 'addon',
      amount: tournament.addon_amount,
    });

    this.emitPlayersUpdate(tournamentId);
    this.emitPrizePoolUpdate(tournamentId);

    return this.playerRepo.getTournamentPlayer(tournamentId, playerId);
  }

  removeFromTournament(tournamentId: string, playerId: string) {
    this.playerRepo.removeFromTournament(tournamentId, playerId);
    this.emitPlayersUpdate(tournamentId);
    this.emitPrizePoolUpdate(tournamentId);
  }

  // Player stats (legacy - kept for backward compat)
  getPlayerStats(playerId: string) {
    const player = this.getPlayer(playerId);
    const tournaments = this.playerRepo.getPlayerTournaments(playerId);

    const wins = tournaments.filter(t => t.finish_place === 1).length;
    const itmCount = tournaments.filter(t => t.finish_place && t.finish_place <= 3).length;
    const totalBuyins = tournaments.reduce(
      (sum, t) => sum + t.buy_in_amount + (t.rebuys * (t.buy_in_amount || 0)),
      0
    );

    return {
      player_id: playerId,
      player_name: player.name,
      tournaments_played: tournaments.length,
      wins,
      total_buyins: totalBuyins,
      total_winnings: 0,
      itm_count: itmCount,
      itm_percentage: tournaments.length > 0 ? (itmCount / tournaments.length) * 100 : 0,
      best_finish: tournaments.reduce((best: number | null, t) => {
        if (t.finish_place === null) return best;
        return best === null ? t.finish_place : Math.min(best, t.finish_place);
      }, null),
      avg_finish: tournaments.filter(t => t.finish_place !== null).length > 0
        ? tournaments.filter(t => t.finish_place !== null)
            .reduce((sum, t) => sum + t.finish_place, 0) /
          tournaments.filter(t => t.finish_place !== null).length
        : null,
      tournaments,
    };
  }

  private emitPlayersUpdate(tournamentId: string) {
    if (!this.io) return;
    const players = this.playerRepo.getTournamentPlayers(tournamentId);
    this.io.to(`tournament:${tournamentId}`).emit('players:updated', {
      tournament_id: tournamentId,
      players,
    });
  }

  private emitPrizePoolUpdate(tournamentId: string) {
    if (!this.io) return;
    const tournament = this.tournamentRepo.getById(tournamentId);
    if (!tournament) return;

    const players = this.playerRepo.getTournamentPlayers(tournamentId);
    const paidEntries = players.filter((p: any) => p.has_entry).length;
    const totalRebuys = players.reduce((sum, p) => sum + p.rebuys, 0);
    const totalAddons = players.reduce((sum, p) => sum + p.addons, 0);
    const total =
      paidEntries * tournament.buy_in_amount +
      totalRebuys * (tournament.rebuy_amount || 0) +
      totalAddons * (tournament.addon_amount || 0);

    this.io.to(`tournament:${tournamentId}`).emit('prizePool:updated', {
      tournament_id: tournamentId,
      total,
    });
  }
}
