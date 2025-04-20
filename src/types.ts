export interface Loan {
  id: string
  user_id: string
  amount: number
  type: "payable" | "receivable"
  description: string
  lender?: string
  borrower?: string
  status: "paid" | "unpaid" | "partial"
  due_date: string
  paid_amount?: number
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  loan_id: string
  user_id: string
  amount: number
  payment_date: string
  wallet_id: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: "income" | "expense"
  icon?: string
  color?: string
  created_at: string
  updated_at: string
}

export interface Wallet {
  id: string
  user_id: string
  name: string
  balance: number
  type: string // Mengubah ke string untuk menghindari error tipe
  color: string
  is_default: boolean
  created_at: string
  updated_at: string
  gradient: string
}

export interface Saving {
  id: string
  user_id: string
  name: string
  description?: string
  target_amount: number
  current_amount: number
  target_date?: string
  category?: string
  created_at: string
  updated_at: string
  icon?: string
  color?: string
  is_completed?: boolean
  auto_save?: boolean
  auto_save_percentage?: number
  auto_save_frequency?: string
}

export interface SavingTransaction {
  id: string
  savings_id: string
  wallet_id: string
  amount: number
  type: 'deposit' | 'withdraw'
  date: string
  notes?: string
  user_id: string
  created_at: string
  updated_at?: string
  wallet?: Wallet
}

// Asset types
export interface Asset {
  id: string;
  user_id: string;
  name: string;
  category: "property" | "vehicle" | "gold" | "stock" | "other";
  initial_value: number;
  current_value: number;
  purchase_date?: string;
  purchase_year?: number;
  created_at: string;
  updated_at: string;
}

export interface AssetValueHistory {
  id: string;
  asset_id: string;
  user_id: string;
  value: number;
  date: string;
  created_at: string;
  updated_at: string;
}
