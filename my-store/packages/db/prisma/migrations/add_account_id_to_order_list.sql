-- Add account_id to order_list to link orders to user (for Lịch sử đơn hàng)
-- Run in orders schema; customer.accounts is in customer schema
ALTER TABLE orders.order_list
  ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES customer.accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_order_list_account_id ON orders.order_list(account_id);

COMMENT ON COLUMN orders.order_list.account_id IS 'User account that placed the order (for balance/MCoin payments)';
