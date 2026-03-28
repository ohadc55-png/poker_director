import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournamentStore } from '../stores/tournamentStore';
import { useTimerStore } from '../stores/timerStore';
import { useSocket } from '../hooks/useSocket';
import { useTimerRAF } from '../hooks/useTimerRAF';
import { useTimerSounds } from '../hooks/useTimerSounds';
import { formatTime, formatElapsedTime, formatCurrency, cn } from '../lib/utils';
import { getSocket } from '../lib/socket';

export function DisplayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournament, blinds, players, loadTournament } = useTournamentStore();
  const [showControls, setShowControls] = useState(false);
  const { currentLevel, isRunning, totalElapsedMs, isBreak, breakName, isFinished } = useTimerStore();
  const displayMs = useTimerRAF();

  useSocket(id);
  useTimerSounds(displayMs, isRunning);

  useEffect(() => {
    if (id) loadTournament(id);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, [id]);

  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (isRunningRef.current) {
          getSocket().emit('timer:pause', { tournament_id: id! });
        } else {
          getSocket().emit('timer:resume', { tournament_id: id! });
        }
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          setShowControls(true);
        }
      }
    };
    // Show controls on mouse move, hide after 3s
    let hideTimer: ReturnType<typeof setTimeout>;
    const handleMouse = () => {
      setShowControls(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('mousemove', handleMouse);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('mousemove', handleMouse);
      clearTimeout(hideTimer);
    };
  }, []);

  const currentBlind = blinds[currentLevel - 1];
  const nextBlind = blinds[currentLevel];
  const totalSeconds = Math.floor(displayMs / 1000);
  const activePlayers = players.filter((p) => p.status === 'active' || p.status === 'registered').length;
  const totalRebuys = players.reduce((sum, p) => sum + p.rebuys, 0);
  const totalAddons = players.reduce((sum, p) => sum + p.addons, 0);

  const timerColor =
    totalSeconds <= 10
      ? 'text-red-500 animate-flash'
      : totalSeconds <= 30
        ? 'text-red-400'
        : totalSeconds <= 60
          ? 'text-yellow-400'
          : 'text-green-400';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-[2vw] relative">
      {/* Exit bar — appears on mouse move or Escape */}
      <div className={cn(
        'fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-3 bg-black/80 backdrop-blur transition-all duration-300',
        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
      )}>
        <span className="text-sm text-white/50">מסך תצוגה</span>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              else document.documentElement.requestFullscreen?.().catch(() => {});
            }}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-white transition-colors"
          >
            {document.fullscreenElement ? 'יציאה ממסך מלא' : 'מסך מלא'}
          </button>
          <button
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
              navigate(`/tournament/${id}`);
            }}
            className="px-4 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-sm text-white transition-colors"
          >
            חזרה לניהול
          </button>
        </div>
      </div>

      {/* Top: Tournament name */}
      <div className="text-center">
        <h1 className="text-[3vw] font-bold text-white/80">{tournament?.name || 'Tournament'}</h1>
      </div>

      {/* Middle: Timer and blinds */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Level info */}
        <div className="text-center mb-[2vh]">
          {isBreak ? (
            <div className="text-[4vw] font-bold text-yellow-400">{breakName || 'BREAK'}</div>
          ) : (
            <>
              <div className="text-[2vw] text-white/50">LEVEL {currentLevel}</div>
              {currentBlind && (
                <div className="text-[5vw] font-bold mt-[1vh]">
                  {currentBlind.small_blind.toLocaleString()} / {currentBlind.big_blind.toLocaleString()}
                  {currentBlind.big_blind_ante > 0 && (
                    <span className="text-[3vw] text-white/60 ms-[1vw]">
                      BB Ante {currentBlind.big_blind_ante.toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Main timer */}
        <div className={cn('timer-font text-[18vw] font-bold leading-none', timerColor)}>
          {isFinished ? 'FINISHED' : formatTime(displayMs)}
        </div>

        {/* Next level */}
        {nextBlind && !isFinished && (
          <div className="text-[2vw] text-white/40 mt-[2vh]">
            Next:{' '}
            {nextBlind.is_break ? (
              <span className="text-yellow-400">{nextBlind.break_name || 'BREAK'}</span>
            ) : (
              <span>
                {nextBlind.small_blind.toLocaleString()} / {nextBlind.big_blind.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom: Stats */}
      <div className="grid grid-cols-5 gap-[2vw] text-center">
        <DisplayStat label="PLAYERS" value={`${activePlayers} / ${players.length}`} />
        <DisplayStat label="ELAPSED" value={formatElapsedTime(totalElapsedMs)} />
        <DisplayStat label="REBUYS" value={totalRebuys.toString()} />
        <DisplayStat label="ADD-ONS" value={totalAddons.toString()} />
        <DisplayStat
          label="PRIZE POOL"
          value={formatCurrency(tournament?.stats?.prize_pool || 0, tournament?.currency)}
          highlight
        />
      </div>

      {/* Avg stack */}
      {activePlayers > 0 && (
        <div className="text-center text-[1.5vw] text-white/30 mt-[1vh]">
          AVG STACK: {(tournament?.stats?.average_stack || 0).toLocaleString()}
        </div>
      )}
    </div>
  );
}

function DisplayStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[1.2vw] text-white/30 uppercase tracking-wider">{label}</div>
      <div className={cn('text-[2.5vw] font-bold mt-[0.5vh]', highlight ? 'text-green-400' : 'text-white')}>
        {value}
      </div>
    </div>
  );
}
