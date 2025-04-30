export interface Category {
  id: string;
  name: string;
  color?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  email?: string;
  is_admin?: boolean;
  subscription_type?: 'free' | 'pro_6m' | 'pro_12m';
  trial_start?: string;
  trial_end?: string;
  created_at?: string;
  updated_at?: string;
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
  user_id: string;
  title: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  date: string;
  category: string;
  wallet_id: string;
  description?: string;
  destination_wallet_id?: string;
  fee?: number;
  is_adjustment?: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TransactionWithNames extends Transaction {
  wallet_name?: string;
  category_name?: string;
  destination_wallet_name?: string;
}

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
  type: "payable" | "receivable";
  borrower?: string;
  lender?: string;
  due_date?: string;
  status: "paid" | "unpaid" | "partial";
  paid_amount?: number;
  wallet_id?: string;
  wallet_name?: string;
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
  wallet_id?: string;
  wallet_name?: string;
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

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  category: string;
  initial_value: number;
  current_value: number;
  purchase_date: string | null;
  purchase_year: number | null;
  created_at: string;
  updated_at: string;
}

export interface AssetValueHistory {
  id: string;
  asset_id: string;
  value: number;
  date: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface AssetTransaction {
  id: string;
  user_id: string;
  asset_id: string;
  transaction_id: string;
  amount: number;
  admin_fee: number;
  net_amount: number;
  type: "sale" | "purchase";
  date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
