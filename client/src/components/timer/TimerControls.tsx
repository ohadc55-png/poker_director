import {
  Play, Pause, Square, Maximize, RefreshCw, PlusCircle, FastForward,
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
  const { tournament } = useTournamentStore();

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
      {/* Play / Pause */}
      <button
        onClick={() => {
          if (isFinished) return;
          if (isRunning) pause(tournamentId);
          else resume(tournamentId);
        }}
        disabled={isFinished}
        className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center transition-all',
          isRunning
            ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
            : 'bg-primary hover:bg-primary/90 text-primary-foreground',
          isFinished && 'opacity-50 cursor-not-allowed'
        )}
        title={isRunning ? 'Pause (Space)' : 'Play (Space)'}
      >
        {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ms-1" />}
      </button>

      {/* Skip to next level/break */}
      <ControlButton
        onClick={() => nextLevel(tournamentId)}
        title="דלג לשלב הבא (→)"
        className="text-yellow-400 hover:bg-yellow-500/10"
      >
        <FastForward className="w-4 h-4" />
        <span className="text-xs">דלג</span>
      </ControlButton>

      {/* Divider */}
      <div className="w-px h-8 bg-border mx-2 hidden md:block" />

      {/* Rebuy */}
      {tournament?.rebuy_amount && (
        <ControlButton
          onClick={() => onPlayerAction?.('rebuy')}
          title="Rebuy"
          className="text-primary hover:bg-primary/10"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-xs">Rebuy</span>
        </ControlButton>
      )}

      {/* Add-on */}
      {tournament?.addon_amount && (
        <ControlButton
          onClick={() => onPlayerAction?.('addon')}
          title="Add-on"
          className="text-blue-400 hover:bg-blue-500/10"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="text-xs">Addon</span>
        </ControlButton>
      )}

      {/* Divider */}
      <div className="w-px h-8 bg-border mx-2 hidden md:block" />

      {/* Fullscreen */}
      <ControlButton onClick={toggleFullscreen} title="Fullscreen (F)">
        <Maximize className="w-5 h-5" />
      </ControlButton>

      {/* Stop / End Tournament */}
      <ControlButton
        onClick={() => {
          if (confirm('לסיים את הטורניר?')) {
            stop(tournamentId);
          }
        }}
        title="סיום טורניר"
        className="text-destructive hover:bg-destructive/10"
      >
        <Square className="w-5 h-5" />
      </ControlButton>
    </div>
  );
}

function ControlButton({
  onClick,
  title,
  children,
  className,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'w-10 h-10 md:w-12 md:h-12 rounded-lg bg-secondary hover:bg-accent flex items-center justify-center gap-1 transition-colors text-foreground',
        className
      )}
    >
      {children}
    </button>
  );
}
