-- Bảng supplier (NCC) – khớp với db.config.ts SUPPLIER:
--   SCHEMA: partner (hoặc DB_SCHEMA_PARTNER)
--   TABLE: supplier
--   COLS: id, supplier_name, number_bank, bin_bank, active_supply
-- Chạy: psql $DATABASE_URL -f create_supplier_table.sql

CREATE SCHEMA IF NOT EXISTS partner;

CREATE TABLE IF NOT EXISTS partner.supplier (
  id             SERIAL PRIMARY KEY,
  supplier_name  TEXT NOT NULL,
  number_bank    TEXT,
  bin_bank       TEXT,
  active_supply  BOOLEAN DEFAULT true
);

COMMENT ON TABLE partner.supplier IS 'NCC – db.config SUPPLIER. Bot lấy danh sách khi Hoàn thành đơn (GET /api/orders/suppliers).';

-- Ví dụ dữ liệu (tùy chọn):
-- INSERT INTO partner.supplier (supplier_name) VALUES ('NCC 1'), ('NCC 2');
