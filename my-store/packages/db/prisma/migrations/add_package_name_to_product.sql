-- Thêm cột package_name cho product.product (fix lỗi: column p.package_name does not exist)
-- Một số DB có thể dùng "name" thay vì package_name → copy dữ liệu nếu có

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'product' AND table_name = 'product' AND column_name = 'package_name'
  ) THEN
    ALTER TABLE product.product ADD COLUMN package_name text;
    -- Nếu có cột "name", copy sang package_name
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'product' AND table_name = 'product' AND column_name = 'name'
    ) THEN
      UPDATE product.product SET package_name = name WHERE package_name IS NULL;
    END IF;
  END IF;
END $$;
