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
  wallet_id?: string
  wallet_name?: string
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
  name: string
  type: 'income' | 'expense'
  color?: string
  icon?: string
  user_id?: string
  created_at?: string
  updated_at?: string
}

export interface Wallet {
  id: string
  name: string
  type: string
  balance: number
  color?: string
  gradient?: string
  user_id: string
  created_at?: string
  updated_at?: string
  is_default?: boolean
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

export interface Asset {
  id: string
  user_id: string
  name: string
  category: "property" | "vehicle" | "gold" | "stock" | "other"
  initial_value: number
  purchase_date?: string
  purchase_year: number
  current_value: number
  created_at: string
  updated_at: string
}

export interface AssetValueHistory {
  id: string
  asset_id: string
  user_id: string
  value: number
  date: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  title: string
  amount: number
  type: 'income' | 'expense' | string
  date: string
  description?: string
  category?: string
  category_data?: Category
  wallet_id: string
  wallet_name?: string
  destination_wallet_id?: string | null
  destination_wallet_name?: string
  created_at?: string
  updated_at?: string
  user_id?: string
  selected?: boolean
  is_adjustment?: boolean
  is_deleted?: boolean
}
