/**
 * Products list: one row per package (lowest price variant), with sales counts and promo info.
 */
import pool from "../config/database";
import { TABLES } from "../config/db.config";
import { resolveImageUrl, slugify, stripHtml, toNumber } from "../utils/product-helpers";

type RawProductRow = {
  id: number | bigint;
  id_product: string | number | bigint | null;
  package: string | null;
  package_product: string | null;
  pct_ctv: string | null;
  pct_khach: string | null;
  pct_promo: string | null;
  has_promo: boolean;
  is_active: boolean;
  price_max: string | null;
  sale_price: string | null;
  promo_price: string | null;
  package_count: number | bigint | null;
  sales_count: number | bigint | null;
  description: string | null;
  image_url: string | null;
};

export async function getProductsList() {
  const query = `
    WITH supply_max AS (
      SELECT sc.product_id, MAX(sc.price::numeric) AS price_max
      FROM ${TABLES.SUPPLIER_COST} sc
      GROUP BY sc.product_id
    ),
    priced AS (
      SELECT
        p.id AS id,
        v.display_name AS id_product,
        p.package_name AS package,
        v.variant_name AS package_product,
        v.is_active AS is_active,
        COALESCE(pc.pct_ctv, 0) AS pct_ctv,
        COALESCE(pc.pct_khach, 0) AS pct_khach,
        pc.pct_promo AS pct_promo,
        (pc.pct_promo IS NOT NULL) AS has_promo,
        COALESCE(sm.price_max, 0) AS price_max,
        COALESCE(vsc.sales_count, 0) AS sales_count,
        pd.description,
        p.image_url AS image_url,
        p.created_at AS created_at
      FROM ${TABLES.VARIANT} v
      LEFT JOIN ${TABLES.PRODUCT} p ON p.id = v.product_id
      LEFT JOIN LATERAL (
        SELECT
          pc.pct_ctv,
          pc.pct_khach,
          pc.pct_promo
        FROM ${TABLES.PRICE_CONFIG} pc
        WHERE pc.variant_id = v.id
        ORDER BY pc.updated_at DESC NULLS LAST
        LIMIT 1
      ) pc ON TRUE
      LEFT JOIN supply_max sm ON sm.product_id = v.id
      LEFT JOIN product.variant_sold_count vsc
        ON vsc.variant_id = v.id
      LEFT JOIN ${TABLES.PRODUCT_DESC} pd
        ON TRIM(pd.product_id::text) = TRIM(SPLIT_PART(v.display_name::text, '--', 1))
      WHERE p.package_name IS NOT NULL
    ),
    ranked AS (
      SELECT
        priced.*,
        (COALESCE(priced.pct_ctv::numeric, 0) * priced.price_max * COALESCE(priced.pct_khach::numeric, 0))
          AS sale_price,
        (COALESCE(priced.pct_ctv::numeric, 0) * priced.price_max * COALESCE(priced.pct_khach::numeric, 0))
          * (1 - COALESCE(priced.pct_promo::numeric, 0)) AS promo_price,
        COALESCE(psc.total_sales_count, 0) AS package_sales_count,
        COALESCE(p30d.sold_count_30d, 0) AS sold_count_30d,
        ROW_NUMBER() OVER (
          PARTITION BY priced.package
          ORDER BY (COALESCE(priced.pct_ctv::numeric, 0) * priced.price_max * COALESCE(priced.pct_khach::numeric, 0)) ASC
        ) AS rn,
        COUNT(*) OVER (PARTITION BY priced.package) AS package_count,
        BOOL_OR(priced.is_active) OVER (PARTITION BY priced.package) AS has_active_variant
      FROM priced
      LEFT JOIN product.product_sold_count psc
        ON psc.package_name = priced.package
      LEFT JOIN product.product_sold_30d p30d
        ON p30d.product_id = priced.id
    )
    SELECT
      id,
      id_product,
      package,
      package_product,
      pct_ctv,
      pct_khach,
      pct_promo,
      has_promo,
      has_active_variant AS is_active,
      price_max,
      sale_price,
      promo_price,
      package_count,
      package_sales_count AS sales_count,
      sold_count_30d,
      description,
      image_url,
      created_at
    FROM ranked
    WHERE rn = 1
    ORDER BY package;
  `;
  const { rows } = await pool.query<RawProductRow>(query);

  return rows.map((row) => {
    const name = row.package ?? row.id_product ?? "San pham";
    const basePrice = toNumber(row.sale_price);
    const discountPctRaw = toNumber(row.pct_promo);
    const discountPct = discountPctRaw > 1 ? discountPctRaw : discountPctRaw * 100;
    const packageCount = toNumber(row.package_count) || 1;
    const hasPromo = row.has_promo === true;
    const extended = row as RawProductRow & { sold_count_30d?: unknown; created_at?: unknown };

    return {
      id: toNumber(row.id),
      slug: slugify(String(name || (row.id_product ?? row.id))),
      name,
      package: row.package ?? "",
      package_product: row.package_product ?? null,
      description: stripHtml(row.description) || "Chưa có mô tả",
      image_url: resolveImageUrl(row.image_url),
      base_price: basePrice,
      discount_percentage: discountPct,
      has_promo: hasPromo,
      is_active: row.is_active !== false,
      sales_count: toNumber(row.sales_count),
      sold_count_30d: toNumber(extended.sold_count_30d || 0),
      average_rating: 0,
      package_count: packageCount,
      created_at: extended.created_at ?? null,
    };
  });
}
