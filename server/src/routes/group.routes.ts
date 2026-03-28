import { Router } from 'express';
import { GroupRepo } from '../repositories/group.repo.js';

export const groupRoutes = Router();

// CRUD
groupRoutes.get('/', (req, res, next) => {
  try {
    const repo = new GroupRepo(req.app.locals.db);
    res.json({ success: true, data: repo.getAll() });
  } catch (err) { next(err); }
});

groupRoutes.post('/', (req, res, next) => {
  try {
    const repo = new GroupRepo(req.app.locals.db);
    const group = repo.create(req.body);
    res.status(201).json({ success: true, data: group });
  } catch (err) { next(err); }
});

groupRoutes.get('/:id', (req, res, next) => {
  try {
    const repo = new GroupRepo(req.app.locals.db);
    const group = repo.getById(req.params.id);
    if (!group) { res.status(404).json({ success: false, error: 'Group not found' }); return; }
    res.json({ success: true, data: group });
  } catch (err) { next(err); }
});

groupRoutes.put('/:id', (req, res, next) => {
  try {
    const repo = new GroupRepo(req.app.locals.db);
    const group = repo.update(req.params.id, req.body);
    res.json({ success: true, data: group });
  } catch (err) { next(err); }
});

groupRoutes.delete('/:id', (req, res, next) => {
  try {
    const repo = new GroupRepo(req.app.locals.db);
    repo.delete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Members
groupRoutes.post('/:id/members', (req, res, next) => {
  try {
    const repo = new GroupRepo(req.app.locals.db);
    const { player_ids } = req.body;
    if (Array.isArray(player_ids)) {
      repo.addMembers(req.params.id, player_ids);
    } else if (req.body.player_id) {
      repo.addMember(req.params.id, req.body.player_id);
    }
    const group = repo.getById(req.params.id);
    res.json({ success: true, data: group });
  } catch (err) { next(err); }
});

groupRoutes.delete('/:id/members/:playerId', (req, res, next) => {
  try {
    const repo = new GroupRepo(req.app.locals.db);
    repo.removeMember(req.params.id, req.params.playerId);
    const group = repo.getById(req.params.id);
    res.json({ success: true, data: group });
  } catch (err) { next(err); }
});

// Get groups for a specific player
groupRoutes.get('/player/:playerId', (req, res, next) => {
  try {
    const repo = new GroupRepo(req.app.locals.db);
    const groups = repo.getPlayerGroups(req.params.playerId);
    res.json({ success: true, data: groups });
  } catch (err) { next(err); }
});
