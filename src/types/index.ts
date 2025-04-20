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
  category_name?: string;
  wallet_name?: string;
  wallet_data?: Wallet;
}

// Additional interfaces needed by the application
export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent?: number;
  period: string;
  period_display?: string;
  active?: boolean;
  user_id: string;
  start_date?: string;
  end_date?: string;
  source_id?: string;
  source_percentage?: number;
}

export interface Loan {
  id: string;
  user_id: string;
  title: string;
  description: string;
  amount: number;
  type: string;
  borrower?: string;
  lender?: string;
  due_date?: string;
  status: string;
  paid_amount?: number;
  created_at?: string;
  updated_at?: string;
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
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  description?: string;
  savings_type?: string;
  savings_category?: 'digital' | 'fisik';
  wallet_id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SavingTransaction {
  id: string;
  user_id: string;
  savings_id: string;
  wallet_id: string;
  amount: number;
  type: 'deposit' | 'withdraw';
  date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  wallet?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface Database {
  public: {
    Tables: {
      // ... existing tables ...
      
      savings: {
        Row: Saving;
        Insert: Omit<Saving, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Saving, 'id' | 'created_at' | 'updated_at'>>;
      };
      
      savings_transactions: {
        Row: SavingTransaction;
        Insert: Omit<SavingTransaction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SavingTransaction, 'id' | 'created_at' | 'updated_at'>>;
      };
      
      loans: {
        Row: Loan;
        Insert: Omit<Loan, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Loan, 'id' | 'created_at' | 'updated_at'>>;
      };
      
      // ... existing tables ...
    };
  };
}
