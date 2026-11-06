import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import budgetRoutes from './routes/budgets.js';
import summaryRoutes from './routes/summary.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigins }));
  // 1 MB is enough for a CSV import of a couple of thousand rows.
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/transactions', requireAuth, transactionRoutes);
  app.use('/api/budgets', requireAuth, budgetRoutes);
  app.use('/api/summary', requireAuth, summaryRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
