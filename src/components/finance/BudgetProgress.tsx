
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BudgetProgressProps {
  category: string;
  current: number;
  max: number;
  color: string;
}

export function BudgetProgress({ category, current, max, color }: BudgetProgressProps) {
  const percentage = Math.min(Math.round((current / max) * 100), 100);
  
  const formattedCurrent = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(current);
  
  const formattedMax = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(max);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-finance-dark">{category}</span>
        <span className="text-finance-neutral">
          {formattedCurrent} / {formattedMax}
        </span>
      </div>
      <Progress
        value={percentage}
        className={`h-2 bg-finance-light [&>div]:bg-${color}`}
      />
    </div>
  );
}

export function BudgetCard({ title, items }: { 
  title: string;
  items: Array<{ category: string; current: number; max: number; color: string }>
}) {
  return (
    <Card className="shadow-sm border-finance-light">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg font-medium text-finance-dark">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {items.map((item) => (
          <BudgetProgress
            key={item.category}
            category={item.category}
            current={item.current}
            max={item.max}
            color={item.color}
          />
        ))}
      </CardContent>
    </Card>
  );
}
