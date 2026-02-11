/**
 * Promotions list: variants that have pct_promo (discount).
 */
import pool from "../config/database";
import { TABLES } from "../config/db.config";
import { resolveImageUrl, slugify, stripHtml, toNumber } from "../utils/product-helpers";

export async function getPromotionsList() {
  const query = `
    WITH supply_max AS (
      SELECT sc.product_id, MAX(sc.price::numeric) AS price_max
      FROM ${TABLES.SUPPLIER_COST} sc
      GROUP BY sc.product_id
    ),
    priced AS (
      SELECT
        p.id AS product_id,
        p.package_name AS package,
        v.id AS variant_id,
        v.variant_name AS package_product,
        v.display_name AS id_product,
        v.is_active AS is_active,
        COALESCE(pc.pct_ctv, 0) AS pct_ctv,
        COALESCE(pc.pct_khach, 0) AS pct_khach,
        pc.pct_promo AS pct_promo,
        COALESCE(sm.price_max, 0) AS price_max,
        COALESCE(vsc.sales_count, 0) AS sales_count,
        pd.description,
        COALESCE(pd.image_url, p.image_url) AS image_url
      FROM ${TABLES.VARIANT} v
      LEFT JOIN ${TABLES.PRODUCT} p ON p.id = v.product_id
      INNER JOIN LATERAL (
        SELECT pc.pct_ctv, pc.pct_khach, pc.pct_promo
        FROM ${TABLES.PRICE_CONFIG} pc
        WHERE pc.variant_id = v.id AND pc.pct_promo IS NOT NULL AND pc.pct_promo > 0
        ORDER BY pc.updated_at DESC NULLS LAST
        LIMIT 1
      ) pc ON TRUE
      LEFT JOIN supply_max sm ON sm.product_id = v.id
      LEFT JOIN product.variant_sold_count vsc ON vsc.variant_id = v.id
      LEFT JOIN ${TABLES.PRODUCT_DESC} pd ON TRIM(pd.product_id::text) = TRIM(SPLIT_PART(v.display_name::text, '--', 1))
    )
    SELECT
      product_id,
      variant_id,
      package,
      package_product,
      id_product,
      pct_ctv,
      pct_khach,
      pct_promo,
      (COALESCE(pct_ctv::numeric, 0) * price_max * COALESCE(pct_khach::numeric, 0)) AS sale_price,
      (COALESCE(pct_ctv::numeric, 0) * price_max * COALESCE(pct_khach::numeric, 0)) * (1 - COALESCE(pct_promo::numeric, 0)) AS promo_price,
      sales_count,
      description,
      image_url
    FROM priced
    ORDER BY pct_promo DESC;
  `;
  const { rows } = await pool.query<Record<string, unknown>>(query);

  return rows.map((rowSummary: Record<string, unknown>) => {
    const name =
      (rowSummary.package_product as string) ||
      (rowSummary.package as string) ||
      "Khuyen mai";
    const basePrice = toNumber(rowSummary.sale_price);
    const discountPctRaw = toNumber(rowSummary.pct_promo);
    const discountPct = discountPctRaw > 1 ? discountPctRaw : discountPctRaw * 100;

    return {
      id: toNumber(rowSummary.product_id),
      variant_id: toNumber(rowSummary.variant_id),
      slug: slugify((rowSummary.package as string) || String(rowSummary.product_id)),
      name,
      package: (rowSummary.package as string) ?? "",
      id_product: rowSummary.id_product,
      description:
        stripHtml((rowSummary.description as string) ?? null) || "Khuyến mãi đặc biệt",
      image_url: resolveImageUrl((rowSummary.image_url as string) ?? null),
      base_price: basePrice,
      discount_percentage: discountPct,
      has_promo: true,
      sales_count: toNumber(rowSummary.sales_count),
      average_rating: 0,
    };
  });
}
