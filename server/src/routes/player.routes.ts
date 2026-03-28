import { Router } from 'express';
import { validate } from '../middleware/validation.js';
import { createPlayerSchema, registerPlayerSchema, updatePlayerSchema } from '@poker/shared';
import { PlayerService } from '../services/player.service.js';

export const playerRoutes = Router();

// Global player database
playerRoutes.get('/', (req, res, next) => {
  try {
    const service = new PlayerService(req.app.locals.db);
    const query = req.query.search as string;
    const players = query ? service.searchPlayers(query) : service.getAllPlayers();
    res.json({ success: true, data: players });
  } catch (err) { next(err); }
});

playerRoutes.post('/', validate(createPlayerSchema), (req, res, next) => {
  try {
    const service = new PlayerService(req.app.locals.db);
    const player = service.createPlayer(req.body);
    res.status(201).json({ success: true, data: player });
  } catch (err) { next(err); }
});

playerRoutes.get('/:id', (req, res, next) => {
  try {
    const service = new PlayerService(req.app.locals.db);
    const player = service.getPlayer(req.params.id);
    res.json({ success: true, data: player });
  } catch (err) { next(err); }
});

playerRoutes.put('/:id', validate(updatePlayerSchema), (req, res, next) => {
  try {
    const service = new PlayerService(req.app.locals.db);
    const player = service.updatePlayer(req.params.id as string, req.body);
    res.json({ success: true, data: player });
  } catch (err) { next(err); }
});

playerRoutes.get('/:id/stats', (req, res, next) => {
  try {
    const service = new PlayerService(req.app.locals.db);
    const stats = service.getPlayerStats(req.params.id);
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

playerRoutes.get('/:id/history', (req, res, next) => {
  try {
    const service = new PlayerService(req.app.locals.db);
    const history = service.getPlayerHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (err) { next(err); }
});

playerRoutes.get('/:id/rivals', (req, res, next) => {
  try {
    const service = new PlayerService(req.app.locals.db);
    const rivals = service.getPlayerRivals(req.params.id);
    res.json({ success: true, data: rivals });
  } catch (err) { next(err); }
});

// Tournament player operations
playerRoutes.post('/tournaments/:tournamentId/register', validate(registerPlayerSchema), (req, res, next) => {
  try {
    const service = new PlayerService(req.app.locals.db, req.app.locals.io);
    const tp = service.registerToTournament(req.params.tournamentId as string, req.body);
    res.status(201).json({ success: true, data: tp });
  } catch (err) { next(err); }
});

playerRoutes.post('/tournaments/:tournamentId/:playerId/entry', (req, res, next) => {
  try {
    const service = new PlayerService(req.app.locals.db, req.app.locals.io);
    const tp = service.entry(req.params.tournamentId, req.params.playerId);
    res.json({ success: true, data: tp });
  } catch (err) { next(err); }
});

playerRoutes.post('/tournaments/:tournamentId/:playerId/cancel-entry', (req, res, next) => {
  try {
    const service = new PlayerService(req.app.locals.db, req.app.locals.io);
    const tp = service.cancelEntry(req.params.tournamentId, req.params.playerId);
    res.json({ success: true, data: tp });
  } catch (err) { next(err); }
});

playerRoutes.post('/tournaments/:tournamentId/:playerId/bust', (req, res, next) => {
  try {
    const service = new PlayerService(req.app.locals.db, req.app.locals.io);
    const knockedOutBy = req.body?.knocked_out_by_player_id;
    const tp = service.bustOut(req.params.tournamentId, req.params.playerId, knockedOutBy);
    res.json({ success: true, data: tp });
  } catch (err) { next(err); }
});

playerRoutes.post('/tournaments/:tournamentId/:playerId/rebuy', (req, res, next) => {
  try {
    const service = new PlayerService(req.app.locals.db, req.app.locals.io);
    const tp = service.rebuy(req.params.tournamentId, req.params.playerId);
    res.json({ success: true, data: tp });
  } catch (err) { next(err); }
});

playerRoutes.post('/tournaments/:tournamentId/:playerId/addon', (req, res, next) => {
  try {
    const service = new PlayerService(req.app.locals.db, req.app.locals.io);
    const tp = service.addon(req.params.tournamentId, req.params.playerId);
    res.json({ success: true, data: tp });
  } catch (err) { next(err); }
});

playerRoutes.delete('/tournaments/:tournamentId/:playerId', (req, res, next) => {
  try {
    const service = new PlayerService(req.app.locals.db, req.app.locals.io);
    service.removeFromTournament(req.params.tournamentId, req.params.playerId);
    res.json({ success: true });
  } catch (err) { next(err); }
});
