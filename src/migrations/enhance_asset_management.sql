-- Migration: Enhanced Asset Management System - Simple Version
-- Date: 2025-09-13
-- Purpose: Add support for partial asset sales and improved transaction handling

-- Step 1: Add new columns to assets table for better asset management
ALTER TABLE assets ADD COLUMN quantity NUMERIC DEFAULT 1;
ALTER TABLE assets ADD COLUMN unit_type VARCHAR(20) DEFAULT 'unit';
ALTER TABLE assets ADD COLUMN is_divisible BOOLEAN DEFAULT false;

-- Step 2: Create index for better performance
CREATE INDEX idx_assets_is_divisible ON assets(is_divisible);
CREATE INDEX idx_assets_category ON assets(category);

-- Step 3: Update existing assets based on category to set divisibility
UPDATE assets SET 
  is_divisible = true,
  unit_type = 'shares'
WHERE category = 'stock' AND is_divisible = false;

UPDATE assets SET 
  is_divisible = true,
  unit_type = 'grams'
WHERE category = 'gold' AND is_divisible = false;

UPDATE assets SET 
  is_divisible = false,
  unit_type = 'unit'
WHERE category IN ('property', 'vehicle') AND is_divisible IS NULL;

-- For 'other' category, allow custom unit_type but default to 'unit'
UPDATE assets SET 
  is_divisible = false,
  unit_type = COALESCE(unit_type, 'unit')
WHERE category = 'other' AND is_divisible IS NULL;

-- Step 4: Add constraint to ensure quantity is positive
ALTER TABLE assets ADD CONSTRAINT assets_quantity_positive CHECK (quantity > 0);

-- Step 5: Improve asset_transactions table with better constraints
ALTER TABLE asset_transactions ADD COLUMN quantity_sold NUMERIC DEFAULT 1;
ALTER TABLE asset_transactions ADD COLUMN remaining_quantity NUMERIC;

-- Step 6: Add comments for documentation
COMMENT ON COLUMN assets.is_divisible IS 'Whether the asset can be sold in partial quantities (true for stocks, gold, etc.)';
COMMENT ON COLUMN assets.quantity IS 'Current quantity of the asset (shares for stocks, grams for gold, units for others)';
COMMENT ON COLUMN assets.unit_type IS 'Type of unit (shares, grams, units, etc.)';