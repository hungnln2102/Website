-- Schema updates theo docs/database.md
-- Thêm updated_at, is_active cho product; updated_at cho variant, product_desc; created_at, updated_at cho supplier_cost

-- product: thêm created_at, updated_at, is_active
ALTER TABLE product.product ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE product.product ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE product.product ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- variant: thêm updated_at, UNIQUE(product_id, display_name)
ALTER TABLE product.variant ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS idx_variant_product_display_name 
  ON product.variant(product_id, display_name);

-- product_desc: thêm updated_at
ALTER TABLE product.product_desc ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;

-- supplier_cost: thêm created_at, updated_at
ALTER TABLE product.supplier_cost ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE product.supplier_cost ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;
