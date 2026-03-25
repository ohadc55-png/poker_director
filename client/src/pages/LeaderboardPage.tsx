import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { api } from '../lib/api';
import { cn, formatCurrency, getPlayerInitials, computeBadges } from '../lib/utils';

type SortMode = 'wins' | 'profit' | 'played' | 'knockouts';

const currentYear = new Date().getFullYear().toString();

export function LeaderboardPage() {
  const { locale } = useSettingsStore();
  const he = locale === 'he';

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>('profit');
  const [year, setYear] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    api
      .getLeaderboard({ sort, year: year || undefined })
      .then(setLeaderboard)
      .catch(() => setLeaderboard([]))
      .finally(() => setLoading(false));
  }, [sort, year]);

  const sortOptions: { value: SortMode; label: string; labelEn: string }[] = [
    { value: 'profit', label: 'רווח נטו', labelEn: 'Net Profit' },
    { value: 'wins', label: 'ניצחונות', labelEn: 'Wins' },
    { value: 'played', label: 'טורנירים', labelEn: 'Tournaments' },
    { value: 'knockouts', label: 'נוקאאוטים', labelEn: 'Knockouts' },
  ];

  // Generate year options from current year back to 2020
  const yearOptions: string[] = [];
  for (let y = parseInt(currentYear); y >= 2020; y--) {
    yearOptions.push(String(y));
  }

  const medalColors: Record<number, string> = {
    0: 'border-s-4 border-s-yellow-500',
    1: 'border-s-4 border-s-gray-400',
    2: 'border-s-4 border-s-amber-700',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">
          {he ? 'טבלת דירוג' : 'Leaderboard'}
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Sort Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-border">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium transition-colors',
                sort === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              {he ? opt.label : opt.labelEn}
            </button>
          ))}
        </div>

        {/* Year Filter */}
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">{he ? 'כל הזמנים' : 'All Time'}</option>
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          {he ? 'טוען...' : 'Loading...'}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {he ? 'אין נתונים' : 'No data'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-center font-medium text-muted-foreground w-12">#</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">{he ? 'שחקן' : 'Player'}</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">{he ? 'טורנירים' : 'Played'}</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">{he ? 'ניצחונות' : 'Wins'}</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">ITM</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">KO</th>
                <th className="px-4 py-3 text-end font-medium text-muted-foreground">{he ? 'השקעה' : 'Invested'}</th>
                <th className="px-4 py-3 text-end font-medium text-muted-foreground">{he ? 'זכיות' : 'Won'}</th>
                <th className="px-4 py-3 text-end font-medium text-muted-foreground">{he ? 'רווח/הפסד' : 'Net P&L'}</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => {
                const badges = computeBadges(entry);
                return (
                  <tr
                    key={entry.player_id}
                    className={cn(
                      'border-b border-border/50 transition-colors',
                      medalColors[idx] || ''
                    )}
                  >
                    <td className="px-4 py-3 text-center font-bold text-muted-foreground">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: entry.avatar_color || '#6b7280' }}
                        >
                          {getPlayerInitials(entry.player_name)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{entry.player_name}</span>
                          {badges.length > 0 && (
                            <span className="text-xs">
                              {badges.map((b) => b.icon).join('')}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{entry.tournaments_played}</td>
                    <td className="px-4 py-3 text-center font-medium">{entry.wins}</td>
                    <td className="px-4 py-3 text-center">{entry.itm_count}</td>
                    <td className="px-4 py-3 text-center">{entry.knockouts_dealt}</td>
                    <td className="px-4 py-3 text-end">{formatCurrency(entry.total_invested)}</td>
                    <td className="px-4 py-3 text-end">{formatCurrency(entry.total_prize_won)}</td>
                    <td className={cn(
                      'px-4 py-3 text-end font-bold',
                      entry.net_pnl > 0 ? 'text-primary' : entry.net_pnl < 0 ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      {entry.net_pnl > 0 ? '+' : ''}{formatCurrency(entry.net_pnl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
