import { Router } from 'express';
import mongoose from 'mongoose';
import { Budget } from '../models/Budget.js';
import { validateBudget, hasErrors } from '../lib/validate.js';
import { isValidMonth } from '../lib/dates.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';

const router = Router();

// GET /api/budgets?month=2026-11
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = { userId: req.userId };
    if (req.query.month) {
      if (!isValidMonth(req.query.month)) throw new HttpError(400, 'month must be YYYY-MM');
      filter.month = req.query.month;
    }
    const budgets = await Budget.find(filter).sort({ month: -1, category: 1 });
    res.json({ items: budgets.map((b) => b.toPublic()) });
  }),
);

// PUT /api/budgets  { category, month, amount }
// Creates the budget, or updates it if this category already has one for
// that month. One atomic "upsert" call, so two quick saves cannot create two
// budgets for the same category (the unique index also guarantees this).
router.put(
  '/',
  asyncHandler(async (req, res) => {
    const { value, errors } = validateBudget(req.body);
    if (hasErrors(errors)) throw new HttpError(400, 'Please fix the highlighted fields', errors);

    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId, month: value.month, category: value.category },
      { $set: { amountPaise: value.amountPaise } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    res.json({ budget: budget.toPublic() });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Budget not found');
    const result = await Budget.deleteOne({ _id: req.params.id, userId: req.userId });
    if (result.deletedCount === 0) throw new HttpError(404, 'Budget not found');
    res.status(204).end();
  }),
);

export default router;
