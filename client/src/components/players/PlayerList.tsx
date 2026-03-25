import { useState } from 'react';
import { UserPlus, UserMinus, RefreshCw, Plus, Search, X } from 'lucide-react';
import { useTournamentStore } from '../../stores/tournamentStore';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

interface PlayerListProps {
  tournamentId: string;
}

export function PlayerList({ tournamentId }: PlayerListProps) {
  const { tournament, players, registerPlayer, bustPlayer, rebuyPlayer, addonPlayer, removePlayer } = useTournamentStore();
  const [showRegister, setShowRegister] = useState(false);
  const [search, setSearch] = useState('');
  const [bustingPlayerId, setBustingPlayerId] = useState<string | null>(null);
  const [knockedOutBy, setKnockedOutBy] = useState('');

  const filtered = search
    ? players.filter((p) =>
        p.player_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.player_nickname?.toLowerCase().includes(search.toLowerCase())
      )
    : players;

  const activePlayers = players.filter((p) => p.status === 'active' || p.status === 'registered');

  function handleBustClick(playerId: string) {
    setBustingPlayerId(playerId);
    setKnockedOutBy('');
  }

  async function confirmBust() {
    if (!bustingPlayerId) return;
    await bustPlayer(tournamentId, bustingPlayerId, knockedOutBy || undefined);
    setBustingPlayerId(null);
    setKnockedOutBy('');
  }

  function cancelBust() {
    setBustingPlayerId(null);
    setKnockedOutBy('');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          שחקנים ({activePlayers.length} פעילים / {players.length} רשומים)
        </h2>
        <button
          onClick={() => setShowRegister(!showRegister)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
        >
          <UserPlus className="w-4 h-4" />
          הוסף שחקן
        </button>
      </div>

      {showRegister && (
        <RegisterForm
          tournamentId={tournamentId}
          onRegister={async (data) => {
            await registerPlayer(tournamentId, data);
            setShowRegister(false);
          }}
          onCancel={() => setShowRegister(false)}
        />
      )}

      {/* Bust confirmation with knockout selection */}
      {bustingPlayerId && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 space-y-3">
          <p className="text-sm font-medium text-foreground">
            הוצאת שחקן: <strong>{players.find((p) => p.player_id === bustingPlayerId)?.player_name}</strong>
          </p>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">הוצא ע&quot;י (אופציונלי):</label>
            <select
              value={knockedOutBy}
              onChange={(e) => setKnockedOutBy(e.target.value)}
              className="w-full bg-secondary border border-border rounded px-3 py-1.5 text-sm"
            >
              <option value="">-- בחר שחקן --</option>
              {activePlayers
                .filter((p) => p.player_id !== bustingPlayerId)
                .map((p) => (
                  <option key={p.player_id} value={p.player_id}>
                    {p.player_name}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={confirmBust}
              className="px-4 py-1.5 rounded bg-destructive text-destructive-foreground text-sm hover:bg-destructive/90"
            >
              אשר הוצאה
            </button>
            <button
              onClick={cancelBust}
              className="px-4 py-1.5 rounded bg-secondary text-sm"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="חיפוש שחקן..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-secondary border border-border rounded-lg ps-10 pe-3 py-2 text-sm"
        />
      </div>

      {/* Player table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-3 py-2 text-start">שם</th>
              <th className="px-3 py-2 text-start">סטטוס</th>
              <th className="px-3 py-2 text-center">שולחן</th>
              <th className="px-3 py-2 text-center">מקום</th>
              <th className="px-3 py-2 text-center">Rebuys</th>
              <th className="px-3 py-2 text-center">Addons</th>
              <th className="px-3 py-2 text-end">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((player) => (
              <tr key={player.id} className="border-b border-border/50 hover:bg-accent/50">
                <td className="px-3 py-2 font-medium">
                  {player.player_name}
                  {player.player_nickname && (
                    <span className="text-muted-foreground ms-1">({player.player_nickname})</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={player.status} />
                </td>
                <td className="px-3 py-2 text-center text-muted-foreground">
                  {player.seat_number ? `${player.seat_number}` : '-'}
                </td>
                <td className="px-3 py-2 text-center">
                  {player.finish_place ? `#${player.finish_place}` : '-'}
                </td>
                <td className="px-3 py-2 text-center">{player.rebuys}</td>
                <td className="px-3 py-2 text-center">{player.addons}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    {(player.status === 'active' || player.status === 'registered') && (
                      <button
                        onClick={() => handleBustClick(player.player_id)}
                        className="px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs"
                        title="Bust Out"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {tournament?.rebuy_amount && (player.status === 'active' || player.status === 'busted') && (
                      <button
                        onClick={() => rebuyPlayer(tournamentId, player.player_id)}
                        className="px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 text-xs"
                        title="Rebuy"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {tournament?.addon_amount && player.addons === 0 && player.status !== 'busted' && (
                      <button
                        onClick={() => addonPlayer(tournamentId, player.player_id)}
                        className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs"
                        title="Add-on"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('הסר שחקן מהטורניר?')) removePlayer(tournamentId, player.player_id);
                      }}
                      className="px-2 py-1 rounded text-muted-foreground hover:text-destructive text-xs"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">אין שחקנים להצגה</p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    registered: 'bg-blue-500/20 text-blue-400',
    busted: 'bg-red-500/20 text-red-400',
    waiting: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <span className={cn('text-xs px-2 py-0.5 rounded', styles[status] || 'bg-secondary')}>
      {status}
    </span>
  );
}

function RegisterForm({
  tournamentId,
  onRegister,
  onCancel,
}: {
  tournamentId: string;
  onRegister: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setName(query);
    if (query.length >= 2) {
      setSearching(true);
      try {
        const results = await api.getPlayers(query);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="p-4 rounded-lg bg-card border border-border space-y-3">
      <h3 className="font-semibold">רישום שחקן</h3>
      <div className="relative">
        <input
          type="text"
          placeholder="שם שחקן (חפש או צור חדש)..."
          value={name}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm"
          autoFocus
        />
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-auto">
            {searchResults.map((player) => (
              <button
                key={player.id}
                onClick={() => onRegister({ player_id: player.id })}
                className="w-full text-start px-3 py-2 hover:bg-accent text-sm flex justify-between"
              >
                <span>{player.name}</span>
                {player.nickname && <span className="text-muted-foreground">{player.nickname}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => name.trim() && onRegister({ name: name.trim() })}
          disabled={!name.trim()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50"
        >
          רשום שחקן חדש
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-secondary text-sm">ביטול</button>
      </div>
    </div>
  );
}
