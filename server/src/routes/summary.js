import { Router } from 'express';
import { isValidMonth, currentMonth } from '../lib/dates.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { buildSummary } from '../services/summary.js';

const router = Router();

// GET /api/summary?month=2026-11
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const month = req.query.month || currentMonth();
    if (!isValidMonth(month)) throw new HttpError(400, 'month must be YYYY-MM');
    res.json(await buildSummary(req.userId, month));
  }),
);

export default router;
