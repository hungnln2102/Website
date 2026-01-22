-- Add indexes for better query performance
-- Run this after deploying to production

-- Variant table indexes
CREATE INDEX IF NOT EXISTS idx_variant_active ON variant(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_variant_product_id ON variant(product_id);

-- Product table indexes
CREATE INDEX IF NOT EXISTS idx_product_category_id ON product(category_id);
CREATE INDEX IF NOT EXISTS idx_product_name ON product(name);

-- Supplier cost indexes
CREATE INDEX IF NOT EXISTS idx_supplier_cost_product_id ON supplier_cost(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_cost_price ON supplier_cost(price);

-- Price config indexes
CREATE INDEX IF NOT EXISTS idx_price_config_variant_id ON price_config(variant_id);
CREATE INDEX IF NOT EXISTS idx_price_config_active ON price_config(active) WHERE active = true;

-- Product description indexes
CREATE INDEX IF NOT EXISTS idx_product_desc_name ON product_desc(name);

-- Order indexes for sales count aggregation
CREATE INDEX IF NOT EXISTS idx_order_list_variant_id ON order_list(variant_id);
CREATE INDEX IF NOT EXISTS idx_order_expired_variant_id ON order_expired(variant_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_variant_product_active ON variant(product_id, active);
CREATE INDEX IF NOT EXISTS idx_price_config_variant_active ON price_config(variant_id, active);

-- Analyze tables to update statistics
ANALYZE variant;
ANALYZE product;
ANALYZE supplier_cost;
ANALYZE price_config;
ANALYZE product_desc;
ANALYZE order_list;
ANALYZE order_expired;
