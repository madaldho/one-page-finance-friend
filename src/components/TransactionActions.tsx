
import { useState } from "react";
import { Plus, ArrowDownUp, TrendingUp, TrendingDown } from "lucide-react";
import TransactionForm from "./TransactionForm";
import TransferForm from "./TransferForm";

interface TransactionActionsProps {
  onTransactionAdded: (transaction: any) => void;
}

const TransactionActions = ({ onTransactionAdded }: TransactionActionsProps) => {
  const [activeSheet, setActiveSheet] = useState<"income" | "expense" | "transfer" | null>(null);

  return (
    <div className="fixed bottom-20 left-0 right-0 flex justify-center">
      <div className="bg-white rounded-full shadow-lg p-1 flex">
        <button
          onClick={() => setActiveSheet("income")}
          className="flex items-center gap-2 bg-green-500 text-white py-2 px-4 rounded-full text-sm mr-2"
        >
          <TrendingUp className="w-4 h-4" /> Pemasukan
        </button>
        <button
          onClick={() => setActiveSheet("expense")}
          className="flex items-center gap-2 bg-red-500 text-white py-2 px-4 rounded-full text-sm mr-2"
        >
          <TrendingDown className="w-4 h-4" /> Pengeluaran
        </button>
        <button
          onClick={() => setActiveSheet("transfer")}
          className="flex items-center gap-2 bg-blue-500 text-white py-2 px-4 rounded-full text-sm"
        >
          <ArrowDownUp className="w-4 h-4" /> Convert
        </button>
      </div>
      
      {activeSheet === "income" && (
        <TransactionForm
          onAddTransaction={onTransactionAdded}
          type="income"
          onClose={() => setActiveSheet(null)}
        />
      )}
      
      {activeSheet === "expense" && (
        <TransactionForm
          onAddTransaction={onTransactionAdded}
          type="expense"
          onClose={() => setActiveSheet(null)}
        />
      )}
      
      {activeSheet === "transfer" && (
        <TransferForm 
          onAddTransaction={onTransactionAdded}
          onClose={() => setActiveSheet(null)}
        />
      )}
    </div>
  );
};

export default TransactionActions;
