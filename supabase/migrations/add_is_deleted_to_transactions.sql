-- Add is_deleted column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false; 