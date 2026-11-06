import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2 } from "lucide-react";
import { BudgetInput, BudgetWithStatus, CATEGORIES, categoryIcon } from "@/types/transaction";
import { formatINR, formatMonth, paiseToInput } from "@/lib/format";
import type { ActionResult } from "@/hooks/useFinance";

interface BudgetManagerProps {
  month: string;
  budgets: BudgetWithStatus[];
  onSaveBudget: (input: BudgetInput) => Promise<ActionResult>;
  onDeleteBudget: (id: string) => void;
}

const BAR_COLORS = { ok: 'bg-green-500', warning: 'bg-yellow-500', exceeded: 'bg-red-500' };
const TEXT_COLORS = { ok: 'text-gray-600', warning: 'text-yellow-700', exceeded: 'text-red-600' };

const BudgetManager: React.FC<BudgetManagerProps> = ({ month, budgets, onSaveBudget, onDeleteBudget }) => {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BudgetWithStatus | null>(null);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const openForm = (budget: BudgetWithStatus | null) => {
    setEditing(budget);
    setCategory(budget?.category ?? '');
    setAmount(budget ? paiseToInput(budget.amountPaise) : '');
    setErrors({});
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      setErrors({ category: 'Please choose a category' });
      return;
    }
    setSaving(true);
    const result = await onSaveBudget({ category, amount: amount.trim(), month });
    setSaving(false);
    if (result.ok) setShowForm(false);
    else setErrors(result.errors);
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amountPaise, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spentPaise, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Budgets · {formatMonth(month)}</h2>
        <Button onClick={() => openForm(null)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Set Budget
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual</CardTitle>
          {budgets.length > 0 && (
            <p className="text-sm text-gray-500">
              {formatINR(totalSpent)} spent of {formatINR(totalBudget)} budgeted
            </p>
          )}
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              No budgets for this month yet. You get a warning at 80% of a budget.
            </p>
          ) : (
            <div className="space-y-5">
              {budgets.map((budget) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{categoryIcon(budget.category)}</span>
                      <span className="font-medium">{budget.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatINR(budget.spentPaise)} / {formatINR(budget.amountPaise)}
                      </div>
                      <div className={`text-sm ${TEXT_COLORS[budget.status]}`}>
                        {budget.percentUsed}% used ·{' '}
                        {budget.remainingPaise >= 0
                          ? `${formatINR(budget.remainingPaise)} left`
                          : `${formatINR(-budget.remainingPaise)} over`}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${BAR_COLORS[budget.status]}`}
                      style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" aria-label="Edit budget" onClick={() => openForm(budget)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Delete budget"
                      onClick={() => {
                        if (window.confirm(`Delete the ${budget.category} budget?`)) onDeleteBudget(budget.id);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editing ? 'Edit Budget' : 'Set a Budget'}</CardTitle>
              <p className="text-sm text-gray-500">For {formatMonth(month)}</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="budget-category">Category</Label>
                  <select
                    id="budget-category"
                    value={category}
                    disabled={Boolean(editing)}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Category</option>
                    {Object.entries(CATEGORIES).map(([cat, icon]) => (
                      <option key={cat} value={cat}>
                        {icon} {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>

                <div>
                  <Label htmlFor="budget-amount">Budget Amount (₹)</Label>
                  <Input
                    id="budget-amount"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Budget'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BudgetManager;
