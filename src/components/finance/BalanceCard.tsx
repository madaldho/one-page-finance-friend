
import { ArrowDownIcon, ArrowUpIcon, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
  title: string;
  amount: number;
  type: "balance" | "income" | "expense";
  className?: string;
}

export function BalanceCard({ title, amount, type, className }: BalanceCardProps) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

  const getIcon = () => {
    switch (type) {
      case "income":
        return <ArrowUpIcon className="h-4 w-4 text-finance-income" />;
      case "expense":
        return <ArrowDownIcon className="h-4 w-4 text-finance-expense" />;
      default:
        return <DollarSign className="h-4 w-4 text-finance-primary" />;
    }
  };

  const getAmountColor = () => {
    switch (type) {
      case "income":
        return "text-finance-income";
      case "expense":
        return "text-finance-expense";
      default:
        return "text-finance-primary";
    }
  };

  return (
    <Card className={cn("shadow-sm border-finance-light", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
        <CardTitle className="text-sm font-medium text-finance-neutral">{title}</CardTitle>
        <div className="rounded-full bg-finance-light p-1">{getIcon()}</div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className={cn("text-2xl font-bold", getAmountColor())}>{formattedAmount}</div>
      </CardContent>
    </Card>
  );
}
