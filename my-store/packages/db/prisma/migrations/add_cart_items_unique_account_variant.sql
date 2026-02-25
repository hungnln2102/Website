-- Cart: đảm bảo UNIQUE(account_id, variant_id) để INSERT ... ON CONFLICT (account_id, variant_id) hoạt động.
-- (id là cột tự sinh, không insert giá trị.)

ALTER TABLE cart.cart_items
  DROP CONSTRAINT IF EXISTS cart_items_account_variant_unique;

ALTER TABLE cart.cart_items
  ADD CONSTRAINT cart_items_account_variant_unique UNIQUE (account_id, variant_id);
