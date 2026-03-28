import { create } from 'zustand';
import { api } from '../lib/api';
import type { Tournament, BlindLevel, TournamentPlayer, ChipDenomination, PrizeLevel } from '@poker/shared';

interface TournamentStore {
  tournament: any | null;
  tournaments: Tournament[];
  blinds: BlindLevel[];
  players: TournamentPlayer[];
  chips: ChipDenomination[];
  prizes: PrizeLevel[];
  loading: boolean;
  error: string | null;

  // Tournament CRUD
  loadTournaments: () => Promise<void>;
  loadTournament: (id: string) => Promise<void>;
  createTournament: (data: any) => Promise<any>;
  updateTournament: (id: string, data: any) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;

  // Sub-data
  setBlinds: (tournamentId: string, levels: any[]) => Promise<void>;
  setChips: (tournamentId: string, chips: any[]) => Promise<void>;
  setPrizes: (tournamentId: string, prizes: any[]) => Promise<void>;

  // Player actions
  registerPlayer: (tournamentId: string, data: any) => Promise<void>;
  entryPlayer: (tournamentId: string, playerId: string) => Promise<void>;
  cancelEntryPlayer: (tournamentId: string, playerId: string) => Promise<void>;
  bustPlayer: (tournamentId: string, playerId: string, knockedOutByPlayerId?: string) => Promise<void>;
  rebuyPlayer: (tournamentId: string, playerId: string) => Promise<void>;
  addonPlayer: (tournamentId: string, playerId: string) => Promise<void>;
  removePlayer: (tournamentId: string, playerId: string) => Promise<void>;

  // Socket updates
  updatePlayers: (players: TournamentPlayer[]) => void;
  updatePrizePool: (total: number) => void;

  clear: () => void;
}

export const useTournamentStore = create<TournamentStore>((set, get) => ({
  tournament: null,
  tournaments: [],
  blinds: [],
  players: [],
  chips: [],
  prizes: [],
  loading: false,
  error: null,

  loadTournaments: async () => {
    set({ loading: true, error: null });
    try {
      const tournaments = await api.getTournaments();
      set({ tournaments, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  loadTournament: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await api.getTournament(id);
      set({
        tournament: data,
        blinds: data.blinds || [],
        players: data.players || [],
        chips: data.chips || [],
        prizes: data.prizes || [],
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createTournament: async (data) => {
    const tournament = await api.createTournament(data);
    set((state) => ({ tournaments: [tournament, ...state.tournaments] }));
    return tournament;
  },

  updateTournament: async (id, data) => {
    await api.updateTournament(id, data);
    await get().loadTournament(id);
  },

  deleteTournament: async (id) => {
    await api.deleteTournament(id);
    set((state) => ({ tournaments: state.tournaments.filter((t) => t.id !== id) }));
  },

  setBlinds: async (tournamentId, levels) => {
    const blinds = await api.setBlinds(tournamentId, levels);
    set({ blinds });
  },

  setChips: async (tournamentId, chips) => {
    const result = await api.setChips(tournamentId, chips);
    set({ chips: result });
  },

  setPrizes: async (tournamentId, prizes) => {
    const result = await api.setPrizes(tournamentId, prizes);
    set({ prizes: result });
  },

  registerPlayer: async (tournamentId, data) => {
    await api.registerPlayer(tournamentId, data);
  },

  entryPlayer: async (tournamentId, playerId) => {
    await api.entryPlayer(tournamentId, playerId);
  },

  cancelEntryPlayer: async (tournamentId, playerId) => {
    await api.cancelEntryPlayer(tournamentId, playerId);
  },

  bustPlayer: async (tournamentId, playerId, knockedOutByPlayerId?) => {
    await api.bustPlayer(tournamentId, playerId, knockedOutByPlayerId ? { knocked_out_by_player_id: knockedOutByPlayerId } : undefined);
  },

  rebuyPlayer: async (tournamentId, playerId) => {
    await api.rebuyPlayer(tournamentId, playerId);
  },

  addonPlayer: async (tournamentId, playerId) => {
    await api.addonPlayer(tournamentId, playerId);
  },

  removePlayer: async (tournamentId, playerId) => {
    await api.removePlayer(tournamentId, playerId);
  },

  updatePlayers: (players) => set({ players }),
  updatePrizePool: (total) => {
    set((state) => ({
      tournament: state.tournament ? { ...state.tournament, stats: { ...state.tournament.stats, prize_pool: total } } : null,
    }));
  },

  clear: () => set({
    tournament: null,
    blinds: [],
    players: [],
    chips: [],
    prizes: [],
    error: null,
  }),
}));
