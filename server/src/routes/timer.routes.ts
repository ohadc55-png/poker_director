import { Router } from 'express';
import { TimerService } from '../services/timer.service.js';

export const timerRoutes = Router();

timerRoutes.get('/:tournamentId', (req, res, next) => {
  try {
    const service = TimerService.getInstance();
    const state = service.getState(req.params.tournamentId);
    res.json({ success: true, data: state });
  } catch (err) { next(err); }
});

timerRoutes.post('/:tournamentId/start', (req, res, next) => {
  try {
    const service = TimerService.getInstance();
    const state = service.start(req.params.tournamentId);
    res.json({ success: true, data: state });
  } catch (err) { next(err); }
});

timerRoutes.post('/:tournamentId/pause', (req, res, next) => {
  try {
    const service = TimerService.getInstance();
    const state = service.pause(req.params.tournamentId);
    res.json({ success: true, data: state });
  } catch (err) { next(err); }
});

timerRoutes.post('/:tournamentId/resume', (req, res, next) => {
  try {
    const service = TimerService.getInstance();
    const state = service.resume(req.params.tournamentId);
    res.json({ success: true, data: state });
  } catch (err) { next(err); }
});

timerRoutes.post('/:tournamentId/stop', (req, res, next) => {
  try {
    const service = TimerService.getInstance();
    const state = service.stop(req.params.tournamentId);
    res.json({ success: true, data: state });
  } catch (err) { next(err); }
});

timerRoutes.post('/:tournamentId/next-level', (req, res, next) => {
  try {
    const service = TimerService.getInstance();
    const state = service.nextLevel(req.params.tournamentId);
    res.json({ success: true, data: state });
  } catch (err) { next(err); }
});

timerRoutes.post('/:tournamentId/prev-level', (req, res, next) => {
  try {
    const service = TimerService.getInstance();
    const state = service.prevLevel(req.params.tournamentId);
    res.json({ success: true, data: state });
  } catch (err) { next(err); }
});

timerRoutes.post('/:tournamentId/add-time', (req, res, next) => {
  try {
    const service = TimerService.getInstance();
    const { seconds } = req.body;
    const state = service.addTime(req.params.tournamentId, seconds || 60);
    res.json({ success: true, data: state });
  } catch (err) { next(err); }
});
