import mongoose from 'mongoose';
import { CATEGORIES } from '../lib/categories.js';
import { MAX_PAISE } from '../lib/money.js';

const budgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, enum: CATEGORIES, required: true },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    amountPaise: {
      type: Number,
      required: true,
      min: 1,
      max: MAX_PAISE,
      validate: { validator: Number.isInteger, message: 'amountPaise must be a whole number' },
    },
  },
  { timestamps: true },
);

// One budget per category per month for each user. Saving a budget for a
// category that already has one updates it instead of creating a duplicate.
budgetSchema.index({ userId: 1, month: 1, category: 1 }, { unique: true });

budgetSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    category: this.category,
    month: this.month,
    amountPaise: this.amountPaise,
  };
};

export const Budget = mongoose.model('Budget', budgetSchema);
