-- ============================================
-- REFRESH THỦ CÔNG MATERIALIZED VIEW
-- ============================================

-- Refresh materialized view product_sold_30d
REFRESH MATERIALIZED VIEW CONCURRENTLY product.product_sold_30d;

-- Hoặc gọi function
SELECT product.refresh_product_sold_30d();

-- Kiểm tra kết quả sau khi refresh
SELECT 
  product_id,
  package_name,
  sold_count_30d,
  revenue_30d,
  updated_at
FROM product.product_sold_30d
ORDER BY sold_count_30d DESC
LIMIT 10;
