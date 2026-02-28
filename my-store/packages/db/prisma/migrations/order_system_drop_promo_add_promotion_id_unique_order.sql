-- ORDER_SYSTEM: drop promo_code, add promotion_id, unique id_order
-- promotion_id (FK) thay thế promo_code; id_order không trùng, mỗi sản phẩm 1 id

-- 1) wallet.wallet_transactions: add promotion_id, drop promo_code
ALTER TABLE wallet.wallet_transactions
  ADD COLUMN IF NOT EXISTS promotion_id INTEGER NULL;

ALTER TABLE wallet.wallet_transactions
  DROP COLUMN IF EXISTS promo_code;

COMMENT ON COLUMN wallet.wallet_transactions.promotion_id IS 'FK bảng promotion';

-- 2) orders.order_customer: unique id_order (mỗi sản phẩm 1 mã, không trùng)
CREATE UNIQUE INDEX IF NOT EXISTS order_customer_id_order_key
  ON orders.order_customer (id_order);
