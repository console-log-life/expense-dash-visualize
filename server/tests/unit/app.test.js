import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'unit-test-secret';
const { createApp } = await import('../../src/app.js');
const app = createApp();

// These checks never reach the database, so they run without MongoDB.

test('health check responds', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { ok: true });
});

test('protected routes need a token', async () => {
  for (const path of ['/api/transactions', '/api/budgets', '/api/summary', '/api/auth/me']) {
    const res = await request(app).get(path);
    assert.equal(res.status, 401, path);
  }
});

test('rejects a token signed with a different secret', async () => {
  const forged = jwt.sign({ sub: '64b7f0f0f0f0f0f0f0f0f0f0' }, 'not-the-secret');
  const res = await request(app).get('/api/summary').set('Authorization', `Bearer ${forged}`);
  assert.equal(res.status, 401);
});

test('rejects an expired token', async () => {
  const expired = jwt.sign({ sub: '64b7f0f0f0f0f0f0f0f0f0f0', exp: Math.floor(Date.now() / 1000) - 60 }, 'unit-test-secret');
  const res = await request(app).get('/api/summary').set('Authorization', `Bearer ${expired}`);
  assert.equal(res.status, 401);
});

test('unknown routes return 404 JSON', async () => {
  const res = await request(app).get('/api/nope');
  assert.equal(res.status, 404);
  assert.equal(res.body.error, 'Not found');
});

test('malformed JSON returns 400', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"email":');
  assert.equal(res.status, 400);
});
