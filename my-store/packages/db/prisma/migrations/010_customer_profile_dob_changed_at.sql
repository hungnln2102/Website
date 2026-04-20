-- Thời điểm lần cuối đổi ngày sinh — chỉ cho phép đổi lại sau 365 ngày (logic ở API).
-- Nếu schema khác "customer", sửa tên schema cho khớp DB_SCHEMA_CUSTOMER.
ALTER TABLE customer_web.customer_profiles
  ADD COLUMN IF NOT EXISTS date_of_birth_changed_at TIMESTAMPTZ;

COMMENT ON COLUMN customer_web.customer_profiles.date_of_birth_changed_at IS
  'Lần cuối ghi nhận thay đổi date_of_birth; cooldown 365 ngày trên PUT /api/user/profile';
