import { Router } from 'express';
import { TableService } from '../services/table.service.js';

export const tableRoutes = Router();

tableRoutes.post('/:tournamentId', (req, res, next) => {
  try {
    const service = new TableService(req.app.locals.db, req.app.locals.io);
    const { count, max_seats } = req.body;
    const tables = service.createTables(req.params.tournamentId, count || 1, max_seats || 9);
    res.status(201).json({ success: true, data: tables });
  } catch (err) { next(err); }
});

tableRoutes.get('/:tournamentId', (req, res, next) => {
  try {
    const service = new TableService(req.app.locals.db);
    const tables = service.getTables(req.params.tournamentId);
    res.json({ success: true, data: tables });
  } catch (err) { next(err); }
});

tableRoutes.post('/:tournamentId/seat-randomly', (req, res, next) => {
  try {
    const service = new TableService(req.app.locals.db, req.app.locals.io);
    const assignments = service.randomSeat(req.params.tournamentId);
    res.json({ success: true, data: assignments });
  } catch (err) { next(err); }
});

tableRoutes.post('/:tournamentId/balance', (req, res, next) => {
  try {
    const service = new TableService(req.app.locals.db, req.app.locals.io);
    const moves = service.balanceTables(req.params.tournamentId);
    res.json({ success: true, data: moves });
  } catch (err) { next(err); }
});

tableRoutes.post('/:tournamentId/break/:tableId', (req, res, next) => {
  try {
    const service = new TableService(req.app.locals.db, req.app.locals.io);
    service.breakTable(req.params.tournamentId, req.params.tableId);
    res.json({ success: true });
  } catch (err) { next(err); }
});
