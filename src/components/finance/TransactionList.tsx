
import { ArrowDownIcon, ArrowUpIcon, ShoppingBag, Coffee, HomeIcon, Car, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: "income" | "expense";
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case "groceries":
      return <ShoppingBag className="h-4 w-4" />;
    case "coffee":
      return <Coffee className="h-4 w-4" />;
    case "housing":
      return <HomeIcon className="h-4 w-4" />;
    case "transportation":
      return <Car className="h-4 w-4" />;
    default:
      return <Gift className="h-4 w-4" />;
  }
};

export function TransactionItem({ transaction }: { transaction: Transaction }) {
  const { description, amount, category, date, type } = transaction;
  
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(amount));

  return (
    <div className="flex items-center py-3 border-b border-finance-light last:border-0">
      <div className="h-8 w-8 rounded-full bg-finance-light flex items-center justify-center mr-3">
        {getCategoryIcon(category)}
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm text-finance-dark">{description}</p>
        <p className="text-xs text-finance-neutral">
          {category} • {date}
        </p>
      </div>
      <div className="flex items-center">
        <span className={`font-medium ${type === "income" ? "text-finance-income" : "text-finance-expense"}`}>
          {type === "income" ? "+" : "-"}{formattedAmount}
        </span>
        <div className="ml-2">
          {type === "income" ? (
            <ArrowUpIcon className="h-4 w-4 text-finance-income" />
          ) : (
            <ArrowDownIcon className="h-4 w-4 text-finance-expense" />
          )}
        </div>
      </div>
    </div>
  );
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card className="shadow-sm border-finance-light">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg font-medium text-finance-dark">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-0">
          {transactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
