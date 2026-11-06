import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Summary } from "@/types/transaction";
import { formatINR, formatINRShort, formatMonth } from "@/lib/format";

interface ExpenseChartProps {
  trend: Summary['trend'];
}

// Income vs expenses for the last 12 months. The totals come already
// summed from the server's aggregation pipeline.
const ExpenseChart: React.FC<ExpenseChartProps> = ({ trend }) => {
  const hasData = trend.some((t) => t.incomePaise > 0 || t.expensePaise > 0);

  if (!hasData) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 text-center">
        <div>
          <p className="font-medium">No data to display</p>
          <p className="text-sm">Add some transactions to see your trends</p>
        </div>
      </div>
    );
  }

  const data = trend.map((t) => ({
    month: formatMonth(t.month),
    Income: t.incomePaise,
    Expenses: t.expensePaise,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" stroke="#666" fontSize={11} tickLine={false} />
          <YAxis stroke="#666" fontSize={11} tickLine={false} tickFormatter={formatINRShort} width={60} />
          <Tooltip formatter={(value: number) => formatINR(value)} />
          <Legend />
          <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpenseChart;
