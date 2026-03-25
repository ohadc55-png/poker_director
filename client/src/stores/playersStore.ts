import { create } from 'zustand';
import { api } from '../lib/api';
import type { PlayerWithStats, TournamentHistoryEntry, PlayerRivals } from '@poker/shared';

interface PlayersStore {
  players: PlayerWithStats[];
  selectedPlayer: PlayerWithStats | null;
  playerHistory: TournamentHistoryEntry[];
  playerRivals: PlayerRivals | null;
  loading: boolean;
  error: string | null;

  loadPlayers: () => Promise<void>;
  selectPlayer: (id: string) => Promise<void>;
  clearSelection: () => void;
  createPlayer: (data: { name: string; nickname?: string; phone?: string; email?: string }) => Promise<any>;
  updatePlayer: (id: string, data: Record<string, any>) => Promise<void>;
}

export const usePlayersStore = create<PlayersStore>((set, get) => ({
  players: [],
  selectedPlayer: null,
  playerHistory: [],
  playerRivals: null,
  loading: false,
  error: null,

  loadPlayers: async () => {
    set({ loading: true, error: null });
    try {
      const players = await api.getPlayers();
      set({ players: players as PlayerWithStats[], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  selectPlayer: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const [player, history, rivals] = await Promise.all([
        api.getPlayer(id),
        api.getPlayerHistory(id),
        api.getPlayerRivals(id),
      ]);
      set({
        selectedPlayer: player as PlayerWithStats,
        playerHistory: history as TournamentHistoryEntry[],
        playerRivals: rivals as PlayerRivals,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  clearSelection: () => {
    set({ selectedPlayer: null, playerHistory: [], playerRivals: null });
  },

  createPlayer: async (data) => {
    const player = await api.createPlayer(data);
    await get().loadPlayers();
    return player;
  },

  updatePlayer: async (id, data) => {
    await api.updatePlayer(id, data);
    await get().loadPlayers();
    if (get().selectedPlayer?.id === id) {
      await get().selectPlayer(id);
    }
  },
}));
