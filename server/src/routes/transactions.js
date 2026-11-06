import { Router } from 'express';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { validateTransaction, hasErrors } from '../lib/validate.js';
import { isValidMonth, monthRange } from '../lib/dates.js';
import { CATEGORIES, TYPES } from '../lib/categories.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { importTransactions } from '../services/importTransactions.js';

const router = Router();

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function checkId(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Transaction not found');
}

// GET /api/transactions?month=2026-11&category=Travel&type=expense&q=uber&page=1&limit=20
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { month, category, type, q } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));

    // userId is always part of the filter: a user only ever sees their own rows.
    const filter = { userId: req.userId };
    if (month) {
      if (!isValidMonth(month)) throw new HttpError(400, 'month must be YYYY-MM');
      const { start, end } = monthRange(month);
      filter.date = { $gte: start, $lt: end };
    }
    if (category && CATEGORIES.includes(category)) filter.category = category;
    if (type && TYPES.includes(type)) filter.type = type;
    if (typeof q === 'string' && q.trim()) {
      filter.description = { $regex: escapeRegex(q.trim().slice(0, 100)), $options: 'i' };
    }

    const [items, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      items: items.map((t) => t.toPublic()),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { value, errors } = validateTransaction(req.body);
    if (hasErrors(errors)) throw new HttpError(400, 'Please fix the highlighted fields', errors);

    const transaction = await Transaction.create({ ...value, userId: req.userId });
    res.status(201).json({ transaction: transaction.toPublic() });
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    checkId(req.params.id);
    const { value, errors } = validateTransaction(req.body);
    if (hasErrors(errors)) throw new HttpError(400, 'Please fix the highlighted fields', errors);

    // Filtering on both _id and userId means a user cannot edit someone
    // else's transaction even if they guess its id.
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: value },
      { new: true, runValidators: true },
    );
    if (!transaction) throw new HttpError(404, 'Transaction not found');
    res.json({ transaction: transaction.toPublic() });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    checkId(req.params.id);
    const result = await Transaction.deleteOne({ _id: req.params.id, userId: req.userId });
    if (result.deletedCount === 0) throw new HttpError(404, 'Transaction not found');
    res.status(204).end();
  }),
);

// POST /api/transactions/import  { "csv": "date,description,amount,..." }
router.post(
  '/import',
  asyncHandler(async (req, res) => {
    if (typeof req.body?.csv !== 'string' || !req.body.csv.trim()) {
      throw new HttpError(400, 'Send the CSV file contents in the "csv" field');
    }
    const result = await importTransactions(req.userId, req.body.csv);
    res.json(result);
  }),
);

export default router;
