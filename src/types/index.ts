
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
  debt_id?: string;
  related_id?: string;
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  type: string;
  color: string;
  icon?: string;
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
  color?: string;
  budget_type?: string;
  source_id?: string;
  source_name?: string;
  percent_value?: number;
  start_date?: string;
  end_date?: string;
}

export interface BudgetSource {
  id: string;
  name: string;
  type: string;
  amount: number;
  allocated?: number;
  used_percentage?: number;
  start_date?: string;
  end_date?: string;
  categories?: string;
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
  description?: string;
  savings_type?: string;
  wallet_id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Loan {
  id: string;
  title: string;
  amount: number;
  remaining_amount: number;
  due_date: string;
  type: "receivable" | "payable";
  status: "unpaid" | "paid" | "partial";
  lender?: string;
  installments?: number;
  wallet_name?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DebtContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  type: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  amount: number;
  payment_date: string;
  transaction_id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  type: string;
  icon?: string;
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
  show_goals?: boolean;
  show_reports?: boolean;
  currency?: string;
  language?: string;
  theme?: string;
  notification_enabled?: boolean;
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
      budget_sources: {
        Row: BudgetSource;
        Insert: Omit<BudgetSource, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BudgetSource, 'id' | 'created_at' | 'updated_at'>>;
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
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>;
      };
      debt_contacts: {
        Row: DebtContact;
        Insert: Omit<DebtContact, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DebtContact, 'id' | 'created_at' | 'updated_at'>>;
      };
      debt_payments: {
        Row: DebtPayment;
        Insert: Omit<DebtPayment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DebtPayment, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
