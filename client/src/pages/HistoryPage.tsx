import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';

export function HistoryPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [tab, setTab] = useState<'history' | 'leaderboard'>('history');

  useEffect(() => {
    api.getCompletedTournaments().then(setTournaments).catch(() => {});
    api.getLeaderboard().then(setLeaderboard).catch(() => {});
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">היסטוריה וסטטיסטיקות</h1>

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2 text-sm border-b-2 ${tab === 'history' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
        >
          ארכיון טורנירים
        </button>
        <button
          onClick={() => setTab('leaderboard')}
          className={`px-4 py-2 text-sm border-b-2 ${tab === 'leaderboard' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
        >
          Leaderboard
        </button>
      </div>

      {tab === 'history' && (
        <div className="space-y-3">
          {tournaments.map((t: any) => (
            <Link
              key={t.id}
              to={`/tournament/${t.id}`}
              className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/50"
            >
              <div>
                <h3 className="font-semibold">{t.name}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(t.date).toLocaleDateString('he-IL')}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {t.total_players} שחקנים</span>
                  <span>Rebuys: {t.total_rebuys || 0}</span>
                </div>
              </div>
              <div className="text-primary font-semibold">
                {formatCurrency(t.total_players * t.buy_in_amount + (t.total_rebuys || 0) * (t.rebuy_amount || 0), t.currency)}
              </div>
            </Link>
          ))}
          {tournaments.length === 0 && <p className="text-center text-muted-foreground py-8">אין טורנירים שהושלמו</p>}
        </div>
      )}

      {tab === 'leaderboard' && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-3 py-2 text-start">#</th>
              <th className="px-3 py-2 text-start">שחקן</th>
              <th className="px-3 py-2 text-center">טורנירים</th>
              <th className="px-3 py-2 text-center">ניצחונות</th>
              <th className="px-3 py-2 text-center">ITM</th>
              <th className="px-3 py-2 text-center">מקום הטוב ביותר</th>
              <th className="px-3 py-2 text-center">ממוצע</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((p: any, i: number) => (
              <tr key={p.player_id} className="border-b border-border/50 hover:bg-accent/50">
                <td className="px-3 py-2 font-medium">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </td>
                <td className="px-3 py-2 font-medium">{p.player_name}</td>
                <td className="px-3 py-2 text-center">{p.tournaments_played}</td>
                <td className="px-3 py-2 text-center text-primary font-semibold">{p.wins}</td>
                <td className="px-3 py-2 text-center">{p.itm_count}</td>
                <td className="px-3 py-2 text-center">{p.best_finish || '-'}</td>
                <td className="px-3 py-2 text-center">{p.avg_finish || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {tab === 'leaderboard' && leaderboard.length === 0 && (
        <p className="text-center text-muted-foreground py-8">אין נתונים עדיין</p>
      )}
    </div>
  );
}
