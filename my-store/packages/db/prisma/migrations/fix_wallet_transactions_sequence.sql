-- Fix sequence wallet.wallet_transactions_id_seq lệch (duplicate key id=1).
-- Chạy khi gặp lỗi: duplicate key value violates unique constraint "wallet_transactions_pkey"

SELECT setval(
  pg_get_serial_sequence('wallet.wallet_transactions', 'id'),
  COALESCE((SELECT MAX(id) FROM wallet.wallet_transactions), 1)
);
