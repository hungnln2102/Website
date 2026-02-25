-- Sau khi chạy: ALTER TABLE product.supplier_cost RENAME COLUMN product_id TO variant_id;
-- Cập nhật index cho cột mới (schema product hoặc theo env)

DROP INDEX IF EXISTS product.idx_supplier_cost_product_id;
CREATE INDEX IF NOT EXISTS idx_supplier_cost_variant_id ON product.supplier_cost(variant_id);
