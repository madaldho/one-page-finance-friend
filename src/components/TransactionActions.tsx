import { useNavigate } from "react-router-dom";
import { Plus, ArrowDownUp, TrendingUp, TrendingDown } from "lucide-react";

interface TransactionActionsProps {
  onTransactionAdded: (transaction: any) => void;
}

const TransactionActions = ({ onTransactionAdded }: TransactionActionsProps) => {
  const navigate = useNavigate();

  const handleNavigate = (type: "income" | "expense" | "transfer") => {
    navigate(`/transaction/${type}`);
  };

  return (
    <div className="fixed bottom-20 left-0 right-0 flex justify-center">
      <div className="bg-white rounded-full shadow-xl p-2 flex gap-2 animate-in slide-in-from-bottom duration-300">
        <button
          onClick={() => handleNavigate("income")}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-full text-sm transition-colors"
        >
          <TrendingUp className="w-4 h-4" /> Pemasukan
        </button>
        <button
          onClick={() => handleNavigate("expense")}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-full text-sm transition-colors"
        >
          <TrendingDown className="w-4 h-4" /> Pengeluaran
        </button>
        <button
          onClick={() => handleNavigate("transfer")}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-full text-sm transition-colors"
        >
          <ArrowDownUp className="w-4 h-4" /> Transfer
        </button>
      </div>
    </div>
  );
};

export default TransactionActions;
