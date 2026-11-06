import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, csvToRecords } from '../../src/lib/csv.js';
import { recordToBody, normaliseDate } from '../../src/services/importTransactions.js';
import { importHash } from '../../src/lib/importHash.js';
import { parseDay } from '../../src/lib/dates.js';

test('parses quoted fields, escaped quotes and CRLF line endings', () => {
  const rows = parseCsv('a,b\r\n"Amazon, Inc.","He said ""hi"""\r\n\r\nx,y');
  assert.deepEqual(rows, [
    ['a', 'b'],
    ['Amazon, Inc.', 'He said "hi"'],
    ['x', 'y'],
  ]);
});

test('maps rows to records by header and reports missing columns', () => {
  const { records, missingColumns } = csvToRecords('﻿Date,Description,Amount\n2026-11-01,Tea,20');
  assert.deepEqual(missingColumns, []);
  assert.deepEqual(records, [{ row: 2, date: '2026-11-01', description: 'Tea', amount: '20' }]);

  assert.deepEqual(csvToRecords('date,amount\n').missingColumns, ['description']);
});

test('reads signed amounts, debit/credit and Indian date formats', () => {
  assert.deepEqual(recordToBody({ date: '06/11/2026', description: 'Uber', amount: '-250.00' }), {
    date: '2026-11-06',
    description: 'Uber',
    amount: '250.00',
    type: 'expense',
    category: 'Other',
  });
  const credit = recordToBody({ date: '2026-11-01', description: 'Pay', amount: '₹50,000', type: 'Credit', category: 'salary' });
  assert.equal(credit.type, 'income');
  assert.equal(credit.amount, '50,000');
  assert.equal(credit.category, 'Salary');
  assert.equal(normaliseDate('1-2-2026'), '2026-02-01');
});

test('import fingerprint ignores formatting but separates repeated rows', () => {
  const base = { date: parseDay('2026-11-06'), amountPaise: 2000, type: 'expense' };
  const a = importHash({ ...base, description: 'Chai  Point' }, 1);
  const b = importHash({ ...base, description: 'chai point' }, 1);
  const second = importHash({ ...base, description: 'chai point' }, 2);
  assert.equal(a, b);
  assert.notEqual(a, second);
});
