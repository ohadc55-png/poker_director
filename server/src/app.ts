import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { tournamentRoutes } from './routes/tournament.routes.js';
import { playerRoutes } from './routes/player.routes.js';
import { timerRoutes } from './routes/timer.routes.js';
import { blindRoutes } from './routes/blind.routes.js';
import { tableRoutes } from './routes/table.routes.js';
import { financialRoutes } from './routes/financial.routes.js';
import { templateRoutes } from './routes/template.routes.js';
import { statisticsRoutes } from './routes/statistics.routes.js';
import { groupRoutes } from './routes/group.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json());

  // API routes
  app.use('/api/tournaments', tournamentRoutes);
  app.use('/api/players', playerRoutes);
  app.use('/api/timer', timerRoutes);
  app.use('/api/blinds', blindRoutes);
  app.use('/api/tables', tableRoutes);
  app.use('/api/financial', financialRoutes);
  app.use('/api/templates', templateRoutes);
  app.use('/api/statistics', statisticsRoutes);
  app.use('/api/groups', groupRoutes);

  // Serve client in production
  if (config.nodeEnv === 'production') {
    app.use(express.static(config.clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(config.clientDist, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
}
