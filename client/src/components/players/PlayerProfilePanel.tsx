import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
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
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50">
                        <th className="px-2 py-2 text-start font-medium text-muted-foreground">{he ? 'טורניר' : 'Tournament'}</th>
                        <th className="px-2 py-2 text-center font-medium text-muted-foreground">{he ? 'מקום' : 'Place'}</th>
                        <th className="px-2 py-2 text-center font-medium text-muted-foreground">R</th>
                        <th className="px-2 py-2 text-center font-medium text-muted-foreground">A</th>
                        <th className="px-2 py-2 text-end font-medium text-muted-foreground">{he ? 'רווח/הפסד' : 'Net'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerHistory.map((h, i) => (
                        <tr
                          key={i}
                          className={cn(
                            'border-b border-border/30',
                            h.net_result > 0 && 'bg-primary/5',
                            h.net_result < 0 && 'bg-destructive/5'
                          )}
                        >
                          <td className="px-2 py-2">
                            <div className="font-medium text-foreground truncate max-w-[140px]">{h.tournament_name}</div>
                            <div className="text-muted-foreground">{h.tournament_date}</div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            {h.finish_place ? (
                              <span className={cn(
                                'font-bold',
                                h.finish_place === 1 && 'text-yellow-500',
                                h.finish_place === 2 && 'text-gray-400',
                                h.finish_place === 3 && 'text-amber-700'
                              )}>
                                #{h.finish_place}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center text-muted-foreground">{h.rebuys}</td>
                          <td className="px-2 py-2 text-center text-muted-foreground">{h.addons}</td>
                          <td className={cn(
                            'px-2 py-2 text-end font-medium',
                            h.net_result > 0 ? 'text-primary' : h.net_result < 0 ? 'text-destructive' : 'text-muted-foreground'
                          )}>
                            {h.net_result > 0 ? '+' : ''}{formatCurrency(h.net_result)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
