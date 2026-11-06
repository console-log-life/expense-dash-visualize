// End-to-end API tests against a real (in-memory) MongoDB.
// mongodb-memory-server downloads a MongoDB binary the first time it runs.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'api-test-secret';
const { createApp } = await import('../../src/app.js');

let mongo;
let app;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await mongoose.syncIndexes();
  app = createApp();
});

after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

let userCount = 0;
async function newUser() {
  userCount += 1;
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: `User ${userCount}`, email: `user${userCount}@example.com`, password: 'password123' });
  assert.equal(res.status, 201);
  return { token: res.body.token, auth: { Authorization: `Bearer ${res.body.token}` } };
}

function addTx(auth, overrides = {}) {
  return request(app)
    .post('/api/transactions')
    .set(auth)
    .send({
      type: 'expense',
      amount: '100',
      date: '2026-11-05',
      description: 'Groceries',
      category: 'Food & Dining',
      ...overrides,
    });
}

test('register, login and fetch the current user', async () => {
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Asha', email: 'Asha@Example.com', password: 'password123' });
  assert.equal(reg.status, 201);
  assert.equal(reg.body.user.email, 'asha@example.com');
  assert.equal(reg.body.user.passwordHash, undefined);

  const dup = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Asha', email: 'asha@example.com', password: 'password123' });
  assert.equal(dup.status, 409);

  const wrong = await request(app).post('/api/auth/login').send({ email: 'asha@example.com', password: 'wrongpass1' });
  const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'password123' });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(wrong.body.error, unknown.body.error); // no hint whether the email exists

  const login = await request(app).post('/api/auth/login').send({ email: 'asha@example.com', password: 'password123' });
  assert.equal(login.status, 200);
  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`);
  assert.equal(me.body.user.name, 'Asha');
});

test('creates, lists, updates and deletes transactions with exact paise amounts', async () => {
  const { auth } = await newUser();

  const created = await addTx(auth, { amount: '1.15' });
  assert.equal(created.status, 201);
  assert.equal(created.body.transaction.amountPaise, 115);
  assert.equal(created.body.transaction.date, '2026-11-05');
  const id = created.body.transaction.id;

  const bad = await addTx(auth, { amount: '12.345', category: 'Pets' });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.details.amount);
  assert.ok(bad.body.details.category);

  const updated = await request(app)
    .put(`/api/transactions/${id}`)
    .set(auth)
    .send({ type: 'expense', amount: '200', date: '2026-11-06', description: 'Vegetables', category: 'Food & Dining' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.transaction.amountPaise, 20000);

  const list = await request(app).get('/api/transactions?month=2026-11&q=veg').set(auth);
  assert.equal(list.body.total, 1);
  assert.equal(list.body.items[0].description, 'Vegetables');

  const del = await request(app).delete(`/api/transactions/${id}`).set(auth);
  assert.equal(del.status, 204);
  const again = await request(app).delete(`/api/transactions/${id}`).set(auth);
  assert.equal(again.status, 404);
});

test('a user cannot read, edit or delete another user\'s data', async () => {
  const alice = await newUser();
  const bob = await newUser();

  const tx = await addTx(alice.auth, { description: 'Alice rent', category: 'Housing' });
  const id = tx.body.transaction.id;

  const bobList = await request(app).get('/api/transactions').set(bob.auth);
  assert.equal(bobList.body.total, 0);

  const bobEdit = await request(app)
    .put(`/api/transactions/${id}`)
    .set(bob.auth)
    .send({ type: 'expense', amount: '1', date: '2026-11-05', description: 'hacked', category: 'Other' });
  assert.equal(bobEdit.status, 404);

  const bobDelete = await request(app).delete(`/api/transactions/${id}`).set(bob.auth);
  assert.equal(bobDelete.status, 404);

  const aliceList = await request(app).get('/api/transactions').set(alice.auth);
  assert.equal(aliceList.body.items[0].description, 'Alice rent');
});

test('paginates newest first', async () => {
  const { auth } = await newUser();
  for (let day = 1; day <= 5; day++) {
    await addTx(auth, { date: `2026-10-0${day}`, description: `Day ${day}` });
  }
  const page1 = await request(app).get('/api/transactions?limit=2&page=1').set(auth);
  const page3 = await request(app).get('/api/transactions?limit=2&page=3').set(auth);
  assert.equal(page1.body.totalPages, 3);
  assert.deepEqual(page1.body.items.map((t) => t.description), ['Day 5', 'Day 4']);
  assert.deepEqual(page3.body.items.map((t) => t.description), ['Day 1']);
});

test('CSV import saves valid rows, reports bad rows and skips re-uploaded rows', async () => {
  const { auth } = await newUser();
  const csv = [
    'Date,Description,Amount,Type,Category',
    '01/11/2026,Salary,"50,000.00",credit,Salary',
    '02/11/2026,Chai,20,debit,Food & Dining',
    '02/11/2026,Chai,20,debit,Food & Dining', // a second, genuine tea on the same day
    '03/11/2026,Broken row,abc,debit,Other',
    '2026-11-04,Uber to office,-250.50,,Transportation',
  ].join('\n');

  const first = await request(app).post('/api/transactions/import').set(auth).send({ csv });
  assert.equal(first.status, 200);
  assert.equal(first.body.imported, 4);
  assert.equal(first.body.duplicates, 0);
  assert.equal(first.body.failed, 1);
  assert.equal(first.body.errors[0].row, 5);

  const second = await request(app).post('/api/transactions/import').set(auth).send({ csv });
  assert.equal(second.body.imported, 0);
  assert.equal(second.body.duplicates, 4);

  const list = await request(app).get('/api/transactions?month=2026-11&limit=50').set(auth);
  assert.equal(list.body.total, 4);
  const uber = list.body.items.find((t) => t.description === 'Uber to office');
  assert.equal(uber.type, 'expense');
  assert.equal(uber.amountPaise, 25050);

  const missing = await request(app).post('/api/transactions/import').set(auth).send({ csv: 'date,amount\n2026-11-01,5' });
  assert.equal(missing.status, 400);
});

test('budgets upsert per category and month', async () => {
  const { auth } = await newUser();
  const first = await request(app).put('/api/budgets').set(auth).send({ category: 'Travel', month: '2026-11', amount: '5000' });
  const second = await request(app).put('/api/budgets').set(auth).send({ category: 'Travel', month: '2026-11', amount: '6000' });
  assert.equal(first.body.budget.id, second.body.budget.id);
  assert.equal(second.body.budget.amountPaise, 600000);

  const list = await request(app).get('/api/budgets?month=2026-11').set(auth);
  assert.equal(list.body.items.length, 1);
});

test('summary totals, month-over-month change and budget alerts come from aggregation', async () => {
  const { auth } = await newUser();
  await addTx(auth, { type: 'income', amount: '1000', date: '2026-10-01', description: 'Oct pay', category: 'Salary' });
  await addTx(auth, { amount: '200', date: '2026-10-10', description: 'Oct food' });
  await addTx(auth, { type: 'income', amount: '1500', date: '2026-11-01', description: 'Nov pay', category: 'Salary' });
  await addTx(auth, { amount: '300.50', date: '2026-11-03', description: 'Nov food' });
  await addTx(auth, { amount: '0.25', date: '2026-11-04', description: 'Nov food 2' });
  await addTx(auth, { amount: '900', date: '2026-11-05', description: 'Flight', category: 'Travel' });

  await request(app).put('/api/budgets').set(auth).send({ category: 'Food & Dining', month: '2026-11', amount: '1000' });
  await request(app).put('/api/budgets').set(auth).send({ category: 'Travel', month: '2026-11', amount: '1000' });
  await request(app).put('/api/budgets').set(auth).send({ category: 'Shopping', month: '2026-11', amount: '500' });

  const res = await request(app).get('/api/summary?month=2026-11').set(auth);
  assert.equal(res.status, 200);
  const s = res.body;

  assert.equal(s.monthIncomePaise, 150000);
  assert.equal(s.monthExpensePaise, 120075); // 300.50 + 0.25 + 900, exact
  assert.equal(s.balancePaise, 250000 - 140075);
  assert.equal(s.incomeChangePercent, 50);
  assert.equal(s.trend.length, 12);
  assert.equal(s.trend.at(-1).month, '2026-11');
  assert.equal(s.trend.at(-2).expensePaise, 20000);

  assert.deepEqual(s.byCategory.map((c) => c.category), ['Travel', 'Food & Dining']);

  const travel = s.budgets.find((b) => b.category === 'Travel');
  const food = s.budgets.find((b) => b.category === 'Food & Dining');
  const shopping = s.budgets.find((b) => b.category === 'Shopping');
  assert.equal(travel.status, 'warning'); // 90%
  assert.equal(food.status, 'ok'); // ~30%
  assert.equal(shopping.spentPaise, 0);
  assert.deepEqual(s.alerts.map((a) => a.category), ['Travel']);
});
