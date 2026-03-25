import { createServer } from 'http';
import { createApp } from './app.js';
import { config } from './config.js';
import { initDatabase } from './db/connection.js';
import { runMigrations } from './db/migrations/runner.js';
import { setupSocket } from './socket/index.js';
import { TimerService } from './services/timer.service.js';

async function main() {
  // Initialize database (async for sql.js WASM loading)
  const db = await initDatabase(config.dbPath);
  runMigrations(db);

  // Create Express app and HTTP server
  const app = createApp();
  const httpServer = createServer(app);

  // Setup Socket.IO
  const io = setupSocket(httpServer);

  // Initialize timer service (recovers running timers)
  const timerService = TimerService.getInstance();
  timerService.init(db, io);

  // Make db and io available to routes
  app.locals.db = db;
  app.locals.io = io;

  httpServer.listen(config.port, () => {
    console.log(`Poker Director server running on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
