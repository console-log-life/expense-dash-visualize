import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTransaction, validateBudget, hasErrors } from '../../src/lib/validate.js';
import { parseDay, shiftMonth, monthRange, isValidMonth } from '../../src/lib/dates.js';
import { budgetStatus, percentChange } from '../../src/lib/budgetStatus.js';

const good = { type: 'expense', amount: '120.50', date: '2026-11-06', description: ' Lunch ', category: 'Food & Dining' };

test('accepts a valid transaction and trims the description', () => {
  const { value, errors } = validateTransaction(good);
  assert.equal(hasErrors(errors), false);
  assert.equal(value.amountPaise, 12050);
  assert.equal(value.description, 'Lunch');
  assert.equal(value.date.toISOString(), '2026-11-06T00:00:00.000Z');
});

test('reports every invalid field', () => {
  const { errors } = validateTransaction({ type: 'gift', amount: '-1', date: '2026-02-31', description: '', category: 'Pets' });
  assert.deepEqual(Object.keys(errors).sort(), ['amount', 'category', 'date', 'description', 'type']);
});

test('validates budgets', () => {
  assert.equal(hasErrors(validateBudget({ category: 'Travel', amount: '5000', month: '2026-11' }).errors), false);
  assert.deepEqual(Object.keys(validateBudget({ category: 'Travel', amount: '5000', month: '2026-13' }).errors), ['month']);
});

test('date helpers handle real calendar days and month edges', () => {
  assert.equal(parseDay('2026-02-31'), null);
  assert.equal(parseDay('2028-02-29').toISOString().slice(0, 10), '2028-02-29');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(shiftMonth('2026-11', -11), '2025-12');
  assert.equal(monthRange('2026-12').end.toISOString(), '2027-01-01T00:00:00.000Z');
  assert.equal(isValidMonth('2026-00'), false);
});

test('budget status: ok, warning at 80%, exceeded above 100%', () => {
  assert.equal(budgetStatus(10000, 7900).status, 'ok');
  assert.equal(budgetStatus(10000, 8000).status, 'warning');
  assert.equal(budgetStatus(10000, 10000).status, 'warning');
  const over = budgetStatus(10000, 12500);
  assert.equal(over.status, 'exceeded');
  assert.equal(over.remainingPaise, -2500);
  assert.equal(over.percentUsed, 125);
});

test('month-over-month change', () => {
  assert.equal(percentChange(15000, 10000), 50);
  assert.equal(percentChange(5000, 10000), -50);
  assert.equal(percentChange(5000, 0), null);
});
