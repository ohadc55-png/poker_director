import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import type { ClientToServerEvents, ServerToClientEvents } from '@poker/shared';
import { TimerService } from '../services/timer.service.js';

export function setupSocket(httpServer: HttpServer): SocketServer<ClientToServerEvents, ServerToClientEvents> {
  const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('tournament:join', ({ tournament_id }) => {
      socket.join(`tournament:${tournament_id}`);
      console.log(`Client ${socket.id} joined tournament ${tournament_id}`);

      // Send current timer state
      const timerService = TimerService.getInstance();
      const state = timerService.getState(tournament_id);
      if (state) {
        socket.emit('timer:tick', {
          tournament_id,
          remaining_ms: state.time_remaining_ms,
          current_level: state.current_level,
          is_running: !!state.is_running,
          total_elapsed_ms: state.total_elapsed_ms,
          server_timestamp: Date.now(),
        });
      }
    });

    socket.on('tournament:leave', ({ tournament_id }) => {
      socket.leave(`tournament:${tournament_id}`);
    });

    // Timer controls
    socket.on('timer:start', ({ tournament_id }) => {
      const timerService = TimerService.getInstance();
      timerService.start(tournament_id);
    });

    socket.on('timer:pause', ({ tournament_id }) => {
      const timerService = TimerService.getInstance();
      timerService.pause(tournament_id);
    });

    socket.on('timer:resume', ({ tournament_id }) => {
      const timerService = TimerService.getInstance();
      timerService.resume(tournament_id);
    });

    socket.on('timer:stop', ({ tournament_id }) => {
      const timerService = TimerService.getInstance();
      timerService.stop(tournament_id);
    });

    socket.on('timer:nextLevel', ({ tournament_id }) => {
      const timerService = TimerService.getInstance();
      timerService.nextLevel(tournament_id);
    });

    socket.on('timer:prevLevel', ({ tournament_id }) => {
      const timerService = TimerService.getInstance();
      timerService.prevLevel(tournament_id);
    });

    socket.on('timer:setLevel', ({ tournament_id, level }) => {
      const timerService = TimerService.getInstance();
      timerService.setLevel(tournament_id, level);
    });

    socket.on('timer:addTime', ({ tournament_id, seconds }) => {
      const timerService = TimerService.getInstance();
      timerService.addTime(tournament_id, seconds);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
