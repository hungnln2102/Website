-- Rename order_list.order_expired -> expired_at (tránh nhầm với bảng order_expired đã deprecated)
ALTER TABLE orders.order_list RENAME COLUMN order_expired TO expired_at;
