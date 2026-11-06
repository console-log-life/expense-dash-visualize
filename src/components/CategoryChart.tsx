import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Summary, categoryIcon } from "@/types/transaction";
import { formatINR } from "@/lib/format";

interface CategoryChartProps {
  byCategory: Summary['byCategory'];
  showTable?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6b7280', '#14b8a6'];

const CategoryChart: React.FC<CategoryChartProps> = ({ byCategory, showTable = false }) => {
  if (byCategory.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500 text-center">
        <div>
          <p className="font-medium">No expenses this month</p>
          <p className="text-sm">Add expenses to see where your money goes</p>
        </div>
      </div>
    );
  }

  const total = byCategory.reduce((sum, c) => sum + c.totalPaise, 0);
  const data = byCategory.map((c) => ({ name: c.category, value: c.totalPaise }));

  return (
    <div className="space-y-6">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={2} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number, name: string) => [formatINR(value), `${categoryIcon(name)} ${name}`]} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {showTable && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2 font-medium">Category</th>
              <th className="py-2 font-medium text-right">Transactions</th>
              <th className="py-2 font-medium text-right">Spent</th>
              <th className="py-2 font-medium text-right">Share</th>
            </tr>
          </thead>
          <tbody>
            {byCategory.map((c) => (
              <tr key={c.category} className="border-b last:border-0">
                <td className="py-2">
                  {categoryIcon(c.category)} {c.category}
                </td>
                <td className="py-2 text-right">{c.count}</td>
                <td className="py-2 text-right font-medium">{formatINR(c.totalPaise)}</td>
                <td className="py-2 text-right text-gray-600">{((c.totalPaise / total) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CategoryChart;
