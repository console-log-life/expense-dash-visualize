import type {
  BudgetInput,
  BudgetWithStatus,
  ImportResult,
  Summary,
  Transaction,
  TransactionInput,
  TransactionPage,
  User,
} from '@/types/transaction';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const TOKEN_KEY = 'finance-token';

export class ApiError extends Error {
  status: number;
  details?: Record<string, string>;

  constructor(status: number, message: string, details?: Record<string, string>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage can be blocked (private mode); the user just stays logged in
    // for this tab only.
  }
}

// Called when the server says the token is no longer valid.
let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the API running?');
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(res.status, data.error || 'Request failed', data.details);
  }
  return data as T;
}

export const api = {
  register: (body: { name: string; email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/register', { method: 'POST', body }),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/login', { method: 'POST', body }),
  me: () => request<{ user: User }>('/api/auth/me'),

  listTransactions: (params: { month?: string; q?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    return request<TransactionPage>(`/api/transactions?${query}`);
  },
  createTransaction: (body: TransactionInput) =>
    request<{ transaction: Transaction }>('/api/transactions', { method: 'POST', body }),
  updateTransaction: (id: string, body: TransactionInput) =>
    request<{ transaction: Transaction }>(`/api/transactions/${id}`, { method: 'PUT', body }),
  deleteTransaction: (id: string) => request<void>(`/api/transactions/${id}`, { method: 'DELETE' }),
  importCsv: (csv: string) =>
    request<ImportResult>('/api/transactions/import', { method: 'POST', body: { csv } }),

  saveBudget: (body: BudgetInput) =>
    request<{ budget: BudgetWithStatus }>('/api/budgets', { method: 'PUT', body }),
  deleteBudget: (id: string) => request<void>(`/api/budgets/${id}`, { method: 'DELETE' }),

  summary: (month: string) => request<Summary>(`/api/summary?month=${month}`),
};
