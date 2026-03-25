import { Router } from 'express';
import { validate } from '../middleware/validation.js';
import { generateBlindsSchema } from '@poker/shared';
import { generateBlindStructure } from '../services/blindStructure.service.js';

export const blindRoutes = Router();

blindRoutes.post('/generate', validate(generateBlindsSchema), (req, res, next) => {
  try {
    const levels = generateBlindStructure(req.body);
    res.json({ success: true, data: levels });
  } catch (err) { next(err); }
});
