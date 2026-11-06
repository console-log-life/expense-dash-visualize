import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import type {
  BudgetInput,
  ImportResult,
  Summary,
  TransactionInput,
  TransactionPage,
} from '@/types/transaction';

const PAGE_SIZE = 20;

function showError(err: unknown) {
  toast({
    title: 'Error',
    description: err instanceof ApiError ? err.message : 'Something went wrong',
    variant: 'destructive',
  });
}

// All dashboard data for one selected month, loaded from the API.
// After any change (add, edit, delete, import, budget), both the list and the
// summary are reloaded, so every card and chart shows the server's numbers.
export function useFinance(month: string) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [list, setList] = useState<TransactionPage | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  // Counts list requests, so an older, slower response cannot overwrite a newer one.
  const latestListRequest = useRef(0);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await api.summary(month));
    } catch (err) {
      showError(err);
    }
  }, [month]);

  const loadList = useCallback(async () => {
    const requestId = ++latestListRequest.current;
    try {
      const result = await api.listTransactions({ month, q: search, page, limit: PAGE_SIZE });
      if (requestId === latestListRequest.current) setList(result);
    } catch (err) {
      showError(err);
    }
  }, [month, search, page]);

  // Go back to page 1 whenever the month or search changes.
  useEffect(() => {
    setPage(1);
  }, [month, search]);

  useEffect(() => {
    setLoading(true);
    loadSummary().finally(() => setLoading(false));
  }, [loadSummary]);

  // Wait 300 ms after the user stops typing before searching.
  useEffect(() => {
    const timer = setTimeout(loadList, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadList, search]);

  const refresh = useCallback(() => Promise.all([loadSummary(), loadList()]), [loadSummary, loadList]);

  // Runs an API call, shows a toast, and reloads. Returns true on success so
  // forms know whether to close; field errors are passed back to the form.
  const run = useCallback(
    async (action: () => Promise<unknown>, successTitle: string): Promise<ActionResult> => {
      try {
        await action();
        toast({ title: successTitle });
        await refresh();
        return { ok: true, errors: {} };
      } catch (err) {
        if (err instanceof ApiError && err.details) return { ok: false, errors: err.details };
        showError(err);
        return { ok: false, errors: {} };
      }
    },
    [refresh],
  );

  return {
    summary,
    list,
    loading,
    search,
    setSearch,
    page,
    setPage,
    addTransaction: (input: TransactionInput) => run(() => api.createTransaction(input), 'Transaction added'),
    updateTransaction: (id: string, input: TransactionInput) =>
      run(() => api.updateTransaction(id, input), 'Transaction updated'),
    deleteTransaction: (id: string) => run(() => api.deleteTransaction(id), 'Transaction deleted'),
    saveBudget: (input: BudgetInput) => run(() => api.saveBudget(input), 'Budget saved'),
    deleteBudget: (id: string) => run(() => api.deleteBudget(id), 'Budget deleted'),
    importCsv: async (csv: string): Promise<ImportResult | null> => {
      try {
        const result = await api.importCsv(csv);
        await refresh();
        return result;
      } catch (err) {
        showError(err);
        return null;
      }
    },
  };
}

// `errors` holds per-field messages from the server when validation fails.
export interface ActionResult {
  ok: boolean;
  errors: Record<string, string>;
}
