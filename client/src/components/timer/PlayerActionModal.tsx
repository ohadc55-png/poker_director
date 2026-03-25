import { useState } from 'react';
import { X, RefreshCw, PlusCircle, Search, Check } from 'lucide-react';
import { useTournamentStore } from '../../stores/tournamentStore';
import { cn } from '../../lib/utils';
import type { PlayerAction } from './TimerControls';

interface PlayerActionModalProps {
  tournamentId: string;
  action: 'rebuy' | 'addon';
  onClose: () => void;
}

export function PlayerActionModal({ tournamentId, action, onClose }: PlayerActionModalProps) {
  const { tournament, players, rebuyPlayer, addonPlayer } = useTournamentStore();
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  const isRebuy = action === 'rebuy';

  // Filter eligible players
  const eligible = players.filter((p) => {
    if (isRebuy) return p.status === 'active' || p.status === 'busted';
    return p.addons === 0 && p.status !== 'busted';
  });

  const filtered = search
    ? eligible.filter((p) =>
        p.player_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.player_nickname?.toLowerCase().includes(search.toLowerCase())
      )
    : eligible;

  const handleClick = async (playerId: string) => {
    setProcessing(playerId);
    try {
      if (isRebuy) {
        await rebuyPlayer(tournamentId, playerId);
      } else {
        await addonPlayer(tournamentId, playerId);
      }
      setDoneIds((prev) => new Set(prev).add(playerId));
    } catch (err: any) {
      alert(err.message);
    }
    setProcessing(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-5 py-4 border-b border-border rounded-t-xl',
          isRebuy ? 'bg-primary/5' : 'bg-blue-500/5'
        )}>
          <div className="flex items-center gap-3">
            {isRebuy
              ? <RefreshCw className="w-5 h-5 text-primary" />
              : <PlusCircle className="w-5 h-5 text-blue-400" />
            }
            <div>
              <h2 className="font-bold text-lg">{isRebuy ? 'Rebuy' : 'Add-on'}</h2>
              <p className="text-xs text-muted-foreground">
                {isRebuy
                  ? `₪${tournament?.rebuy_amount} → ${(tournament?.rebuy_chips || 0).toLocaleString()} chips`
                  : `₪${tournament?.addon_amount} → ${(tournament?.addon_chips || 0).toLocaleString()} chips`
                }
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="חיפוש שחקן..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg ps-10 pe-3 py-2.5 text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Player list */}
        <div className="flex-1 overflow-auto px-4 py-3 space-y-1.5">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-6 text-sm">
              {eligible.length === 0 ? 'אין שחקנים זכאים' : 'לא נמצאו תוצאות'}
            </p>
          )}
          {filtered.map((player) => {
            const isDone = doneIds.has(player.player_id);
            const isLoading = processing === player.player_id;

            return (
              <button
                key={player.id}
                onClick={() => !isDone && handleClick(player.player_id)}
                disabled={isDone || isLoading}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-lg text-start transition-all',
                  isDone
                    ? 'bg-primary/10 border border-primary/30'
                    : 'bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border active:scale-[0.98]',
                  isLoading && 'opacity-70'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold',
                    isDone
                      ? 'bg-primary/20 text-primary'
                      : player.status === 'busted'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-accent text-foreground'
                  )}>
                    {isDone ? <Check className="w-4 h-4" /> : player.player_name?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{player.player_name}</div>
                    <div className="text-xs text-muted-foreground flex gap-2">
                      <span>{player.status === 'busted' ? 'הודח' : 'פעיל'}</span>
                      {player.rebuys > 0 && <span>Rebuys: {player.rebuys}</span>}
                      {player.addons > 0 && <span>Addon: {player.addons}</span>}
                    </div>
                  </div>
                </div>
                <div>
                  {isDone ? (
                    <span className="text-xs text-primary font-semibold">בוצע</span>
                  ) : (
                    <span className={cn(
                      'text-xs px-3 py-1.5 rounded-lg font-medium',
                      isRebuy ? 'bg-primary/15 text-primary' : 'bg-blue-500/15 text-blue-400'
                    )}>
                      {isRebuy ? 'Rebuy' : 'Add-on'}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>{eligible.length} שחקנים זכאים</span>
          {doneIds.size > 0 && (
            <span className="text-primary font-medium">{doneIds.size} בוצעו</span>
          )}
        </div>
      </div>
    </div>
  );
}
