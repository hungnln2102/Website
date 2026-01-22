-- ============================================
-- MATERIALIZED VIEWS FOR SOLD COUNT
-- ============================================

-- Drop existing views if exist
DROP MATERIALIZED VIEW IF EXISTS product.variant_sold_count CASCADE;
DROP MATERIALIZED VIEW IF EXISTS product.product_sold_count CASCADE;

-- ============================================
-- VIEW 1: Variant Sold Count (Chi tiết từng gói)
-- ============================================
CREATE MATERIALIZED VIEW product.variant_sold_count AS
SELECT
  TRIM(v.display_name::text) AS variant_display_name,
  v.id AS variant_id,
  v.product_id,
  COALESCE(order_totals.sales_count, 0) AS sales_count,
  CURRENT_TIMESTAMP AS updated_at
FROM product.variant v
LEFT JOIN (
  SELECT
    id_product,
    SUM(sales_count)::int AS sales_count
  FROM (
    -- Count from order_list
    SELECT
      TRIM(ol.id_product::text) AS id_product,
      COUNT(*) AS sales_count
    FROM orders.order_list ol
    WHERE ol.id_product IS NOT NULL
    GROUP BY TRIM(ol.id_product::text)
    
    UNION ALL
    
    -- Count from order_expired
    SELECT
      TRIM(oe.id_product::text) AS id_product,
      COUNT(*) AS sales_count
    FROM orders.order_expired oe
    WHERE oe.id_product IS NOT NULL
    GROUP BY TRIM(oe.id_product::text)
  ) combined_orders
  GROUP BY id_product
) order_totals ON order_totals.id_product = TRIM(v.display_name::text);

-- Create indexes for variant_sold_count
CREATE UNIQUE INDEX idx_variant_sold_count_variant_id 
ON product.variant_sold_count(variant_id);

CREATE INDEX idx_variant_sold_count_display_name 
ON product.variant_sold_count(variant_display_name);

CREATE INDEX idx_variant_sold_count_product_id 
ON product.variant_sold_count(product_id);

CREATE INDEX idx_variant_sold_count_sales 
ON product.variant_sold_count(sales_count DESC);

-- ============================================
-- VIEW 2: Product Sold Count (Tổng tất cả gói)
-- ============================================
CREATE MATERIALIZED VIEW product.product_sold_count AS
SELECT
  p.id AS product_id,
  p.package_name,
  COALESCE(SUM(vsc.sales_count), 0)::int AS total_sales_count,
  CURRENT_TIMESTAMP AS updated_at
FROM product.product p
LEFT JOIN product.variant_sold_count vsc ON vsc.product_id = p.id
GROUP BY p.id, p.package_name;

-- Create indexes for product_sold_count
CREATE UNIQUE INDEX idx_product_sold_count_product_id 
ON product.product_sold_count(product_id);

CREATE INDEX idx_product_sold_count_sales 
ON product.product_sold_count(total_sales_count DESC);

-- ============================================
-- REFRESH FUNCTIONS
-- ============================================

-- Function to refresh variant sold count
CREATE OR REPLACE FUNCTION product.refresh_variant_sold_count()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY product.variant_sold_count;
  REFRESH MATERIALIZED VIEW CONCURRENTLY product.product_sold_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PERMISSIONS
-- ============================================
GRANT SELECT ON product.variant_sold_count TO PUBLIC;
GRANT SELECT ON product.product_sold_count TO PUBLIC;

-- ============================================
-- INITIAL REFRESH
-- ============================================
REFRESH MATERIALIZED VIEW product.variant_sold_count;
REFRESH MATERIALIZED VIEW product.product_sold_count;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check variant sold count
-- SELECT * FROM product.variant_sold_count ORDER BY sales_count DESC LIMIT 10;

-- Check product sold count (tổng tất cả variants)
-- SELECT * FROM product.product_sold_count ORDER BY total_sales_count DESC LIMIT 10;

-- Check specific product
-- SELECT 
--   p.package_name,
--   psc.total_sales_count as total_sold,
--   v.variant_name,
--   vsc.sales_count as variant_sold
-- FROM product.product p
-- JOIN product.product_sold_count psc ON psc.product_id = p.id
-- JOIN product.variant v ON v.product_id = p.id
-- JOIN product.variant_sold_count vsc ON vsc.variant_id = v.id
-- WHERE p.id = 'your-product-id';
