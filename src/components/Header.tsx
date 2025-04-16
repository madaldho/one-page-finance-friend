
import { Wallet } from "lucide-react";
import TransactionForm from "./TransactionForm";

interface HeaderProps {
  onAddTransaction: (transaction: any) => void;
}

const Header = ({ onAddTransaction }: HeaderProps) => {
  return (
    <header className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white shadow-sm gap-4">
      <div className="flex items-center gap-2">
        <Wallet className="w-6 h-6 text-[#6E59A5]" />
        <h1 className="text-xl font-semibold text-[#1A1F2C]">DompetKu</h1>
      </div>
      
      <div className="flex gap-2">
        <TransactionForm onAddTransaction={onAddTransaction} type="income" />
        <TransactionForm onAddTransaction={onAddTransaction} type="expense" />
      </div>
    </header>
  );
};

export default Header;
