import { Transaction } from '../models/Transaction.js';
import { csvToRecords } from '../lib/csv.js';
import { validateTransaction, hasErrors } from '../lib/validate.js';
import { importHash } from '../lib/importHash.js';
import { CATEGORIES } from '../lib/categories.js';
import { HttpError } from '../middleware/errors.js';

export const MAX_IMPORT_ROWS = 2000;

// Indian bank statements usually write dates as DD/MM/YYYY or DD-MM-YYYY.
// Converts those to YYYY-MM-DD; leaves YYYY-MM-DD as it is.
export function normaliseDate(text) {
  const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
  if (!match) return text;
  const [, d, m, y] = match;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function matchCategory(text) {
  const lower = (text || '').toLowerCase();
  return CATEGORIES.find((c) => c.toLowerCase() === lower) || 'Other';
}

// Turns one CSV record into the same shape the "add transaction" form sends.
// If there is no `type` column, a negative amount means an expense.
export function recordToBody(record) {
  let amount = (record.amount || '').replace(/[₹\s]/g, '');
  let type = (record.type || '').toLowerCase();

  if (!type) {
    type = amount.startsWith('-') ? 'expense' : 'income';
  }
  if (type === 'debit') type = 'expense';
  if (type === 'credit') type = 'income';
  amount = amount.replace(/^[-+]/, '');

  return {
    date: normaliseDate(record.date || ''),
    description: record.description,
    amount,
    type,
    category: matchCategory(record.category),
  };
}

// Validates every row, skips rows already imported, and saves the rest.
// Returns counts so the user can see exactly what happened to their file.
export async function importTransactions(userId, csvText) {
  const { records, missingColumns } = csvToRecords(csvText);

  if (missingColumns.length > 0) {
    throw new HttpError(400, `CSV is missing columns: ${missingColumns.join(', ')}`);
  }
  if (records.length === 0) throw new HttpError(400, 'CSV has no rows');
  if (records.length > MAX_IMPORT_ROWS) {
    throw new HttpError(400, `CSV can have at most ${MAX_IMPORT_ROWS} rows`);
  }

  const errors = [];
  const docs = [];
  const seenInFile = new Map(); // fingerprint without occurrence -> times seen

  for (const record of records) {
    const { value, errors: rowErrors } = validateTransaction(recordToBody(record));
    if (hasErrors(rowErrors)) {
      errors.push({ row: record.row, message: Object.values(rowErrors).join('; ') });
      continue;
    }

    const baseKey = importHash(value, 0);
    const occurrence = (seenInFile.get(baseKey) || 0) + 1;
    seenInFile.set(baseKey, occurrence);

    docs.push({ ...value, userId, importHash: importHash(value, occurrence) });
  }

  // Skip rows whose fingerprint is already saved for this user.
  const hashes = docs.map((d) => d.importHash);
  const existing = new Set(
    await Transaction.find({ userId, importHash: { $in: hashes } }).distinct('importHash'),
  );
  const fresh = docs.filter((d) => !existing.has(d.importHash));
  let duplicates = docs.length - fresh.length;
  let imported = 0;

  if (fresh.length > 0) {
    try {
      const saved = await Transaction.insertMany(fresh, { ordered: false });
      imported = saved.length;
    } catch (err) {
      // Two uploads of the same file at the same moment can both pass the
      // check above. The unique index still rejects the second copy; count
      // those rejections as duplicates instead of failing the whole import.
      const writeErrors = err.writeErrors || [];
      if (writeErrors.length === 0 || writeErrors.some((e) => (e.code ?? e.err?.code) !== 11000)) {
        throw err;
      }
      duplicates += writeErrors.length;
      imported = fresh.length - writeErrors.length;
    }
  }

  return { imported, duplicates, failed: errors.length, errors: errors.slice(0, 50) };
}
