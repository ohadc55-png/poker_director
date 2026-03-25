const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data.data;
}

export const api = {
  // Tournaments
  getTournaments: () => request<any[]>('/tournaments'),
  getTournament: (id: string) => request<any>(`/tournaments/${id}`),
  createTournament: (data: any) => request<any>('/tournaments', { method: 'POST', body: JSON.stringify(data) }),
  updateTournament: (id: string, data: any) => request<any>(`/tournaments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTournament: (id: string) => request<void>(`/tournaments/${id}`, { method: 'DELETE' }),

  // Blinds
  getBlinds: (tournamentId: string) => request<any[]>(`/tournaments/${tournamentId}/blinds`),
  setBlinds: (tournamentId: string, levels: any[]) =>
    request<any[]>(`/tournaments/${tournamentId}/blinds`, { method: 'PUT', body: JSON.stringify({ levels }) }),
  generateBlinds: (params: any) => request<any[]>('/blinds/generate', { method: 'POST', body: JSON.stringify(params) }),

  // Players
  getPlayers: (search?: string) => request<any[]>(`/players${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getPlayer: (id: string) => request<any>(`/players/${id}`),
  createPlayer: (data: any) => request<any>('/players', { method: 'POST', body: JSON.stringify(data) }),
  updatePlayer: (id: string, data: any) => request<any>(`/players/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getPlayerStats: (id: string) => request<any>(`/players/${id}/stats`),
  getPlayerHistory: (id: string) => request<any[]>(`/players/${id}/history`),
  getPlayerRivals: (id: string) => request<any>(`/players/${id}/rivals`),
  getTournamentPlayers: (tournamentId: string) => request<any[]>(`/tournaments/${tournamentId}/players`),
  registerPlayer: (tournamentId: string, data: any) =>
    request<any>(`/players/tournaments/${tournamentId}/register`, { method: 'POST', body: JSON.stringify(data) }),
  bustPlayer: (tournamentId: string, playerId: string, data?: { knocked_out_by_player_id?: string }) =>
    request<any>(`/players/tournaments/${tournamentId}/${playerId}/bust`, { method: 'POST', body: JSON.stringify(data || {}) }),
  rebuyPlayer: (tournamentId: string, playerId: string) =>
    request<any>(`/players/tournaments/${tournamentId}/${playerId}/rebuy`, { method: 'POST' }),
  addonPlayer: (tournamentId: string, playerId: string) =>
    request<any>(`/players/tournaments/${tournamentId}/${playerId}/addon`, { method: 'POST' }),
  removePlayer: (tournamentId: string, playerId: string) =>
    request<void>(`/players/tournaments/${tournamentId}/${playerId}`, { method: 'DELETE' }),

  // Chips
  getChips: (tournamentId: string) => request<any[]>(`/tournaments/${tournamentId}/chips`),
  setChips: (tournamentId: string, chips: any[]) =>
    request<any[]>(`/tournaments/${tournamentId}/chips`, { method: 'PUT', body: JSON.stringify({ chips }) }),

  // Prizes
  getPrizes: (tournamentId: string) => request<any[]>(`/tournaments/${tournamentId}/prizes`),
  setPrizes: (tournamentId: string, prizes: any[]) =>
    request<any[]>(`/tournaments/${tournamentId}/prizes`, { method: 'PUT', body: JSON.stringify({ prizes }) }),

  // Financial
  getFinancials: (tournamentId: string) => request<any>(`/financial/${tournamentId}`),
  calculateICM: (chipCounts: number[], prizes: number[]) =>
    request<number[]>('/financial/icm', { method: 'POST', body: JSON.stringify({ chip_counts: chipCounts, prizes }) }),

  // Tables
  getTables: (tournamentId: string) => request<any[]>(`/tables/${tournamentId}`),
  createTables: (tournamentId: string, count: number, maxSeats: number) =>
    request<any[]>(`/tables/${tournamentId}`, { method: 'POST', body: JSON.stringify({ count, max_seats: maxSeats }) }),
  seatRandomly: (tournamentId: string) =>
    request<any[]>(`/tables/${tournamentId}/seat-randomly`, { method: 'POST' }),
  balanceTables: (tournamentId: string) =>
    request<any[]>(`/tables/${tournamentId}/balance`, { method: 'POST' }),

  // Timer
  getTimerState: (tournamentId: string) => request<any>(`/timer/${tournamentId}`),
  startTimer: (tournamentId: string) => request<any>(`/timer/${tournamentId}/start`, { method: 'POST' }),
  pauseTimer: (tournamentId: string) => request<any>(`/timer/${tournamentId}/pause`, { method: 'POST' }),
  resumeTimer: (tournamentId: string) => request<any>(`/timer/${tournamentId}/resume`, { method: 'POST' }),

  // Templates
  getBlindTemplates: () => request<any[]>('/templates/blinds'),
  saveBlindTemplate: (data: any) => request<any>('/templates/blinds', { method: 'POST', body: JSON.stringify(data) }),
  deleteBlindTemplate: (id: string) => request<void>(`/templates/blinds/${id}`, { method: 'DELETE' }),
  getTournamentTemplates: () => request<any[]>('/templates/tournaments'),
  saveTournamentTemplate: (data: any) => request<any>('/templates/tournaments', { method: 'POST', body: JSON.stringify(data) }),

  // Statistics
  getLeaderboard: (params?: { year?: string; sort?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.year) qs.set('year', params.year);
    if (params?.sort) qs.set('sort', params.sort);
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return request<any[]>(`/statistics/leaderboard${query ? `?${query}` : ''}`);
  },
  getCompletedTournaments: () => request<any[]>('/statistics/tournaments/completed'),
  getTournamentResults: (id: string) => request<any[]>(`/statistics/tournaments/${id}/results`),
};
