-- ============================================================
-- Chạy trong Beekeeper Studio: mở tab SQL mới, dán từng block và Execute
-- ============================================================

-- ************************************************************
-- BLOCK 1: product.product_sold_30d (chạy block này trước)
-- ************************************************************

DROP MATERIALIZED VIEW IF EXISTS product.product_sold_30d CASCADE;

CREATE MATERIALIZED VIEW product.product_sold_30d AS
SELECT
  p.id AS product_id,
  p.package_name,
  COALESCE(sold_data.sold_count_30d, 0)::int AS sold_count_30d,
  COALESCE(sold_data.revenue_30d, 0)::numeric(15, 2) AS revenue_30d,
  CURRENT_TIMESTAMP AS updated_at
FROM product.product p
LEFT JOIN (
  SELECT
    v.product_id,
    COUNT(*)::int AS sold_count_30d,
    SUM(COALESCE(ol.price, 0))::numeric(15, 2) AS revenue_30d
  FROM orders.order_list ol
  INNER JOIN product.variant v ON ol.id_product = v.id
  WHERE ol.id_product IS NOT NULL
    AND ol.order_date >= CURRENT_DATE - INTERVAL '30 days'
    AND ol.status != 'cancelled'
  GROUP BY v.product_id
) sold_data ON p.id = sold_data.product_id;

CREATE UNIQUE INDEX idx_product_sold_30d_product_id ON product.product_sold_30d(product_id);
CREATE INDEX idx_product_sold_30d_sold_count ON product.product_sold_30d(sold_count_30d DESC);
CREATE INDEX idx_product_sold_30d_revenue ON product.product_sold_30d(revenue_30d DESC);
CREATE INDEX idx_product_sold_30d_updated_at ON product.product_sold_30d(updated_at DESC);

CREATE OR REPLACE FUNCTION product.refresh_product_sold_30d()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY product.product_sold_30d;
END;
$$ LANGUAGE plpgsql;

GRANT SELECT ON product.product_sold_30d TO PUBLIC;
REFRESH MATERIALIZED VIEW product.product_sold_30d;

-- ************************************************************
-- BLOCK 2: product.variant_sold_count + product.product_sold_count (chạy sau Block 1)
-- ************************************************************

DROP MATERIALIZED VIEW IF EXISTS product.variant_sold_count CASCADE;
DROP MATERIALIZED VIEW IF EXISTS product.product_sold_count CASCADE;

CREATE MATERIALIZED VIEW product.variant_sold_count AS
SELECT
  TRIM(v.display_name::text) AS variant_display_name,
  v.id AS variant_id,
  v.product_id,
  COALESCE(order_totals.sales_count, 0) AS sales_count,
  CURRENT_TIMESTAMP AS updated_at
FROM product.variant v
LEFT JOIN (
  SELECT variant_id, SUM(sales_count)::int AS sales_count
  FROM (
    SELECT ol.id_product::int AS variant_id, COUNT(*) AS sales_count
    FROM orders.order_list ol
    WHERE ol.id_product IS NOT NULL
    GROUP BY ol.id_product
    UNION ALL
    SELECT ol.id_product::int AS variant_id, COUNT(*) AS sales_count
    FROM orders.order_list ol
    WHERE ol.id_product IS NOT NULL
    GROUP BY ol.id_product
    UNION ALL
    SELECT oe.id_product::int AS variant_id, COUNT(*) AS sales_count
    FROM orders.order_expired oe
    WHERE oe.id_product IS NOT NULL
    GROUP BY oe.id_product
  ) combined_orders
  GROUP BY variant_id
) order_totals ON order_totals.variant_id = v.id;

CREATE UNIQUE INDEX idx_variant_sold_count_variant_id ON product.variant_sold_count(variant_id);
CREATE INDEX idx_variant_sold_count_display_name ON product.variant_sold_count(variant_display_name);
CREATE INDEX idx_variant_sold_count_product_id ON product.variant_sold_count(product_id);
CREATE INDEX idx_variant_sold_count_sales ON product.variant_sold_count(sales_count DESC);

CREATE MATERIALIZED VIEW product.product_sold_count AS
SELECT
  p.id AS product_id,
  p.package_name,
  COALESCE(SUM(vsc.sales_count), 0)::int AS total_sales_count,
  CURRENT_TIMESTAMP AS updated_at
FROM product.product p
LEFT JOIN product.variant_sold_count vsc ON vsc.product_id = p.id
GROUP BY p.id, p.package_name;

CREATE UNIQUE INDEX idx_product_sold_count_product_id ON product.product_sold_count(product_id);
CREATE INDEX idx_product_sold_count_sales ON product.product_sold_count(total_sales_count DESC);

CREATE OR REPLACE FUNCTION product.refresh_variant_sold_count()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY product.variant_sold_count;
  REFRESH MATERIALIZED VIEW CONCURRENTLY product.product_sold_count;
END;
$$ LANGUAGE plpgsql;

GRANT SELECT ON product.variant_sold_count TO PUBLIC;
GRANT SELECT ON product.product_sold_count TO PUBLIC;
REFRESH MATERIALIZED VIEW product.variant_sold_count;
REFRESH MATERIALIZED VIEW product.product_sold_count;
