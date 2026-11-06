import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, TrendingUp, IndianRupee, TrendingDown, Upload } from "lucide-react";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import ExpenseChart from "@/components/ExpenseChart";
import CategoryChart from "@/components/CategoryChart";
import BudgetManager from "@/components/BudgetManager";
import BudgetAlerts from "@/components/BudgetAlerts";
import ImportCsv from "@/components/ImportCsv";
import Sidebar from "@/components/Sidebar";
import QuickAdd from "@/components/QuickAdd";
import { Transaction, TransactionInput } from "@/types/transaction";
import { useFinance } from "@/hooks/useFinance";
import { formatINR, formatMonth, thisMonth } from "@/lib/format";

// "+12.5% vs last month", or a plain note when last month had nothing.
function ChangeNote({ percent, goodWhenUp }: { percent: number | null; goodWhenUp: boolean }) {
  if (percent === null) return <p className="text-xs text-gray-500 mt-1">No data for last month</p>;
  const up = percent >= 0;
  const good = up === goodWhenUp;
  return (
    <p className={`text-xs mt-1 ${good ? 'text-green-600' : 'text-red-600'}`}>
      {up ? '+' : ''}
      {percent}% vs last month
    </p>
  );
}

const Modal = ({ children }: { children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">{children}</div>
  </div>
);

const Index = () => {
  const [month, setMonth] = useState(thisMonth());
  const [activeTab, setActiveTab] = useState('overview');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const finance = useFinance(month);
  const { summary, list } = finance;

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleSubmit = async (input: TransactionInput) => {
    const result = editingTransaction
      ? await finance.updateTransaction(editingTransaction.id, input)
      : await finance.addTransaction(input);
    if (result.ok) closeForm();
    return result;
  };

  const handleDelete = (id: string) => {
    finance.deleteTransaction(id);
  };

  const renderContent = () => {
    if (!summary) {
      return <p className="text-gray-500">{finance.loading ? 'Loading…' : 'Could not load data.'}</p>;
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <BudgetAlerts alerts={summary.alerts} onOpenBudgets={() => setActiveTab('budgets')} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Balance</CardTitle>
                  <IndianRupee className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${summary.balancePaise >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatINR(summary.balancePaise)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">All time, {summary.transactionCount} transactions</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Income · {formatMonth(month)}</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">{formatINR(summary.monthIncomePaise)}</div>
                  <ChangeNote percent={summary.incomeChangePercent} goodWhenUp />
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Expenses · {formatMonth(month)}</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">{formatINR(summary.monthExpensePaise)}</div>
                  <ChangeNote percent={summary.expenseChangePercent} goodWhenUp={false} />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Last 12 Months</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExpenseChart trend={summary.trend} />
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryChart byCategory={summary.byCategory} />
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Transactions</span>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('transactions')}>
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionList
                  transactions={(list?.items ?? []).slice(0, 5)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 'transactions':
        return (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                <span>Transactions · {formatMonth(month)}</span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowImport(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                  <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Transaction
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList
                transactions={list?.items ?? []}
                onEdit={handleEdit}
                onDelete={handleDelete}
                search={finance.search}
                onSearchChange={finance.setSearch}
                page={list?.page}
                totalPages={list?.totalPages}
                total={list?.total}
                onPageChange={finance.setPage}
              />
            </CardContent>
          </Card>
        );

      case 'categories':
        return (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Category Analysis · {formatMonth(month)}</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryChart byCategory={summary.byCategory} showTable />
            </CardContent>
          </Card>
        );

      case 'budgets':
        return (
          <BudgetManager
            month={month}
            budgets={summary.budgets}
            onSaveBudget={finance.saveBudget}
            onDeleteBudget={finance.deleteBudget}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 flex min-w-0">
          <div className="flex-1 p-8 min-w-0">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Personal Finance Dashboard</h1>
                <p className="text-gray-600">Track your expenses and manage your budget effectively</p>
              </div>
              <div>
                <label htmlFor="month" className="block text-xs text-gray-500 mb-1">
                  Month
                </label>
                <Input
                  id="month"
                  type="month"
                  value={month}
                  max={thisMonth()}
                  onChange={(e) => e.target.value && setMonth(e.target.value)}
                  className="w-44 bg-white"
                />
              </div>
            </div>

            {renderContent()}
          </div>

          <div className="w-80 shrink-0 p-6 border-l border-gray-200 hidden lg:block">
            <QuickAdd onAddTransaction={finance.addTransaction} />
          </div>
        </div>
      </div>

      {showForm && (
        <Modal>
          <TransactionForm onSubmit={handleSubmit} onCancel={closeForm} initialData={editingTransaction} />
        </Modal>
      )}

      {showImport && (
        <Modal>
          <ImportCsv onImport={finance.importCsv} onClose={() => setShowImport(false)} />
        </Modal>
      )}
    </div>
  );
};

export default Index;
