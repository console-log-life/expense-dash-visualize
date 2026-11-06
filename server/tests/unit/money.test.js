import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toPaise, paiseToString, MAX_PAISE } from '../../src/lib/money.js';

test('converts rupee strings to integer paise', () => {
  assert.equal(toPaise('125'), 12500);
  assert.equal(toPaise('125.5'), 12550);
  assert.equal(toPaise('125.50'), 12550);
  assert.equal(toPaise('0.01'), 1);
  assert.equal(toPaise('1,250.75'), 125075);
  assert.equal(toPaise(99), 9900);
});

test('avoids floating point errors', () => {
  // 1.15 * 100 is 114.99999999999999 in JavaScript.
  assert.equal(toPaise('1.15'), 115);
  assert.equal(toPaise('0.29'), 29);
  // Adding paise is exact, unlike 0.1 + 0.2.
  assert.equal(toPaise('0.1') + toPaise('0.2'), toPaise('0.3'));
});

test('rejects invalid amounts', () => {
  for (const bad of ['', 'abc', '-5', '0', '0.00', '1.234', '1e5', null, undefined, '12.']) {
    assert.equal(toPaise(bad), null, `expected ${bad} to be rejected`);
  }
  assert.equal(toPaise(String(MAX_PAISE / 100 + 1)), null);
});

test('formats paise back to a decimal string', () => {
  assert.equal(paiseToString(12550), '125.50');
  assert.equal(paiseToString(5), '0.05');
  assert.equal(paiseToString(-12550), '-125.50');
});
