
import { useState } from "react";
import { BalanceCard } from "@/components/finance/BalanceCard";
import { BudgetCard } from "@/components/finance/BudgetProgress";
import { TransactionList, Transaction } from "@/components/finance/TransactionList";
import { AddTransactionForm } from "@/components/finance/AddTransactionForm";
import { ChevronDownIcon, Wallet } from "lucide-react";

// Initial demo data
const initialTransactions: Transaction[] = [
  {
    id: "1",
    description: "Salary",
    amount: 3000,
    category: "Salary",
    date: "Apr 12, 2025",
    type: "income",
  },
  {
    id: "2",
    description: "Grocery shopping",
    amount: 85.45,
    category: "Groceries",
    date: "Apr 14, 2025",
    type: "expense",
  },
  {
    id: "3",
    description: "Restaurant dinner",
    amount: 54.20,
    category: "Entertainment",
    date: "Apr 15, 2025",
    type: "expense",
  },
  {
    id: "4",
    description: "Coffee shop",
    amount: 4.75,
    category: "Coffee",
    date: "Apr 16, 2025",
    type: "expense",
  },
];

const budgetCategories = [
  { category: "Groceries", current: 280, max: 400, color: "finance-primary" },
  { category: "Entertainment", current: 120, max: 200, color: "finance-accent" },
  { category: "Transportation", current: 140, max: 250, color: "finance-secondary" },
  { category: "Coffee", current: 30, max: 50, color: "finance-expense" },
];

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  
  // Calculate totals
  const balance = transactions.reduce((total, transaction) => 
    transaction.type === "income" 
      ? total + transaction.amount 
      : total - transaction.amount, 
    0
  );
  
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const handleAddTransaction = (newTransaction: {
    description: string;
    amount: number;
    category: string;
    type: "income" | "expense";
  }) => {
    const transaction: Transaction = {
      id: Math.random().toString(36).substring(2, 9),
      description: newTransaction.description,
      amount: newTransaction.amount,
      category: newTransaction.category,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: newTransaction.type,
    };
    
    setTransactions([transaction, ...transactions]);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 border-b">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Wallet className="h-6 w-6 text-finance-primary mr-2" />
            <h1 className="text-xl font-bold text-finance-dark">Finance Friend</h1>
          </div>
          <div className="flex items-center space-x-1 text-sm text-finance-neutral">
            <span>April 2025</span>
            <ChevronDownIcon className="h-4 w-4" />
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-6xl mx-auto py-6 px-6">
        {/* Balance overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <BalanceCard 
            title="Total Balance" 
            amount={balance} 
            type="balance"
          />
          <BalanceCard 
            title="Total Income" 
            amount={totalIncome} 
            type="income"
          />
          <BalanceCard 
            title="Total Expenses" 
            amount={totalExpenses} 
            type="expense"
          />
        </div>
        
        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left side */}
          <div className="lg:col-span-8 space-y-6">
            {/* Budget tracking */}
            <BudgetCard 
              title="Budget Tracking" 
              items={budgetCategories}
            />
            
            {/* Transactions */}
            <TransactionList transactions={transactions} />
          </div>
          
          {/* Right side - Add Transaction */}
          <div className="lg:col-span-4">
            <AddTransactionForm onAddTransaction={handleAddTransaction} />
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t py-4 px-6">
        <div className="max-w-6xl mx-auto text-center text-sm text-finance-neutral">
          Finance Friend © 2025
        </div>
      </footer>
    </div>
  );
};

export default Index;
