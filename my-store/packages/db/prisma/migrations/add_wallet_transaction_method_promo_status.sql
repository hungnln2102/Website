-- Add method, promo_code, status to wallet.wallet_transactions for Lịch sử giao dịch form
-- Phương thức (method), Khuyến mãi (promo_code), Trạng thái (status)

ALTER TABLE wallet.wallet_transactions
  ADD COLUMN IF NOT EXISTS method VARCHAR(50);

ALTER TABLE wallet.wallet_transactions
  ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);

ALTER TABLE wallet.wallet_transactions
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed';

COMMENT ON COLUMN wallet.wallet_transactions.method IS 'Phương thức thanh toán: balance, bank_transfer, topup, ...';
COMMENT ON COLUMN wallet.wallet_transactions.promo_code IS 'Mã khuyến mãi áp dụng (nếu có)';
COMMENT ON COLUMN wallet.wallet_transactions.status IS 'Trạng thái giao dịch: pending, completed, failed';
