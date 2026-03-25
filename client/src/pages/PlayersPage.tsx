import { useEffect, useState, useMemo } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { usePlayersStore } from '../stores/playersStore';
import { useSettingsStore } from '../stores/settingsStore';
import { PlayerTable } from '../components/players/PlayerTable';
import { PlayerProfilePanel } from '../components/players/PlayerProfilePanel';
import { AddPlayerModal } from '../components/players/AddPlayerModal';

export function PlayersPage() {
  const { locale } = useSettingsStore();
  const { players, loading, loadPlayers, selectPlayer, selectedPlayer, clearSelection } = usePlayersStore();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const filtered = useMemo(() => {
    if (!search) return players;
    const q = search.toLowerCase();
    return players.filter(
      (p) => p.name.toLowerCase().includes(q) || p.nickname?.toLowerCase().includes(q)
    );
  }, [players, search]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {locale === 'he' ? 'שחקנים' : 'Players'}
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" />
          {locale === 'he' ? 'הוסף שחקן' : 'Add Player'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={locale === 'he' ? 'חיפוש שחקן...' : 'Search player...'}
          className="w-full ps-10 pe-4 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
        />
      </div>

      {/* Table */}
      {loading && players.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {locale === 'he' ? 'טוען...' : 'Loading...'}
        </div>
      ) : (
        <PlayerTable players={filtered} onSelect={selectPlayer} />
      )}

      {/* Profile Panel */}
      {selectedPlayer && (
        <PlayerProfilePanel onClose={clearSelection} />
      )}

      {/* Add Player Modal */}
      {showAddModal && (
        <AddPlayerModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
