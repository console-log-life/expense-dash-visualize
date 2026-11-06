// Amounts are always integer paise (₹1 = 100 paise), never floating point
// rupees. See server/src/lib/money.js for why.

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amountPaise: number;
  category: string;
  description: string;
  date: string; // "YYYY-MM-DD"
  imported: boolean;
}

// What the forms send to the API. `amount` is the text the user typed, e.g.
// "125.50"; the server converts it to paise.
export interface TransactionInput {
  type: TransactionType;
  amount: string;
  category: string;
  description: string;
  date: string;
}

export type BudgetStatus = 'ok' | 'warning' | 'exceeded';

export interface BudgetWithStatus {
  id: string;
  category: string;
  month: string; // "YYYY-MM"
  amountPaise: number;
  spentPaise: number;
  remainingPaise: number;
  percentUsed: number;
  status: BudgetStatus;
}

export interface BudgetInput {
  category: string;
  month: string;
  amount: string;
}

export interface Summary {
  month: string;
  balancePaise: number;
  transactionCount: number;
  monthIncomePaise: number;
  monthExpensePaise: number;
  incomeChangePercent: number | null;
  expenseChangePercent: number | null;
  byCategory: { category: string; totalPaise: number; count: number }[];
  trend: { month: string; incomePaise: number; expensePaise: number }[];
  budgets: BudgetWithStatus[];
  alerts: BudgetWithStatus[];
}

export interface TransactionPage {
  items: Transaction[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ImportResult {
  imported: number;
  duplicates: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
}

// Must match server/src/lib/categories.js.
export const CATEGORIES = {
  'Food & Dining': '🍽️',
  'Housing': '🏠',
  'Transportation': '🚗',
  'Shopping': '🛍️',
  'Entertainment': '🎬',
  'Healthcare': '🏥',
  'Education': '📚',
  'Utilities': '⚡',
  'Travel': '✈️',
  'Salary': '💼',
  'Other': '📦',
};

export const categoryIcon = (category: string) =>
  CATEGORIES[category as keyof typeof CATEGORIES] || '📦';
