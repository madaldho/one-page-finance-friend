
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TransactionActionsProps {
  onTransactionAdded: (transaction: any) => void;
}

const TransactionActions = ({ onTransactionAdded }: TransactionActionsProps) => {
  const navigate = useNavigate();

  const handleNavigate = (type: "income" | "expense" | "transfer") => {
    navigate(`/transaction/${type}`);
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 flex justify-center z-50">
      <div className="flex gap-3 p-3 bg-white rounded-full shadow-lg">
        <Button 
          className="bg-green-500 hover:bg-green-600 px-5 rounded-full text-sm" 
          onClick={() => handleNavigate('income')}
        >
          <Plus className="w-4 h-4 mr-2" /> Pemasukan
        </Button>
        <Button 
          className="bg-red-500 hover:bg-red-600 px-5 rounded-full text-sm" 
          onClick={() => handleNavigate('expense')}
        >
          <Minus className="w-4 h-4 mr-2" /> Pengeluaran
        </Button>
        <Button 
          className="bg-blue-500 hover:bg-blue-600 px-5 rounded-full text-sm" 
          onClick={() => handleNavigate('transfer')}
        >
          <ArrowRight className="w-4 h-4 mr-2" /> Transfer
        </Button>
      </div>
    </div>
  );
};

export default TransactionActions;
