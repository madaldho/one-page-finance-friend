export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
  sort_order: number | null;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  type: string;
  color: string | null;
  logo_url: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: string;
  date: string;
  category_id: string | null;
  wallet_id: string;
  description: string | null;
  attachment_url: string | null;
  is_recurring: boolean;
  recurring_id: string | null;
  created_at: string;
  updated_at: string;
  destination_wallet_id: string | null;
  is_adjustment: boolean;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  period: string;
  spent: number;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Saving {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  created_at: string;
  updated_at: string;
  description?: string;
  savings_category?: string;
  user_id: string;
}

export interface Loan {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: string;
  status: string;
  borrower: string | null;
  due_date: string | null;
  paid_amount: number | null;
  interest_rate: number | null;
  wallet_id: string | null;
  created_at: string;
  updated_at: string;
  wallet_name: string | null;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: string;
  category_id: string | null;
  wallet_id: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  last_occurrence: string | null;
  next_occurrence: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  category: string | null;
  priority: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  type: string;
  start_date: string;
  end_date: string;
  income_total: number;
  expense_total: number;
  savings_total: number;
  data: any;
  created_at: string;
  updated_at: string;
}

export interface UserSetting {
  id: string;
  user_id: string;
  currency: string;
  language: string;
  theme: string;
  show_budgeting: boolean;
  show_savings: boolean;
  show_loans: boolean;
  show_goals: boolean;
  show_reports: boolean;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithNames extends Transaction {
  wallet_name?: string;
  category_name?: string;
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
  created_at: string;
  updated_at: string;
}
