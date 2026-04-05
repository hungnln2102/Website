/**
 * Products list: one row per package (lowest price variant), with sales counts and promo info.
 */
import pool from "../../config/database";
import { TABLES } from "../../config/db.config";
import { sqlRetailPrice, sqlPromoPrice } from "../../shared/utils/pricing";
import { SUPPLY_MAX_CTE } from "./product-sql.shared";
import { resolveImageUrl, slugify, toNumber } from "./product.helpers";
import { deriveProductSeo } from "./product-seo";

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
  short_desc: string | null;
  description: string | null;
  rules: string | null;
  image_url: string | null;
  min_nonzero_sale_price?: string | null;
  sold_count_30d?: string | number | bigint | null;
  created_at?: unknown;
};

export async function getProductsList() {
  const query = `
    WITH ${SUPPLY_MAX_CTE},
    priced AS (
      SELECT
        p.id AS id,
        v.display_name AS id_product,
        p.package_name AS package,
        v.variant_name AS package_product,
        v.is_active AS is_active,
        COALESCE(v.pct_ctv, 0) AS pct_ctv,
        COALESCE(v.pct_khach, 0) AS pct_khach,
        v.pct_promo AS pct_promo,
        (v.pct_promo IS NOT NULL) AS has_promo,
        COALESCE(sm.price_max, 0) AS price_max,
        COALESCE(vsc.sales_count, 0) AS sales_count,
        d.short_desc,
        d.description,
        d.rules,
        /* Ảnh gói (catalog): ưu tiên product; chỉ dùng variant khi gói chưa có ảnh. */
        COALESCE(p.image_url, v.image_url) AS image_url,
        p.created_at AS created_at
      FROM ${TABLES.VARIANT} v
      LEFT JOIN ${TABLES.PRODUCT} p ON p.id = v.product_id
      LEFT JOIN ${TABLES.DESC_VARIANT} d ON d.id = v.id_desc
      LEFT JOIN supply_max sm ON sm.variant_id = v.id
      LEFT JOIN ${TABLES.VARIANT_SOLD_COUNT} vsc
        ON vsc.variant_id = v.id
      WHERE p.package_name IS NOT NULL
        AND (p.is_active IS NULL OR p.is_active = true)
    ),
    sale_calc AS (
      SELECT
        priced.*,
        ${sqlRetailPrice('priced.price_max', 'priced.pct_ctv', 'priced.pct_khach')}
          AS sale_price,
        ${sqlPromoPrice('priced.price_max', 'priced.pct_ctv', 'priced.pct_khach', 'priced.pct_promo')}
          AS promo_price,
        COALESCE(psc.total_sales_count, 0) AS package_sales_count,
        COALESCE(p30d.sold_count_30d, 0) AS sold_count_30d,
        COUNT(*) OVER (PARTITION BY priced.package) AS package_count,
        BOOL_OR(priced.is_active) OVER (PARTITION BY priced.package) AS has_active_variant,
        MIN(
          CASE
            WHEN (${sqlRetailPrice('priced.price_max', 'priced.pct_ctv', 'priced.pct_khach')}) > 0
            THEN (${sqlRetailPrice('priced.price_max', 'priced.pct_ctv', 'priced.pct_khach')})
          END
        ) OVER (PARTITION BY priced.package) AS min_nonzero_sale_price
      FROM priced
      LEFT JOIN ${TABLES.PRODUCT_SOLD_COUNT} psc ON psc.package_name = priced.package
      LEFT JOIN ${TABLES.PRODUCT_SOLD_30D} p30d ON p30d.product_id = priced.id
    ),
    ranked AS (
      SELECT
        sale_calc.*,
        ROW_NUMBER() OVER (
          PARTITION BY sale_calc.package
          ORDER BY sale_calc.sale_price ASC
        ) AS rn
      FROM sale_calc
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
      short_desc,
      description,
      rules,
      image_url,
      created_at,
      min_nonzero_sale_price
    FROM ranked
    WHERE rn = 1
    ORDER BY package;
  `;
  const { rows } = await pool.query<RawProductRow>(query);

  return rows.map((row) => {
    const seo = deriveProductSeo({
      shortDesc: row.short_desc,
      descriptionHtml: row.description,
      rulesHtml: row.rules,
    });
    const basePrice = toNumber(row.sale_price);
    const discountPctRaw = toNumber(row.pct_promo);
    const discountPct = discountPctRaw > 1 ? discountPctRaw : discountPctRaw * 100;
    const packageCount = toNumber(row.package_count) || 1;
    const hasPromo = row.has_promo === true;
    const fromPrice = toNumber(row.min_nonzero_sale_price);
    const routeSlug = slugify(String(row.package || row.id_product || row.id));

    return {
      id: toNumber(row.id),
      slug: routeSlug,
      seo_slug: seo.slug,
      name: row.package ?? row.package_product ?? seo.heading,
      package: row.package ?? "",
      package_product: row.package_product ?? null,
      description: seo.shortDescription || null,
      short_description: seo.shortDescription,
      full_description: seo.descriptionHtml || row.description || null,
      purchase_rules: seo.rulesHtml || row.rules || null,
      seo_title: seo.title,
      image_alt: seo.imageAlt,
      image_url: resolveImageUrl(row.image_url),
      base_price: basePrice,
      from_price: fromPrice > 0 ? fromPrice : basePrice,
      discount_percentage: discountPct,
      has_promo: hasPromo,
      is_active: row.is_active !== false,
      sales_count: toNumber(row.sales_count),
      sold_count_30d: toNumber(row.sold_count_30d || 0),
      average_rating: 0,
      package_count: packageCount,
      created_at: row.created_at ?? null,
    };
  });
}
