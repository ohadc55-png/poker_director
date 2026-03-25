import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { PlayerWithStats } from '@poker/shared';
import { useSettingsStore } from '../../stores/settingsStore';
import { cn, formatCurrency, getPlayerInitials, computeBadges } from '../../lib/utils';

type SortField = 'name' | 'tournaments_played' | 'total_invested' | 'total_prize_won' | 'net_pnl' | 'best_finish' | 'wins';
type SortDir = 'asc' | 'desc';

interface Props {
  players: PlayerWithStats[];
  onSelect: (id: string) => void;
}

export function PlayerTable({ players, onSelect }: Props) {
  const { locale } = useSettingsStore();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const sorted = useMemo(() => {
    return [...players].sort((a, b) => {
      let va: any = a[sortField];
      let vb: any = b[sortField];
      if (va == null) va = sortDir === 'asc' ? Infinity : -Infinity;
      if (vb == null) vb = sortDir === 'asc' ? Infinity : -Infinity;
      if (typeof va === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
  }, [players, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'name' ? 'asc' : 'desc');
    }
  }

  const columns: { field: SortField; label: string; labelEn: string; align?: string }[] = [
    { field: 'name', label: 'שם', labelEn: 'Name' },
    { field: 'tournaments_played', label: 'טורנירים', labelEn: 'Tournaments', align: 'text-center' },
    { field: 'wins', label: 'ניצחונות', labelEn: 'Wins', align: 'text-center' },
    { field: 'total_invested', label: 'השקעה', labelEn: 'Invested', align: 'text-end' },
    { field: 'total_prize_won', label: 'זכיות', labelEn: 'Won', align: 'text-end' },
    { field: 'net_pnl', label: 'רווח/הפסד', labelEn: 'Net P&L', align: 'text-end' },
    { field: 'best_finish', label: 'מקום הכי טוב', labelEn: 'Best Finish', align: 'text-center' },
  ];

  if (players.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {locale === 'he' ? 'אין שחקנים עדיין' : 'No players yet'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            {columns.map((col) => (
              <th
                key={col.field}
                className={cn(
                  'px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none',
                  col.align
                )}
                onClick={() => toggleSort(col.field)}
              >
                <span className="inline-flex items-center gap-1">
                  {locale === 'he' ? col.label : col.labelEn}
                  {sortField === col.field && (
                    sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </span>
              </th>
            ))}
            <th className="px-4 py-3 font-medium text-muted-foreground text-center">
              {locale === 'he' ? 'תגים' : 'Badges'}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((player) => {
            const badges = computeBadges(player);
            return (
              <tr
                key={player.id}
                onClick={() => onSelect(player.id)}
                className="border-b border-border/50 hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: player.avatar_color || '#6b7280' }}
                    >
                      {getPlayerInitials(player.name)}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{player.name}</div>
                      {player.nickname && (
                        <div className="text-xs text-muted-foreground">{player.nickname}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">{player.tournaments_played}</td>
                <td className="px-4 py-3 text-center">{player.wins}</td>
                <td className="px-4 py-3 text-end">{formatCurrency(player.total_invested)}</td>
                <td className="px-4 py-3 text-end">{formatCurrency(player.total_prize_won)}</td>
                <td className={cn(
                  'px-4 py-3 text-end font-medium',
                  player.net_pnl > 0 ? 'text-primary' : player.net_pnl < 0 ? 'text-destructive' : 'text-muted-foreground'
                )}>
                  {player.net_pnl > 0 ? '+' : ''}{formatCurrency(player.net_pnl)}
                </td>
                <td className="px-4 py-3 text-center">
                  {player.best_finish ?? '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {badges.map((b) => (
                      <span key={b.key} title={locale === 'he' ? b.label : b.labelEn} className="text-base">
                        {b.icon}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
