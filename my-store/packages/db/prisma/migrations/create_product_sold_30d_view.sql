
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
  -- Đếm theo id_product (display_name) và tổng hợp theo product_id
  SELECT
    v.product_id,
    COUNT(*)::int AS sold_count_30d,
    SUM(COALESCE(ol.price, 0))::numeric(15, 2) AS revenue_30d
  FROM orders.order_list ol
  INNER JOIN product.variant v ON TRIM(ol.id_product::text) = TRIM(v.display_name::text)
  WHERE ol.id_product IS NOT NULL
    AND ol.order_date >= CURRENT_DATE - INTERVAL '30 days'
    AND ol.status != 'cancelled'
  GROUP BY v.product_id
) sold_data ON p.id = sold_data.product_id;


CREATE UNIQUE INDEX idx_product_sold_30d_product_id 
ON product.product_sold_30d(product_id);

CREATE INDEX idx_product_sold_30d_sold_count 
ON product.product_sold_30d(sold_count_30d DESC);

CREATE INDEX idx_product_sold_30d_revenue 
ON product.product_sold_30d(revenue_30d DESC);

CREATE INDEX idx_product_sold_30d_updated_at 
ON product.product_sold_30d(updated_at DESC);


CREATE OR REPLACE FUNCTION product.refresh_product_sold_30d()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY product.product_sold_30d;
END;
$$ LANGUAGE plpgsql;


GRANT SELECT ON product.product_sold_30d TO PUBLIC;


REFRESH MATERIALIZED VIEW product.product_sold_30d;

DO $$
BEGIN

  IF EXISTS (
    SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron'
  ) THEN

    BEGIN
      CREATE EXTENSION IF NOT EXISTS pg_cron;
      

      PERFORM cron.schedule(
        'refresh_product_sold_30d',
        '*/5 * * * *',
        $cron$SELECT product.refresh_product_sold_30d()$cron$
      );
      
      RAISE NOTICE 'pg_cron extension enabled and job scheduled successfully';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'pg_cron extension not available or insufficient privileges. Cron job not scheduled.';
      RAISE NOTICE 'You can manually refresh the view using: REFRESH MATERIALIZED VIEW CONCURRENTLY product.product_sold_30d;';
    END;
  ELSE
    RAISE NOTICE 'pg_cron extension not available in this database. Cron job not scheduled.';
    RAISE NOTICE 'You can manually refresh the view using: REFRESH MATERIALIZED VIEW CONCURRENTLY product.product_sold_30d;';
  END IF;
END $$;

