import { Router } from 'express';
import { validate } from '../middleware/validation.js';
import { createTournamentSchema, updateTournamentSchema } from '@poker/shared';
import { TournamentService } from '../services/tournament.service.js';

export const tournamentRoutes = Router();

tournamentRoutes.post('/', validate(createTournamentSchema), (req, res, next) => {
  try {
    const service = new TournamentService(req.app.locals.db);
    const tournament = service.create(req.body);
    res.status(201).json({ success: true, data: tournament });
  } catch (err) { next(err); }
});

tournamentRoutes.get('/', (req, res, next) => {
  try {
    const service = new TournamentService(req.app.locals.db);
    const tournaments = service.getAll();
    res.json({ success: true, data: tournaments });
  } catch (err) { next(err); }
});

tournamentRoutes.get('/:id', (req, res, next) => {
  try {
    const service = new TournamentService(req.app.locals.db);
    const tournament = service.getFullDetails(req.params.id);
    res.json({ success: true, data: tournament });
  } catch (err) { next(err); }
});

tournamentRoutes.put('/:id', validate(updateTournamentSchema), (req, res, next) => {
  try {
    const service = new TournamentService(req.app.locals.db);
    const tournament = service.update(req.params.id as string, req.body);
    res.json({ success: true, data: tournament });
  } catch (err) { next(err); }
});

tournamentRoutes.delete('/:id', (req, res, next) => {
  try {
    const service = new TournamentService(req.app.locals.db);
    service.delete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Blind levels
tournamentRoutes.get('/:id/blinds', (req, res, next) => {
  try {
    const service = new TournamentService(req.app.locals.db);
    const blinds = service.getBlinds(req.params.id);
    res.json({ success: true, data: blinds });
  } catch (err) { next(err); }
});

tournamentRoutes.put('/:id/blinds', (req, res, next) => {
  try {
    const service = new TournamentService(req.app.locals.db);
    const blinds = service.setBlinds(req.params.id, req.body.levels);
    res.json({ success: true, data: blinds });
  } catch (err) { next(err); }
});

// Chips
tournamentRoutes.get('/:id/chips', (req, res, next) => {
  try {
    const service = new TournamentService(req.app.locals.db);
    const chips = service.getChips(req.params.id);
    res.json({ success: true, data: chips });
  } catch (err) { next(err); }
});

tournamentRoutes.put('/:id/chips', (req, res, next) => {
  try {
    const service = new TournamentService(req.app.locals.db);
    const chips = service.setChips(req.params.id, req.body.chips);
    res.json({ success: true, data: chips });
  } catch (err) { next(err); }
});

// Prizes
tournamentRoutes.get('/:id/prizes', (req, res, next) => {
  try {
    const service = new TournamentService(req.app.locals.db);
    const prizes = service.getPrizes(req.params.id);
    res.json({ success: true, data: prizes });
  } catch (err) { next(err); }
});

tournamentRoutes.put('/:id/prizes', (req, res, next) => {
  try {
    const service = new TournamentService(req.app.locals.db);
    const prizes = service.setPrizes(req.params.id, req.body.prizes);
    res.json({ success: true, data: prizes });
  } catch (err) { next(err); }
});

// Tournament players
tournamentRoutes.get('/:id/players', (req, res, next) => {
  try {
    const service = new TournamentService(req.app.locals.db);
    // Use PlayerService for tournament players
    const { PlayerService } = require('../services/player.service.js');
    const playerService = new PlayerService(req.app.locals.db, req.app.locals.io);
    const players = playerService.getTournamentPlayers(req.params.id);
    res.json({ success: true, data: players });
  } catch (err) { next(err); }
});
