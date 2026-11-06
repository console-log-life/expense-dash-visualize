import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Search, Calendar, IndianRupee, TrendingUp, TrendingDown, FileUp } from "lucide-react";
import { Transaction, categoryIcon } from "@/types/transaction";
import { formatDay, formatINR } from "@/lib/format";

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  // Search and paging are optional so the "Recent" card can show a plain list.
  search?: string;
  onSearchChange?: (value: string) => void;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  search,
  onSearchChange,
  page = 1,
  totalPages = 1,
  total,
  onPageChange,
}) => {
  const handleDelete = (transaction: Transaction) => {
    if (window.confirm(`Delete "${transaction.description}"?`)) onDelete(transaction.id);
  };

  return (
    <div className="space-y-4">
      {onSearchChange && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search descriptions..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <IndianRupee className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600 text-lg font-medium">
            {search ? 'No transactions match your search' : 'No transactions this month'}
          </p>
          {!search && <p className="text-gray-500">Add one, or import a CSV bank statement.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((transaction) => {
            const isIncome = transaction.type === 'income';
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-gray-100 hover:bg-white/70 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-2xl">{categoryIcon(transaction.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-800 truncate">{transaction.description}</h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
                        {transaction.category}
                      </span>
                      {transaction.imported && (
                        <span title="Imported from CSV" className="text-gray-400">
                          <FileUp className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDay(transaction.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        {isIncome ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {transaction.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`font-semibold whitespace-nowrap ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                    {isIncome ? '+' : '-'}
                    {formatINR(transaction.amountPaise)}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Edit"
                      onClick={() => onEdit(transaction)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Delete"
                      onClick={() => handleDelete(transaction)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{total} transactions</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
