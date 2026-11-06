import mongoose from 'mongoose';
import { CATEGORIES, TYPES } from '../lib/categories.js';
import { MAX_PAISE } from '../lib/money.js';
import { toDay } from '../lib/dates.js';

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: TYPES, required: true },
    // Always positive; `type` says whether it is money in or out.
    amountPaise: {
      type: Number,
      required: true,
      min: 1,
      max: MAX_PAISE,
      validate: { validator: Number.isInteger, message: 'amountPaise must be a whole number' },
    },
    category: { type: String, enum: CATEGORIES, required: true },
    description: { type: String, required: true, trim: true, maxlength: 200 },
    date: { type: Date, required: true },
    // Set only for rows that came from a CSV import (see lib/importHash.js).
    importHash: { type: String },
  },
  { timestamps: true },
);

// The dashboard always asks for one user's transactions, newest first, often
// within a date range. This compound index serves exactly that query.
transactionSchema.index({ userId: 1, date: -1 });

// Blocks the same imported row from being saved twice. Partial, so manually
// added transactions (which have no importHash) are not affected.
transactionSchema.index(
  { userId: 1, importHash: 1 },
  { unique: true, partialFilterExpression: { importHash: { $type: 'string' } } },
);

transactionSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    type: this.type,
    amountPaise: this.amountPaise,
    category: this.category,
    description: this.description,
    date: toDay(this.date),
    imported: Boolean(this.importHash),
  };
};

export const Transaction = mongoose.model('Transaction', transactionSchema);
