import {
  Play, Pause, Square, Maximize, RefreshCw, PlusCircle, FastForward, DollarSign, Users, UserX,
} from 'lucide-react';
import { useTimerStore } from '../../stores/timerStore';
import { useTournamentStore } from '../../stores/tournamentStore';
import { cn } from '../../lib/utils';

export type PlayerAction = 'rebuy' | 'addon' | null;

interface TimerControlsProps {
  tournamentId: string;
  onPlayerAction?: (action: PlayerAction) => void;
}

export function TimerControls({ tournamentId, onPlayerAction }: TimerControlsProps) {
  const { isRunning, isFinished, start, pause, resume, stop, nextLevel } = useTimerStore();
  const { tournament, players } = useTournamentStore();

  const entries = players.filter((p: any) => p.has_entry).length;
  const activePlayers = players.filter((p) => p.status !== 'busted' && p.status !== 'waiting').length;
  const busted = players.filter((p) => p.status === 'busted').length;
  const totalRebuys = players.reduce((sum, p) => sum + p.rebuys, 0);
  const totalAddons = players.reduce((sum, p) => sum + p.addons, 0);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  return (
    <div className="space-y-5">
      {/* Stats cards */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
        <StatCard icon={<DollarSign className="w-4 h-4" />} label="כניסות" value={entries} color="text-green-400" />
        <StatCard icon={<Users className="w-4 h-4" />} label="במשחק" value={activePlayers} color="text-blue-400" />
        <StatCard icon={<UserX className="w-4 h-4" />} label="הודחו" value={busted} color="text-red-400" />
        <StatCard icon={<RefreshCw className="w-4 h-4" />} label="ריבאיים" value={totalRebuys} color="text-primary" />
        <StatCard icon={<PlusCircle className="w-4 h-4" />} label="אדאונים" value={totalAddons} color="text-blue-400" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 md:gap-4 flex-wrap">
        {/* Play / Pause */}
        <button
          onClick={() => {
            if (isFinished) return;
            if (isRunning) pause(tournamentId);
            else resume(tournamentId);
          }}
          disabled={isFinished}
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg',
            isRunning
              ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground',
            isFinished && 'opacity-50 cursor-not-allowed'
          )}
          title={isRunning ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ms-1" />}
        </button>

        {/* Skip */}
        <ActionButton
          onClick={() => nextLevel(tournamentId)}
          icon={<FastForward className="w-5 h-5" />}
          label="דלג"
          className="text-yellow-400 hover:bg-yellow-500/10 border-yellow-500/20"
        />

        {/* Divider */}
        <div className="w-px h-10 bg-border mx-1 hidden md:block" />

        {/* Rebuy */}
        {tournament?.rebuy_amount && (
          <ActionButton
            onClick={() => onPlayerAction?.('rebuy')}
            icon={<RefreshCw className="w-5 h-5" />}
            label="Rebuy"
            badge={totalRebuys > 0 ? totalRebuys : undefined}
            className="text-primary hover:bg-primary/10 border-primary/20"
          />
        )}

        {/* Add-on */}
        {tournament?.addon_amount && (
          <ActionButton
            onClick={() => onPlayerAction?.('addon')}
            icon={<PlusCircle className="w-5 h-5" />}
            label="Addon"
            badge={totalAddons > 0 ? totalAddons : undefined}
            className="text-blue-400 hover:bg-blue-500/10 border-blue-500/20"
          />
        )}

        {/* Divider */}
        <div className="w-px h-10 bg-border mx-1 hidden md:block" />

        {/* Fullscreen */}
        <ActionButton
          onClick={toggleFullscreen}
          icon={<Maximize className="w-5 h-5" />}
          label="מסך מלא"
          className="text-muted-foreground hover:bg-accent border-border"
        />

        {/* Stop */}
        <ActionButton
          onClick={() => {
            if (confirm('לסיים את הטורניר?')) stop(tournamentId);
          }}
          icon={<Square className="w-5 h-5" />}
          label="סיום"
          className="text-destructive hover:bg-destructive/10 border-destructive/20"
        />
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  icon,
  label,
  badge,
  className,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-secondary/50 border transition-colors min-w-[60px]',
        className
      )}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
      {badge !== undefined && (
        <span className="absolute -top-1.5 -end-1.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-card border border-border">
      <div className={cn('flex-shrink-0', color)}>{icon}</div>
      <div>
        <div className="text-lg font-bold text-foreground leading-tight">{value}</div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
