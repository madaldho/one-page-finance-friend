-- Fix categories table to have proper ID generation
ALTER TABLE categories ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Also ensure the table has proper indexes and constraints
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);