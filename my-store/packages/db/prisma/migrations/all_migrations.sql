-- =============================================================================
-- ALL MIGRATIONS — Chạy file này để áp dụng toàn bộ migrations
-- Chạy: npm run db:migrate:all -w @my-store/db
-- Hoặc: psql $DATABASE_URL -f packages/db/prisma/migrations/all_migrations.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. package_name (product)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'product' AND table_name = 'product' AND column_name = 'package_name'
  ) THEN
    ALTER TABLE product.product ADD COLUMN package_name text;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'product' AND table_name = 'product' AND column_name = 'name'
    ) THEN
      UPDATE product.product SET package_name = name WHERE package_name IS NULL;
    END IF;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Schema updates (product, variant, product_desc, supplier_cost)
-- -----------------------------------------------------------------------------
ALTER TABLE product.product ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE product.product ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE product.product ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE product.variant ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS idx_variant_product_display_name 
  ON product.variant(product_id, display_name);

ALTER TABLE product.product_desc ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE product.supplier_cost ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE product.supplier_cost ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;

-- -----------------------------------------------------------------------------
-- 3. order_list: order_expired -> expired_at
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'orders' AND table_name = 'order_list' AND column_name = 'order_expired'
  ) THEN
    ALTER TABLE orders.order_list RENAME COLUMN order_expired TO expired_at;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4. supply_id (order_list, order_expired, order_canceled)
-- -----------------------------------------------------------------------------
ALTER TABLE orders.order_list ADD COLUMN IF NOT EXISTS supply_id INTEGER;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'orders' AND table_name = 'order_expired') THEN
    ALTER TABLE orders.order_expired ADD COLUMN IF NOT EXISTS supply_id INTEGER;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'orders' AND table_name = 'order_canceled') THEN
    ALTER TABLE orders.order_canceled ADD COLUMN IF NOT EXISTS supply_id INTEGER;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4b. order_list.id_product — đồng bộ admin_orderlist: VARCHAR(255), thường là variant.variant_name
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'orders' AND table_name = 'order_list'
      AND column_name = 'id_product' AND udt_name IN ('int4', 'int8')
  ) THEN
    ALTER TABLE orders.order_list
      ALTER COLUMN id_product TYPE varchar(255) USING id_product::text;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. Index variant (product_id, is_active)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_variant_product_active ON product.variant (product_id, is_active);

-- -----------------------------------------------------------------------------
-- 6. Materialized views: variant_sold_count, product_sold_count
-- -----------------------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS product.product_sold_count CASCADE;
DROP MATERIALIZED VIEW IF EXISTS product.variant_sold_count CASCADE;

CREATE MATERIALIZED VIEW product.variant_sold_count AS
SELECT
  TRIM(v.display_name::text) AS variant_display_name,
  v.id AS variant_id,
  v.product_id,
  COALESCE(order_totals.sales_count, 0) AS sales_count,
  CURRENT_TIMESTAMP AS updated_at
FROM product.variant v
LEFT JOIN (
  SELECT v2.id AS variant_id_inner, COUNT(*)::int AS sales_count
  FROM orders.order_list ol
  INNER JOIN product.variant v2 ON (
    TRIM(BOTH FROM COALESCE(ol.id_product::text, '')) = TRIM(BOTH FROM COALESCE(v2.variant_name::text, ''))
    OR (
      TRIM(BOTH FROM COALESCE(ol.id_product::text, '')) ~ '^[0-9]+$'
      AND v2.id = TRIM(BOTH FROM COALESCE(ol.id_product::text, ''))::int
    )
  )
  WHERE ol.id_product IS NOT NULL
    AND TRIM(COALESCE(ol.id_product::text, '')) <> ''
  GROUP BY v2.id
) order_totals ON order_totals.variant_id_inner = v.id;

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

-- -----------------------------------------------------------------------------
-- 7. product_sold_30d (nếu chưa có)
-- -----------------------------------------------------------------------------
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
  SELECT v.product_id,
    COUNT(*)::int AS sold_count_30d,
    SUM(COALESCE(ol.price, 0))::numeric(15, 2) AS revenue_30d
  FROM orders.order_list ol
  INNER JOIN product.variant v ON (
    TRIM(BOTH FROM COALESCE(ol.id_product::text, '')) = TRIM(BOTH FROM COALESCE(v.variant_name::text, ''))
    OR (
      TRIM(BOTH FROM COALESCE(ol.id_product::text, '')) ~ '^[0-9]+$'
      AND v.id = TRIM(BOTH FROM COALESCE(ol.id_product::text, ''))::int
    )
  )
  WHERE ol.id_product IS NOT NULL
    AND TRIM(COALESCE(ol.id_product::text, '')) <> ''
    AND ol.order_date >= CURRENT_DATE - INTERVAL '30 days'
    AND ol.status NOT IN ('Đã Hủy', 'Chưa Hoàn', 'Đã Hoàn')
  GROUP BY v.product_id
) sold_data ON p.id = sold_data.product_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_sold_30d_product_id ON product.product_sold_30d(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sold_30d_sold_count ON product.product_sold_30d(sold_count_30d DESC);
CREATE INDEX IF NOT EXISTS idx_product_sold_30d_revenue ON product.product_sold_30d(revenue_30d DESC);
CREATE INDEX IF NOT EXISTS idx_product_sold_30d_updated_at ON product.product_sold_30d(updated_at DESC);

CREATE OR REPLACE FUNCTION product.refresh_product_sold_30d()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY product.product_sold_30d;
END;
$$ LANGUAGE plpgsql;

GRANT SELECT ON product.product_sold_30d TO PUBLIC;
REFRESH MATERIALIZED VIEW product.product_sold_30d;

-- -----------------------------------------------------------------------------
-- 8. Order system: wallet promotion_id, order_customer unique id_order
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'wallet' AND table_name = 'wallet_transactions') THEN
    ALTER TABLE wallet.wallet_transactions ADD COLUMN IF NOT EXISTS promotion_id INTEGER NULL;
    ALTER TABLE wallet.wallet_transactions DROP COLUMN IF EXISTS promo_code;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS order_customer_id_order_key ON orders.order_customer (id_order);

-- -----------------------------------------------------------------------------
-- 9. IP Whitelist & Site Settings (maintenance mode)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin.ip_whitelist (
  id          SERIAL PRIMARY KEY,
  ip_address  VARCHAR(45) NOT NULL,
  label       VARCHAR(100),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ip_whitelist_ip
  ON admin.ip_whitelist (ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_whitelist_active
  ON admin.ip_whitelist (is_active) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS admin.site_settings (
  key         VARCHAR(50) PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admin.site_settings (key, value)
VALUES ('maintenance_mode', 'off')
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- customer_web.customer_profiles — cooldown đổi ngày sinh (365 ngày)
-- -----------------------------------------------------------------------------
ALTER TABLE customer_web.customer_profiles
  ADD COLUMN IF NOT EXISTS date_of_birth_changed_at TIMESTAMPTZ;

-- -----------------------------------------------------------------------------
-- 10. Catalog /products + /promotions — chỉ mục hỗ trợ JOIN & GROUP BY (1.1)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_variant_margin_variant_id
  ON product.variant_margin (variant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_cost_variant_id
  ON product.supplier_cost (variant_id);

-- -----------------------------------------------------------------------------
-- DONE
-- -----------------------------------------------------------------------------
-- Các migration khác (create tables, cart, fix_wallet_sequence, ...) có thể đã
-- chạy trước đó. File này gom các migration thường cần cho môi trường mới.
