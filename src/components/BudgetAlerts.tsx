import React from 'react';
import { AlertTriangle } from "lucide-react";
import { BudgetWithStatus, categoryIcon } from "@/types/transaction";
import { formatINR } from "@/lib/format";

interface BudgetAlertsProps {
  alerts: BudgetWithStatus[];
  onOpenBudgets: () => void;
}

// Banner shown when a category has used 80% or more of its monthly budget.
const BudgetAlerts: React.FC<BudgetAlertsProps> = ({ alerts, onOpenBudgets }) => {
  if (alerts.length === 0) return null;

  const anyExceeded = alerts.some((a) => a.status === 'exceeded');

  return (
    <div
      role="alert"
      className={`rounded-lg border p-4 ${
        anyExceeded ? 'border-red-200 bg-red-50 text-red-800' : 'border-yellow-200 bg-yellow-50 text-yellow-800'
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">Budget alerts</p>
          <ul className="mt-1 space-y-1 text-sm">
            {alerts.map((a) => (
              <li key={a.id}>
                {categoryIcon(a.category)} {a.category}:{' '}
                {a.status === 'exceeded'
                  ? `over budget by ${formatINR(-a.remainingPaise)} (${a.percentUsed}%)`
                  : `${a.percentUsed}% used, ${formatINR(a.remainingPaise)} left`}
              </li>
            ))}
          </ul>
        </div>
        <button type="button" onClick={onOpenBudgets} className="text-sm underline whitespace-nowrap">
          View budgets
        </button>
      </div>
    </div>
  );
};

export default BudgetAlerts;
