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
