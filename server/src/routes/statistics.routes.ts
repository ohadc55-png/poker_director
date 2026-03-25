import { Router } from 'express';
import { StatisticsService } from '../services/statistics.service.js';

export const statisticsRoutes = Router();

statisticsRoutes.get('/leaderboard', (req, res, next) => {
  try {
    const service = new StatisticsService(req.app.locals.db);
    const limit = parseInt(req.query.limit as string) || 50;
    const year = req.query.year as string | undefined;
    const sort = req.query.sort as string | undefined;
    const leaderboard = service.getLeaderboard(limit, year, sort);
    res.json({ success: true, data: leaderboard });
  } catch (err) { next(err); }
});

statisticsRoutes.get('/tournaments/completed', (req, res, next) => {
  try {
    const service = new StatisticsService(req.app.locals.db);
    const tournaments = service.getCompletedTournaments();
    res.json({ success: true, data: tournaments });
  } catch (err) { next(err); }
});

statisticsRoutes.get('/tournaments/:id/results', (req, res, next) => {
  try {
    const service = new StatisticsService(req.app.locals.db);
    const results = service.getTournamentResults(req.params.id);
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});
