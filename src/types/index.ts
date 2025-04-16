export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  date: string;
  category: string;
  wallet?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  type: string;
  color: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: string;
  spent?: number;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Saving {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  progress?: number;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Loan {
  id: string;
  description: string;
  amount: number;
  type: "receivable" | "payable";
  status: "unpaid" | "paid" | "partial";
  borrower: string | null;
  due_date: string | null;
  paid_amount: number | null;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  show_budgeting: boolean;
  show_savings: boolean;
  show_loans: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Database {
  public: {
    Tables: {
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Transaction, 'id' | 'created_at' | 'updated_at'>>;
      };
      wallets: {
        Row: Wallet;
        Insert: Omit<Wallet, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Wallet, 'id' | 'created_at' | 'updated_at'>>;
      };
      budgets: {
        Row: Budget;
        Insert: Omit<Budget, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Budget, 'id' | 'created_at' | 'updated_at'>>;
      };
      savings: {
        Row: Saving;
        Insert: Omit<Saving, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Saving, 'id' | 'created_at' | 'updated_at'>>;
      };
      loans: {
        Row: Loan;
        Insert: Omit<Loan, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Loan, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_settings: {
        Row: UserSettings;
        Insert: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
