-- Thời điểm lần cuối đổi ngày sinh — cooldown 365 ngày trên PUT /api/user/profile.
-- Bảng theo consolidated admin (`customer_web.customer_profiles`).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'customer_web' AND table_name = 'customer_profiles'
  ) THEN
    ALTER TABLE customer_web.customer_profiles
      ADD COLUMN IF NOT EXISTS date_of_birth_changed_at TIMESTAMPTZ;
    COMMENT ON COLUMN customer_web.customer_profiles.date_of_birth_changed_at IS
      'Lần cuối ghi nhận thay đổi date_of_birth; cooldown 365 ngày';
  END IF;
END $$;
