import { Router } from 'express';
import { FinancialService } from '../services/financial.service.js';

export const financialRoutes = Router();

financialRoutes.get('/:tournamentId', (req, res, next) => {
  try {
    const service = new FinancialService(req.app.locals.db);
    const result = service.calculatePrizePool(req.params.tournamentId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

financialRoutes.post('/icm', (req, res, next) => {
  try {
    const { chip_counts, prizes } = req.body;
    const service = new FinancialService(req.app.locals.db);
    const equity = service.calculateICM(chip_counts, prizes);
    res.json({ success: true, data: equity });
  } catch (err) { next(err); }
});
