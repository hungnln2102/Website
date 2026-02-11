-- Index trên bảng product.variant (product_id, is_active)
-- Tối ưu tốc độ khi:
--   - GET /products: JOIN variant theo product_id
--   - GET /promotions: WHERE v.is_active = true
--   - Mọi truy vấn "variants của product X" hoặc "variant đang active"
CREATE INDEX IF NOT EXISTS idx_variant_product_active
ON product.variant (product_id, is_active);
