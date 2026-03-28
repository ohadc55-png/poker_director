import { Crosshair, Trophy } from 'lucide-react';
import { useTournamentStore } from '../../stores/tournamentStore';
import { cn, formatCurrency } from '../../lib/utils';

interface BountyBoardProps {
  tournamentId: string;
}

export function BountyBoard({ tournamentId }: BountyBoardProps) {
  const { tournament, players } = useTournamentStore();
  const bountyAmount = tournament?.bounty_amount || 0;

  // Sort by bounties descending
  const ranked = [...players]
    .map((p) => ({
      ...p,
      bountyCount: (p as any).bounties ?? 0,
      bountyTotal: ((p as any).bounties ?? 0) * bountyAmount,
    }))
    .sort((a, b) => b.bountyCount - a.bountyCount);

  const totalBounties = ranked.reduce((sum, p) => sum + p.bountyCount, 0);
  const totalBountyPaid = totalBounties * bountyAmount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-orange-400" />
          Bounty Board
        </h2>
        <div className="text-sm text-muted-foreground">
          באונטי לראש: <span className="text-orange-400 font-bold">{formatCurrency(bountyAmount, tournament?.currency)}</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <SummaryCard label="סה״כ באונטי" value={totalBounties.toString()} sub="הדחות" />
        <SummaryCard label="סה״כ שולם" value={formatCurrency(totalBountyPaid, tournament?.currency)} sub="באונטי" />
        <SummaryCard label="באונטי לראש" value={formatCurrency(bountyAmount, tournament?.currency)} sub="פר הדחה" />
      </div>

      {/* Leaderboard */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-card border-b border-border text-muted-foreground">
              <th className="px-4 py-3 text-start w-12">#</th>
              <th className="px-4 py-3 text-start">שחקן</th>
              <th className="px-4 py-3 text-center">הדחות</th>
              <th className="px-4 py-3 text-center">סה״כ באונטי</th>
              <th className="px-4 py-3 text-start">סטטוס</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((player, index) => (
              <tr
                key={player.id}
                className={cn(
                  'border-b border-border/50 transition-colors',
                  index === 0 && player.bountyCount > 0 && 'bg-orange-500/5',
                  player.status === 'busted' && 'opacity-60'
                )}
              >
                <td className="px-4 py-3 font-bold text-muted-foreground">
                  {index === 0 && player.bountyCount > 0 ? (
                    <Trophy className="w-4 h-4 text-orange-400" />
                  ) : (
                    index + 1
                  )}
                </td>
                <td className="px-4 py-3 font-medium">
                  {player.player_name}
                  {player.player_nickname && (
                    <span className="text-muted-foreground ms-1">({player.player_nickname})</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {player.bountyCount > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/15 text-orange-400 font-bold text-sm">
                      <Crosshair className="w-3.5 h-3.5" />
                      {player.bountyCount}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center font-semibold">
                  {player.bountyTotal > 0 ? (
                    <span className="text-orange-400">
                      {formatCurrency(player.bountyTotal, tournament?.currency)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded',
                    player.status === 'busted' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                  )}>
                    {player.status === 'busted' ? 'הודח' : 'פעיל'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalBounties === 0 && (
        <p className="text-center text-muted-foreground py-4">
          עדיין לא בוצעו הדחות בטורניר
        </p>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
