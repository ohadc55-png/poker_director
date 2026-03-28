import { useState, useEffect } from 'react';
import { UserPlus, UserMinus, RefreshCw, Plus, Search, X, DollarSign, Undo2, Crosshair } from 'lucide-react';
import { useTournamentStore } from '../../stores/tournamentStore';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

interface PlayerListProps {
  tournamentId: string;
}

export function PlayerList({ tournamentId }: PlayerListProps) {
  const { tournament, players, registerPlayer, entryPlayer, cancelEntryPlayer, bustPlayer, rebuyPlayer, addonPlayer, removePlayer } = useTournamentStore();
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

  const paidPlayers = players.filter((p) => (p as any).has_entry);
  const waitingPlayers = players.filter((p) => p.status === 'waiting');

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
          שחקנים ({paidPlayers.length} פעילים / {players.length} רשומים)
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
              {paidPlayers
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
              <th className="px-3 py-2 text-center">Entry</th>
              <th className="px-3 py-2 text-center">Rebuy</th>
              <th className="px-3 py-2 text-center">Addon</th>
              {!!tournament?.bounty_amount && <th className="px-3 py-2 text-center">Bounty</th>}
              <th className="px-3 py-2 text-start">סטטוס</th>
              <th className="px-3 py-2 text-center">מקום</th>
              <th className="px-3 py-2 text-end">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((player) => {
              const hasEntry = !!(player as any).has_entry;
              const maxRebuys = tournament?.max_rebuys;
              const rebuyLocked = maxRebuys !== null && maxRebuys !== undefined && player.rebuys >= maxRebuys;
              const canRebuy = !!tournament?.rebuy_amount && !rebuyLocked;
              const canAddon = !!tournament?.addon_amount && player.addons === 0 && player.status !== 'busted';

              return (
                <tr key={player.id} className="border-b border-border/50 hover:bg-accent/50">
                  <td className="px-3 py-2 font-medium">
                    {player.player_name}
                    {player.player_nickname && (
                      <span className="text-muted-foreground ms-1">({player.player_nickname})</span>
                    )}
                  </td>

                  {/* Entry button */}
                  <td className="px-3 py-2 text-center">
                    {hasEntry ? (
                      <button
                        onClick={() => cancelEntryPlayer(tournamentId, player.player_id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-red-500/10 hover:text-red-400 text-xs font-medium transition-colors group"
                        title="ביטול Entry"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="group-hover:hidden">שולם</span>
                        <span className="hidden group-hover:inline">ביטול</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => entryPlayer(tournamentId, player.player_id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground hover:bg-green-500/20 hover:text-green-400 text-xs font-medium transition-colors"
                        title="Entry — תשלום כניסה"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Entry
                      </button>
                    )}
                  </td>

                  {/* Rebuy button */}
                  <td className="px-3 py-2 text-center">
                    {tournament?.rebuy_amount ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => rebuyPlayer(tournamentId, player.player_id)}
                          disabled={!canRebuy}
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                            canRebuy
                              ? 'bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-primary'
                              : 'bg-secondary/50 text-muted-foreground/40 cursor-not-allowed'
                          )}
                          title={rebuyLocked ? `מקסימום ${maxRebuys} ריבאיים` : 'Rebuy'}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          {player.rebuys > 0 ? player.rebuys : ''}
                        </button>
                        {maxRebuys !== null && maxRebuys !== undefined && (
                          <span className="text-[10px] text-muted-foreground">/{maxRebuys}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">-</span>
                    )}
                  </td>

                  {/* Addon button */}
                  <td className="px-3 py-2 text-center">
                    {tournament?.addon_amount ? (
                      player.addons > 0 ? (
                        <span className="text-xs text-green-400 font-medium">✓</span>
                      ) : (
                        <button
                          onClick={() => addonPlayer(tournamentId, player.player_id)}
                          disabled={!canAddon}
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                            canAddon
                              ? 'bg-secondary text-muted-foreground hover:bg-blue-500/20 hover:text-blue-400'
                              : 'bg-secondary/50 text-muted-foreground/40 cursor-not-allowed'
                          )}
                          title="Add-on"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground/40">-</span>
                    )}
                  </td>

                  {/* Bounty */}
                  {!!tournament?.bounty_amount && (
                    <td className="px-3 py-2 text-center">
                      {(player.bounties ?? 0) > 0 ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-500/15 text-orange-400 text-xs font-bold">
                          <Crosshair className="w-3 h-3" />
                          {player.bounties}
                          <span className="text-[10px] font-normal text-orange-400/70">
                            ({((player.bounties ?? 0) * tournament.bounty_amount).toLocaleString()}{tournament.currency})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">0</span>
                      )}
                    </td>
                  )}

                  <td className="px-3 py-2">
                    <StatusBadge status={player.status} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    {player.finish_place ? `#${player.finish_place}` : '-'}
                  </td>
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
              );
            })}
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
  const config: Record<string, { style: string; label: string }> = {
    active: { style: 'bg-green-500/20 text-green-400', label: 'פעיל' },
    registered: { style: 'bg-green-500/20 text-green-400', label: 'פעיל' },
    busted: { style: 'bg-red-500/20 text-red-400', label: 'הודח' },
    waiting: { style: 'bg-yellow-500/20 text-yellow-400', label: 'ממתין' },
  };

  const { style, label } = config[status] || { style: 'bg-secondary', label: status };

  return (
    <span className={cn('text-xs px-2 py-0.5 rounded', style)}>
      {label}
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
  const [mode, setMode] = useState<'search' | 'group'>('search');
  const [name, setName] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [registeringGroup, setRegisteringGroup] = useState(false);
  const { players: registeredPlayers } = useTournamentStore();

  useEffect(() => {
    api.getGroups().then(setGroups).catch(() => {});
  }, []);

  const registeredIds = new Set(registeredPlayers.map((p) => p.player_id));

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

  const handleRegisterGroup = async () => {
    if (!selectedGroup) return;
    setRegisteringGroup(true);
    const unregistered = selectedGroup.members.filter((m: any) => !registeredIds.has(m.player_id));
    for (const member of unregistered) {
      try {
        await onRegister({ player_id: member.player_id });
      } catch {}
    }
    setRegisteringGroup(false);
    setSelectedGroup(null);
  };

  return (
    <div className="p-4 rounded-lg bg-card border border-border space-y-3 animate-slide-in">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
        <button
          onClick={() => setMode('search')}
          className={cn('px-3 py-1.5 rounded text-xs font-medium transition-colors',
            mode === 'search' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          חיפוש שחקן
        </button>
        <button
          onClick={() => setMode('group')}
          className={cn('px-3 py-1.5 rounded text-xs font-medium transition-colors',
            mode === 'group' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          לפי קבוצה
        </button>
      </div>

      {mode === 'search' && (
        <>
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
                    disabled={registeredIds.has(player.id)}
                    className={cn(
                      'w-full text-start px-3 py-2 text-sm flex justify-between',
                      registeredIds.has(player.id) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent'
                    )}
                  >
                    <span>{player.name}</span>
                    {registeredIds.has(player.id)
                      ? <span className="text-xs text-muted-foreground">רשום</span>
                      : player.nickname && <span className="text-muted-foreground">{player.nickname}</span>
                    }
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
        </>
      )}

      {mode === 'group' && (
        <>
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              אין קבוצות. צור קבוצות בעמוד השחקנים.
            </p>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => {
                const unregistered = group.members.filter((m: any) => !registeredIds.has(m.player_id));
                const isSelected = selectedGroup?.id === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(isSelected ? null : group)}
                    className={cn(
                      'w-full text-start p-3 rounded-lg border transition-all',
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-border hover:bg-accent/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
                        <span className="font-medium text-sm">{group.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {unregistered.length} חדשים / {group.member_count} סה"כ
                      </span>
                    </div>
                    {isSelected && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {group.members.map((m: any) => (
                          <span
                            key={m.player_id}
                            className={cn(
                              'text-xs px-2 py-0.5 rounded',
                              registeredIds.has(m.player_id) ? 'bg-muted text-muted-foreground line-through' : 'bg-primary/15 text-primary'
                            )}
                          >
                            {m.player_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex gap-2">
            {selectedGroup && (
              <button
                onClick={handleRegisterGroup}
                disabled={registeringGroup}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50"
              >
                {registeringGroup
                  ? 'רושם...'
                  : `רשום ${selectedGroup.members.filter((m: any) => !registeredIds.has(m.player_id)).length} שחקנים`
                }
              </button>
            )}
            <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-secondary text-sm">ביטול</button>
          </div>
        </>
      )}
    </div>
  );
}
