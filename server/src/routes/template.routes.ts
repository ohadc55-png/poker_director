import { Router } from 'express';
import { TemplateRepo } from '../repositories/template.repo.js';

export const templateRoutes = Router();

// Blind templates
templateRoutes.get('/blinds', (req, res, next) => {
  try {
    const repo = new TemplateRepo(req.app.locals.db);
    res.json({ success: true, data: repo.getBlindTemplates() });
  } catch (err) { next(err); }
});

templateRoutes.post('/blinds', (req, res, next) => {
  try {
    const repo = new TemplateRepo(req.app.locals.db);
    const template = repo.createBlindTemplate(req.body);
    res.status(201).json({ success: true, data: template });
  } catch (err) { next(err); }
});

templateRoutes.get('/blinds/:id', (req, res, next) => {
  try {
    const repo = new TemplateRepo(req.app.locals.db);
    const template = repo.getBlindTemplate(req.params.id);
    res.json({ success: true, data: template });
  } catch (err) { next(err); }
});

templateRoutes.delete('/blinds/:id', (req, res, next) => {
  try {
    const repo = new TemplateRepo(req.app.locals.db);
    repo.deleteBlindTemplate(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Tournament templates
templateRoutes.get('/tournaments', (req, res, next) => {
  try {
    const repo = new TemplateRepo(req.app.locals.db);
    res.json({ success: true, data: repo.getTournamentTemplates() });
  } catch (err) { next(err); }
});

templateRoutes.post('/tournaments', (req, res, next) => {
  try {
    const repo = new TemplateRepo(req.app.locals.db);
    const template = repo.createTournamentTemplate(req.body);
    res.status(201).json({ success: true, data: template });
  } catch (err) { next(err); }
});

templateRoutes.delete('/tournaments/:id', (req, res, next) => {
  try {
    const repo = new TemplateRepo(req.app.locals.db);
    repo.deleteTournamentTemplate(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});
