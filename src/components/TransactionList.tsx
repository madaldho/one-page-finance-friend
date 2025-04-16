import React, { useState } from "react";
import { Transaction } from "@/types";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface TransactionListProps {
  transactions: Transaction[];
  onFilter: (query: string) => void;
}

const TransactionList = ({ transactions, onFilter }: TransactionListProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onFilter(query);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.type === "income"
                    ? "bg-green-100 text-green-600"
                    : transaction.type === "expense"
                    ? "bg-red-100 text-red-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {transaction.type === "income" ? "↑" : transaction.type === "expense" ? "↓" : "↔"}
              </div>
              <div>
                <div className="font-medium">{transaction.title}</div>
                <div className="text-sm text-gray-500">
                  {format(new Date(transaction.date), "dd MMM yyyy", { locale: id })}
                </div>
              </div>
            </div>
            <div
              className={`font-semibold ${
                transaction.type === "income"
                  ? "text-green-600"
                  : transaction.type === "expense"
                  ? "text-red-600"
                  : "text-blue-600"
              }`}
            >
              {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
              Rp {transaction.amount.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionList;
