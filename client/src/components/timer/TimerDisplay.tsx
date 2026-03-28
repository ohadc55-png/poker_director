import { useTimerRAF } from '../../hooks/useTimerRAF';
import { useTimerSounds } from '../../hooks/useTimerSounds';
import { useTimerStore } from '../../stores/timerStore';
import { useTournamentStore } from '../../stores/tournamentStore';
import { formatTime, formatElapsedTime, formatCurrency, cn } from '../../lib/utils';

export function TimerDisplay() {
  const displayMs = useTimerRAF();
  const { currentLevel, isRunning, totalElapsedMs, isBreak, breakName, isFinished } = useTimerStore();
  const { tournament, blinds, players } = useTournamentStore();

  useTimerSounds(displayMs, isRunning);

  const currentBlind = blinds[currentLevel - 1];
  const nextBlind = blinds[currentLevel];
  const totalSeconds = Math.floor(displayMs / 1000);
  const levelDurationMs = currentBlind ? currentBlind.duration_minutes * 60 * 1000 : 0;
  const progressPercent = levelDurationMs > 0 ? ((levelDurationMs - displayMs) / levelDurationMs) * 100 : 0;

  const entries = players.filter((p: any) => p.has_entry).length;
  const activePlayers = players.filter((p) => p.status !== 'busted' && p.status !== 'waiting').length;

  // Timer color based on remaining time
  const timerColor =
    totalSeconds <= 10
      ? 'text-timer-flash animate-flash'
      : totalSeconds <= 30
        ? 'text-timer-red'
        : totalSeconds <= 60
          ? 'text-timer-yellow'
          : 'text-timer-green';

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-4">
      {/* Level info */}
      <div className="text-center">
        {isBreak ? (
          <div className="text-3xl font-bold text-yellow-400">
            {breakName || 'הפסקה'}
          </div>
        ) : (
          <>
            <div className="text-muted-foreground text-lg">
              Level {currentLevel}
            </div>
            {currentBlind && (
              <div className="text-4xl md:text-5xl font-bold text-foreground mt-1">
                {currentBlind.small_blind.toLocaleString()} / {currentBlind.big_blind.toLocaleString()}
                {currentBlind.ante > 0 && (
                  <span className="text-2xl md:text-3xl text-muted-foreground ms-2">
                    Ante {currentBlind.ante.toLocaleString()}
                  </span>
                )}
                {currentBlind.big_blind_ante > 0 && (
                  <span className="text-2xl md:text-3xl text-muted-foreground ms-2">
                    BB Ante {currentBlind.big_blind_ante.toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Main timer */}
      <div className={cn('timer-font text-8xl md:text-[12rem] font-bold leading-none', timerColor)}>
        {isFinished ? 'END' : formatTime(displayMs)}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-2xl h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${Math.min(100, progressPercent)}%` }}
        />
      </div>

      {/* Next level */}
      {nextBlind && !isFinished && (
        <div className="text-center text-muted-foreground">
          <span className="text-sm">Next: </span>
          {nextBlind.is_break ? (
            <span className="text-yellow-400 font-semibold">{nextBlind.break_name || 'Break'}</span>
          ) : (
            <span className="font-semibold">
              {nextBlind.small_blind.toLocaleString()} / {nextBlind.big_blind.toLocaleString()}
              {nextBlind.big_blind_ante > 0 && ` (BB Ante ${nextBlind.big_blind_ante.toLocaleString()})`}
            </span>
          )}
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center mt-4">
        <StatItem
          label="במשחק / כניסות"
          value={`${activePlayers} / ${entries}`}
        />
        <StatItem
          label="זמן שעבר"
          value={formatElapsedTime(totalElapsedMs)}
        />
        <StatItem
          label="Prize Pool"
          value={formatCurrency(tournament?.stats?.prize_pool || 0, tournament?.currency)}
        />
        <StatItem
          label="Avg Stack"
          value={activePlayers > 0 ? (tournament?.stats?.average_stack || 0).toLocaleString() : '-'}
        />
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-xl font-bold text-foreground mt-1">{value}</div>
    </div>
  );
}
