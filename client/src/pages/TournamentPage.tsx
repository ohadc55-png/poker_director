import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Timer, LayoutGrid, Users, Trophy, Coins, Monitor, Crosshair, Settings } from 'lucide-react';
import { useTournamentStore } from '../stores/tournamentStore';
import { useSocket } from '../hooks/useSocket';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { TimerDisplay } from '../components/timer/TimerDisplay';
import { TimerControls, type PlayerAction } from '../components/timer/TimerControls';
import { PlayerActionModal } from '../components/timer/PlayerActionModal';
import { BlindStructureEditor } from '../components/blinds/BlindStructureEditor';
import { PlayerList } from '../components/players/PlayerList';
import { PayoutEditor } from '../components/payouts/PayoutEditor';
import { ChipSetup } from '../components/chips/ChipSetup';
import { TableLayout } from '../components/tables/TableLayout';
import { BountyBoard } from '../components/players/BountyBoard';
import { TournamentSettings } from '../components/tournament/TournamentSettings';
import { cn } from '../lib/utils';

export function TournamentPage() {
  const { id } = useParams<{ id: string }>();
  const { tournament, loadTournament, loading, error } = useTournamentStore();
  const [activeTab, setActiveTab] = useState('timer');
  const [playerAction, setPlayerAction] = useState<PlayerAction>(null);

  const tabs = [
    { key: 'timer', icon: Timer, label: 'שעון' },
    { key: 'blinds', icon: LayoutGrid, label: 'בליינדים' },
    { key: 'players', icon: Users, label: 'שחקנים' },
    ...(tournament?.bounty_amount ? [{ key: 'bounty', icon: Crosshair, label: 'באונטי' }] : []),
    { key: 'prizes', icon: Trophy, label: 'פרסים' },
    { key: 'tables', icon: LayoutGrid, label: 'שולחנות' },
    { key: 'chips', icon: Coins, label: "צ'יפים" },
    { key: 'settings', icon: Settings, label: 'הגדרות' },
  ];

  useSocket(id);
  useKeyboardShortcuts(id);

  useEffect(() => {
    if (id) loadTournament(id);
  }, [id]);

  if (loading && !tournament) {
    return <div className="p-6 text-center text-muted-foreground">טוען טורניר...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-destructive">{error}</div>;
  }

  if (!tournament || !id) {
    return <div className="p-6 text-center text-muted-foreground">טורניר לא נמצא</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div>
          <h1 className="text-lg font-bold">{tournament.name}</h1>
          <p className="text-xs text-muted-foreground">
            {tournament.game_type}
            {tournament.bounty_amount ? ` | Bounty ${tournament.currency}${tournament.bounty_amount}` : ''}
            {' | '}{new Date(tournament.date).toLocaleDateString('he-IL')}
            {tournament.location && ` | ${tournament.location}`}
          </p>
        </div>
        <Link
          to={`/display/${id}`}
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-accent text-sm"
        >
          <Monitor className="w-4 h-4" />
          מסך תצוגה
        </Link>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card overflow-x-auto">
        {tabs.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors whitespace-nowrap',
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {activeTab === 'timer' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <TimerDisplay />
            <TimerControls tournamentId={id} onPlayerAction={setPlayerAction} />
            <div className="text-center text-xs text-muted-foreground mt-4">
              Space = Play/Pause | ← → = Change Level | F = Fullscreen
            </div>
          </div>
        )}
        {activeTab === 'blinds' && <BlindStructureEditor tournamentId={id} />}
        {activeTab === 'players' && <PlayerList tournamentId={id} />}
        {activeTab === 'bounty' && <BountyBoard tournamentId={id} />}
        {activeTab === 'prizes' && <PayoutEditor tournamentId={id} />}
        {activeTab === 'tables' && <TableLayout tournamentId={id} />}
        {activeTab === 'chips' && <ChipSetup tournamentId={id} />}
        {activeTab === 'settings' && <TournamentSettings tournamentId={id} />}
      </div>

      {/* Rebuy / Add-on Modal */}
      {playerAction && (
        <PlayerActionModal
          tournamentId={id}
          action={playerAction}
          onClose={() => setPlayerAction(null)}
        />
      )}
    </div>
  );
}
