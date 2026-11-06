import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, IndianRupee, Calendar, FileText } from "lucide-react";
import { Transaction, TransactionInput, TransactionType, CATEGORIES } from "@/types/transaction";
import { paiseToInput, today } from "@/lib/format";
import type { ActionResult } from "@/hooks/useFinance";

interface TransactionFormProps {
  onSubmit: (input: TransactionInput) => Promise<ActionResult>;
  onCancel: () => void;
  initialData?: Transaction | null;
}

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const mode = initialData ? 'edit' : 'add';
  const [amount, setAmount] = useState(initialData ? paiseToInput(initialData.amountPaise) : '');
  const [date, setDate] = useState(initialData?.date ?? today());
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [category, setCategory] = useState(initialData?.category ?? 'Other');
  const [type, setType] = useState<TransactionType>(initialData?.type ?? 'expense');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Quick checks for instant feedback. The server checks everything again.
  const validate = () => {
    const found: Record<string, string> = {};
    if (!AMOUNT_RE.test(amount.trim()) || Number(amount) <= 0) {
      found.amount = 'Enter a positive amount with at most 2 decimals';
    }
    if (!date) found.date = 'Please select a date';
    if (!description.trim()) found.description = 'Please enter a description';
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const result = await onSubmit({ type, amount: amount.trim(), date, description: description.trim(), category });
    setSaving(false);
    if (!result.ok) setErrors(result.errors);
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-800">
            {mode === 'edit' ? 'Edit Transaction' : 'Add New Transaction'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Transaction Type</Label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={type === 'expense'}
                  onChange={() => setType('expense')}
                  className="mr-2"
                />
                <span className="text-red-600">💸 Expense</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={type === 'income'}
                  onChange={() => setType('income')}
                  className="mr-2"
                />
                <span className="text-green-600">💰 Income</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium text-gray-700 flex items-center">
              <IndianRupee className="h-4 w-4 mr-1" />
              Amount
            </Label>
            <Input
              id="amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium text-gray-700 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(CATEGORIES).map(([cat, icon]) => (
                <option key={cat} value={cat}>
                  {icon} {cat}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700 flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Enter transaction description..."
              value={description}
              maxLength={200}
              onChange={(e) => setDescription(e.target.value)}
              className={`${errors.description ? 'border-red-500' : ''} resize-none`}
              rows={3}
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? 'Saving…' : mode === 'edit' ? 'Update Transaction' : 'Add Transaction'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TransactionForm;
