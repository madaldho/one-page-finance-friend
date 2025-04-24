-- Membuat tabel asset_transactions untuk menyimpan catatan penjualan aset
CREATE TABLE IF NOT EXISTS public.asset_transactions (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id),
  amount NUMERIC NOT NULL,
  admin_fee NUMERIC DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  type VARCHAR(10) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membuat indeks untuk mempercepat pencarian
CREATE INDEX IF NOT EXISTS asset_transactions_user_id_idx ON public.asset_transactions(user_id);
CREATE INDEX IF NOT EXISTS asset_transactions_asset_id_idx ON public.asset_transactions(asset_id);
CREATE INDEX IF NOT EXISTS asset_transactions_transaction_id_idx ON public.asset_transactions(transaction_id);

-- Membuat kebijakan keamanan RLS (Row-Level Security)
ALTER TABLE public.asset_transactions ENABLE ROW LEVEL SECURITY;

-- Kebijakan untuk memastikan pengguna hanya dapat melihat transaksi mereka sendiri
CREATE POLICY "Users can only view their own asset transactions" 
  ON public.asset_transactions
  FOR SELECT
  USING (auth.uid() = user_id);
  
-- Kebijakan untuk memastikan pengguna hanya dapat membuat transaksi mereka sendiri
CREATE POLICY "Users can only create their own asset transactions" 
  ON public.asset_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
-- Kebijakan untuk memastikan pengguna hanya dapat memperbarui transaksi mereka sendiri
CREATE POLICY "Users can only update their own asset transactions" 
  ON public.asset_transactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  
-- Kebijakan untuk memastikan pengguna hanya dapat menghapus transaksi mereka sendiri
CREATE POLICY "Users can only delete their own asset transactions" 
  ON public.asset_transactions
  FOR DELETE
  USING (auth.uid() = user_id); 