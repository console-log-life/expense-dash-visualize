import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES, TransactionInput, TransactionType } from "@/types/transaction";
import { today } from "@/lib/format";
import type { ActionResult } from "@/hooks/useFinance";

interface QuickAddProps {
  onAddTransaction: (input: TransactionInput) => Promise<ActionResult>;
}

const empty = { amount: '', description: '', category: 'Food & Dining', type: 'expense' as TransactionType };

const QuickAdd: React.FC<QuickAddProps> = ({ onAddTransaction }) => {
  const [formData, setFormData] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await onAddTransaction({ ...formData, date: today() });
    setSaving(false);
    if (result.ok) {
      setFormData(empty);
      setErrors({});
    } else {
      setErrors(result.errors);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg">Quick Add</CardTitle>
        <p className="text-xs text-gray-500">Adds a transaction dated today</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="quick-amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <Input
                id="quick-amount"
                inputMode="decimal"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                className="pl-8"
                placeholder="0.00"
              />
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          <div>
            <Label htmlFor="quick-description">Description</Label>
            <Input
              id="quick-description"
              value={formData.description}
              maxLength={200}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="What was this for?"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          <div>
            <Label htmlFor="quick-category">Category</Label>
            <select
              id="quick-category"
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              {Object.entries(CATEGORIES).map(([category, icon]) => (
                <option key={category} value={category}>
                  {icon} {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-4 text-sm">
            {(['expense', 'income'] as const).map((type) => (
              <label key={type} className="flex items-center capitalize">
                <input
                  type="radio"
                  name="quick-type"
                  value={type}
                  checked={formData.type === type}
                  onChange={() => setFormData((prev) => ({ ...prev, type }))}
                  className="mr-2"
                />
                {type}
              </label>
            ))}
          </div>

          <Button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700">
            {saving ? 'Adding…' : 'Add Transaction'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuickAdd;
