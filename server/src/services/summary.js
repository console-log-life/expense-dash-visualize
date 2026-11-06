import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { monthRange, shiftMonth } from '../lib/dates.js';
import { budgetStatus, percentChange } from '../lib/budgetStatus.js';

export const TREND_MONTHS = 12;

// Builds everything the dashboard shows for one month. The totals are worked
// out inside MongoDB with aggregation pipelines, so the server never has to
// load every transaction into memory just to add them up.
export async function buildSummary(userId, month) {
  const firstTrendMonth = shiftMonth(month, -(TREND_MONTHS - 1));
  const trendStart = monthRange(firstTrendMonth).start;
  const { start: monthStart, end: monthEnd } = monthRange(month);

  const [trendRows, categoryRows, allTimeRows, budgets] = await Promise.all([
    // Income and expense totals per month for the last 12 months.
    Transaction.aggregate([
      { $match: { userId, date: { $gte: trendStart, $lt: monthEnd } } },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$date', timezone: 'UTC' } },
            type: '$type',
          },
          totalPaise: { $sum: '$amountPaise' },
        },
      },
    ]),

    // Spending per category in the selected month, biggest first.
    Transaction.aggregate([
      { $match: { userId, type: 'expense', date: { $gte: monthStart, $lt: monthEnd } } },
      { $group: { _id: '$category', totalPaise: { $sum: '$amountPaise' }, count: { $sum: 1 } } },
      { $sort: { totalPaise: -1 } },
    ]),

    // Total income and expense across all time, for the balance card.
    Transaction.aggregate([
      { $match: { userId } },
      { $group: { _id: '$type', totalPaise: { $sum: '$amountPaise' }, count: { $sum: 1 } } },
    ]),

    Budget.find({ userId, month }).sort({ category: 1 }),
  ]);

  // Fill in months with no transactions so the chart has no gaps.
  const trend = [];
  for (let i = 0; i < TREND_MONTHS; i++) {
    const m = shiftMonth(firstTrendMonth, i);
    trend.push({ month: m, incomePaise: 0, expensePaise: 0 });
  }
  const trendByMonth = new Map(trend.map((t) => [t.month, t]));
  for (const row of trendRows) {
    const entry = trendByMonth.get(row._id.month);
    if (!entry) continue;
    if (row._id.type === 'income') entry.incomePaise = row.totalPaise;
    else entry.expensePaise = row.totalPaise;
  }

  const current = trendByMonth.get(month);
  const previous = trendByMonth.get(shiftMonth(month, -1));

  const byCategory = categoryRows.map((row) => ({
    category: row._id,
    totalPaise: row.totalPaise,
    count: row.count,
  }));
  const spentByCategory = new Map(byCategory.map((c) => [c.category, c.totalPaise]));

  const allTime = { incomePaise: 0, expensePaise: 0, count: 0 };
  for (const row of allTimeRows) {
    if (row._id === 'income') allTime.incomePaise = row.totalPaise;
    else allTime.expensePaise = row.totalPaise;
    allTime.count += row.count;
  }

  const budgetItems = budgets.map((b) => ({
    ...b.toPublic(),
    ...budgetStatus(b.amountPaise, spentByCategory.get(b.category) || 0),
  }));

  return {
    month,
    balancePaise: allTime.incomePaise - allTime.expensePaise,
    transactionCount: allTime.count,
    monthIncomePaise: current.incomePaise,
    monthExpensePaise: current.expensePaise,
    incomeChangePercent: percentChange(current.incomePaise, previous.incomePaise),
    expenseChangePercent: percentChange(current.expensePaise, previous.expensePaise),
    byCategory,
    trend,
    budgets: budgetItems,
    // Budgets at 80% or more, worst first, for the alert banner.
    alerts: budgetItems
      .filter((b) => b.status !== 'ok')
      .sort((a, b) => b.percentUsed - a.percentUsed),
  };
}
