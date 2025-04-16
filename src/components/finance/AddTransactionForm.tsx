
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddTransactionFormProps {
  onAddTransaction: (transaction: {
    description: string;
    amount: number;
    category: string;
    type: "income" | "expense";
  }) => void;
}

export function AddTransactionForm({ onAddTransaction }: AddTransactionFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("groceries");
  const [type, setType] = useState<"income" | "expense">("expense");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || !amount || parseFloat(amount) <= 0) {
      return;
    }
    
    onAddTransaction({
      description,
      amount: parseFloat(amount),
      category,
      type,
    });
    
    // Reset form
    setDescription("");
    setAmount("");
    setCategory("groceries");
    setType("expense");
  };

  return (
    <Card className="shadow-sm border-finance-light">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg font-medium text-finance-dark">Add Transaction</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Coffee, Groceries, Salary..."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="groceries">Groceries</SelectItem>
                <SelectItem value="coffee">Coffee</SelectItem>
                <SelectItem value="housing">Housing</SelectItem>
                <SelectItem value="transportation">Transportation</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="salary">Salary</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <RadioGroup defaultValue={type} onValueChange={(value) => setType(value as "income" | "expense")}>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="expense" />
                  <Label htmlFor="expense" className="text-finance-expense">Expense</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income" />
                  <Label htmlFor="income" className="text-finance-income">Income</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          <Button type="submit" className="w-full bg-finance-primary hover:bg-finance-primary/90">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
