import { useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket';
import { useTimerStore } from '../stores/timerStore';
import { useTournamentStore } from '../stores/tournamentStore';

export function useSocket(tournamentId: string | undefined) {
  const onTick = useTimerStore((s) => s.onTick);
  const onLevelChanged = useTimerStore((s) => s.onLevelChanged);
  const onStateChanged = useTimerStore((s) => s.onStateChanged);
  const onFinished = useTimerStore((s) => s.onFinished);
  const updatePlayers = useTournamentStore((s) => s.updatePlayers);
  const updatePrizePool = useTournamentStore((s) => s.updatePrizePool);
  const joined = useRef<string | null>(null);

  useEffect(() => {
    if (!tournamentId) return;

    const socket = getSocket();

    // Join tournament room
    if (joined.current !== tournamentId) {
      if (joined.current) {
        socket.emit('tournament:leave', { tournament_id: joined.current });
      }
      socket.emit('tournament:join', { tournament_id: tournamentId });
      joined.current = tournamentId;
    }

    // Set up event listeners
    socket.on('timer:tick', onTick);
    socket.on('timer:levelChanged', onLevelChanged);
    socket.on('timer:stateChanged', onStateChanged);
    socket.on('timer:finished', onFinished);
    socket.on('players:updated', (data) => {
      if (data.tournament_id === tournamentId) {
        updatePlayers(data.players);
      }
    });
    socket.on('prizePool:updated', (data) => {
      if (data.tournament_id === tournamentId) {
        updatePrizePool(data.total);
      }
    });

    return () => {
      socket.off('timer:tick', onTick);
      socket.off('timer:levelChanged', onLevelChanged);
      socket.off('timer:stateChanged', onStateChanged);
      socket.off('timer:finished', onFinished);
      socket.off('players:updated');
      socket.off('prizePool:updated');
    };
  }, [tournamentId, onTick, onLevelChanged, onStateChanged, onFinished, updatePlayers, updatePrizePool]);
}
