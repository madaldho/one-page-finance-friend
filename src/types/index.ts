
export interface Category {
  id: string;
  name: string;
  color?: string;
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  color?: string;
  gradient?: string;
  is_default?: boolean;
  type: "savings" | "cash" | "bank";
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  date: string;
  category?: string;
  wallet_id?: string;
  destination_wallet_id?: string;
  description?: string;
  user_id?: string;
}

export interface TransactionWithNames extends Transaction {
  wallet_name?: string;
  category_name?: string;
  category_data?: Category;
  wallet_data?: Wallet;
  destination_wallet?: Wallet;
}

// Additional interfaces needed by the application
export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent?: number;
  period: string;
  active?: boolean;
  user_id: string;
}

export interface Loan {
  id: string;
  type: string;
  description: string;
  amount: number;
  paid_amount?: number;
  remaining_amount?: number; 
  status: string;
  due_date?: string;
  borrower?: string;
  user_id: string;
}

export interface Payment {
  id: string;
  debt_id?: string;
  amount: number;
  payment_date: string;
  transaction_id?: string;
  user_id?: string;
}

export interface Saving {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string;
  savings_category?: string;
  user_id: string;
}
