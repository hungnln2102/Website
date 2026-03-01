-- Add supply_id (int, id supplier) to order_list / order_expired / order_canceled if missing.
-- Cột supply đã đổi thành supply_id kiểu int để lưu id của partner.supplier.

ALTER TABLE orders.order_list ADD COLUMN IF NOT EXISTS supply_id INTEGER;
ALTER TABLE orders.order_expired ADD COLUMN IF NOT EXISTS supply_id INTEGER;
ALTER TABLE orders.order_canceled ADD COLUMN IF NOT EXISTS supply_id INTEGER;
