-- Cart: thêm cột price_type để xác định lấy giá khuyến mãi / khách lẻ / CTV
-- Giá thực tế tính từ variant + price_config theo price_type khi GET cart

ALTER TABLE cart.cart_items
  ADD COLUMN IF NOT EXISTS price_type VARCHAR(20) NOT NULL DEFAULT 'retail';

ALTER TABLE cart.cart_items
  DROP CONSTRAINT IF EXISTS cart_items_price_type_check;

ALTER TABLE cart.cart_items
  ADD CONSTRAINT cart_items_price_type_check
  CHECK (price_type IN ('retail', 'promo', 'ctv'));

COMMENT ON COLUMN cart.cart_items.price_type IS 'retail = giá khách lẻ, promo = giá khuyến mãi, ctv = giá cộng tác viên';
