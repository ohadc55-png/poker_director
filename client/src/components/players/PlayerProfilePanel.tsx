import * as Dialog from '@radix-ui/react-dialog';
import { X, Crosshair } from 'lucide-react';
import { usePlayersStore } from '../../stores/playersStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { cn, formatCurrency, getPlayerInitials, computeBadges } from '../../lib/utils';

interface Props {
  onClose: () => void;
}

export function PlayerProfilePanel({ onClose }: Props) {
  const { locale } = useSettingsStore();
  const { selectedPlayer, playerHistory, playerRivals } = usePlayersStore();

  if (!selectedPlayer) return null;

  const badges = computeBadges(selectedPlayer);
  const he = locale === 'he';

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed inset-y-0 end-0 w-full max-w-md bg-card border-s border-border shadow-xl overflow-y-auto z-50 animate-slide-in">
          {/* Header */}
          <div className="sticky top-0 bg-card border-b border-border p-4 flex items-start justify-between z-10">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                style={{ backgroundColor: selectedPlayer.avatar_color || '#6b7280' }}
              >
                {getPlayerInitials(selectedPlayer.name)}
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-foreground">
                  {selectedPlayer.name}
                </Dialog.Title>
                {selectedPlayer.nickname && (
                  <p className="text-sm text-muted-foreground">{selectedPlayer.nickname}</p>
                )}
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-4 space-y-6">
            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {badges.map((b) => (
                  <span
                    key={b.key}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-sm"
                  >
                    <span>{b.icon}</span>
                    <span className="text-foreground">{he ? b.label : b.labelEn}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: he ? 'טורנירים' : 'Tournaments', value: selectedPlayer.tournaments_played },
                { label: he ? 'ניצחונות' : 'Wins', value: selectedPlayer.wins },
                { label: he ? 'נוקאאוטים' : 'Knockouts', value: selectedPlayer.knockouts_dealt },
                { label: he ? 'השקעה' : 'Invested', value: formatCurrency(selectedPlayer.total_invested) },
                { label: he ? 'זכיות' : 'Won', value: formatCurrency(selectedPlayer.total_prize_won) },
                {
                  label: he ? 'רווח/הפסד' : 'Net P&L',
                  value: `${selectedPlayer.net_pnl > 0 ? '+' : ''}${formatCurrency(selectedPlayer.net_pnl)}`,
                  color: selectedPlayer.net_pnl > 0 ? 'text-primary' : selectedPlayer.net_pnl < 0 ? 'text-destructive' : undefined,
                },
              ].map((stat, i) => (
                <div key={i} className="bg-secondary/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                  <div className={cn('text-sm font-bold', (stat as any).color || 'text-foreground')}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Tournament History */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {he ? 'היסטוריית טורנירים' : 'Tournament History'}
              </h3>
              {playerHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">{he ? 'אין היסטוריה' : 'No history'}</p>
              ) : (
                <div className="space-y-2">
                  {playerHistory.map((h, i) => {
                    const bountyEarnings = (h.bounties_in_tournament || 0) * (h.bounty_amount || 0);
                    return (
                      <div
                        key={i}
                        className={cn(
                          'rounded-lg border border-border/50 p-3 space-y-2',
                          h.net_result > 0 && 'border-primary/20 bg-primary/5',
                          h.net_result < 0 && 'border-destructive/20 bg-destructive/5'
                        )}
                      >
                        {/* Tournament name + date */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm text-foreground">{h.tournament_name}</div>
                            <div className="text-xs text-muted-foreground">{h.tournament_date}</div>
                          </div>
                          {h.finish_place && (
                            <span className={cn(
                              'text-lg font-bold',
                              h.finish_place === 1 && 'text-yellow-500',
                              h.finish_place === 2 && 'text-gray-400',
                              h.finish_place === 3 && 'text-amber-700',
                              h.finish_place > 3 && 'text-muted-foreground'
                            )}>
                              #{h.finish_place}
                            </span>
                          )}
                        </div>

                        {/* Details row */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          {h.rebuys > 0 && (
                            <span className="text-muted-foreground">Rebuys: <span className="text-foreground font-medium">{h.rebuys}</span></span>
                          )}
                          {h.addons > 0 && (
                            <span className="text-muted-foreground">Addons: <span className="text-foreground font-medium">{h.addons}</span></span>
                          )}
                          <span className="text-muted-foreground">{he ? 'השקעה' : 'Invested'}: <span className="text-foreground font-medium">{formatCurrency(h.total_invested, h.currency)}</span></span>
                          {h.prize_won > 0 && (
                            <span className="text-muted-foreground">{he ? 'פרס' : 'Prize'}: <span className="text-primary font-medium">{formatCurrency(h.prize_won, h.currency)}</span></span>
                          )}
                        </div>

                        {/* Knocked out by + bounties */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          {h.knocked_out_by_name && (
                            <span className="text-muted-foreground">
                              {he ? 'הודח ע"י' : 'Knocked out by'}: <span className="text-destructive font-medium">{h.knocked_out_by_name}</span>
                            </span>
                          )}
                          {h.bounties_in_tournament > 0 && (
                            <span className="inline-flex items-center gap-1 text-orange-400">
                              <Crosshair className="w-3 h-3" />
                              {h.bounties_in_tournament} {he ? 'הדחות' : 'bounties'}
                              {bountyEarnings > 0 && (
                                <span className="font-medium">({formatCurrency(bountyEarnings, h.currency)})</span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Net result */}
                        <div className={cn(
                          'text-sm font-bold text-end',
                          h.net_result > 0 ? 'text-primary' : h.net_result < 0 ? 'text-destructive' : 'text-muted-foreground'
                        )}>
                          {h.net_result > 0 ? '+' : ''}{formatCurrency(h.net_result, h.currency)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rivals */}
            {playerRivals && (playerRivals.knocked_out_by.length > 0 || playerRivals.knocked_out.length > 0) && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  {he ? 'יריבויות' : 'Rivalries'}
                </h3>
                <div className="space-y-4">
                  {/* Knocked out BY */}
                  {playerRivals.knocked_out_by.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {he ? 'הוציא אותי:' : 'Eliminated me:'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {playerRivals.knocked_out_by.slice(0, 3).map((r) => (
                          <div key={r.player_id} className="flex items-center gap-2 bg-secondary/50 rounded-full px-3 py-1.5">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ backgroundColor: r.avatar_color || '#6b7280' }}
                            >
                              {getPlayerInitials(r.player_name)}
                            </div>
                            <span className="text-xs text-foreground">{r.player_name}</span>
                            <span className="text-xs font-bold text-destructive">x{r.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* I knocked out */}
                  {playerRivals.knocked_out.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {he ? 'הוצאתי:' : 'I eliminated:'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {playerRivals.knocked_out.slice(0, 3).map((r) => (
                          <div key={r.player_id} className="flex items-center gap-2 bg-secondary/50 rounded-full px-3 py-1.5">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ backgroundColor: r.avatar_color || '#6b7280' }}
                            >
                              {getPlayerInitials(r.player_name)}
                            </div>
                            <span className="text-xs text-foreground">{r.player_name}</span>
                            <span className="text-xs font-bold text-primary">x{r.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Info */}
            {(selectedPlayer.phone || selectedPlayer.email) && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {he ? 'פרטי קשר' : 'Contact'}
                </h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {selectedPlayer.phone && <p>{selectedPlayer.phone}</p>}
                  {selectedPlayer.email && <p>{selectedPlayer.email}</p>}
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
