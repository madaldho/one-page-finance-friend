import { BadgeDollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface BalanceCardProps {
  balance: number;
  income: number;
  expense: number;
}

const BalanceCard = ({ balance, income, expense }: BalanceCardProps) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-[#6E59A5] to-[#9b87f5]">
      <div className="flex items-center gap-3 mb-4">
        <BadgeDollarSign className="w-6 h-6 text-white" />
        <h2 className="text-lg font-medium text-white">Total Saldo</h2>
      </div>
      <p className="text-3xl font-bold text-white">
        {formatCurrency(balance)}
      </p>
      <div className="mt-4 flex gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-1 text-white/80 text-sm">
            <TrendingUp className="w-4 h-4" />
            <p>Pemasukan</p>
          </div>
          <p className="text-white font-medium">{formatCurrency(income)}</p>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1 text-white/80 text-sm">
            <TrendingDown className="w-4 h-4" />
            <p>Pengeluaran</p>
          </div>
          <p className="text-white font-medium">{formatCurrency(expense)}</p>
        </div>
      </div>
    </Card>
  );
};

export default BalanceCard;
