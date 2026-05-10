/**
 * Best-selling variants in last 30d: do not group by package.
 */
import pool from "../../config/database";
import { TABLES } from "../../config/db.config";
import { sqlPromoPrice, sqlRetailPrice } from "../../shared/utils/pricing";
import { getMarginPivotSql, SUPPLY_MAX_CTE } from "./product-sql.shared";
import { resolveImageUrl, slugify, stripHtml, toNumber } from "./product.helpers";

const BEST_SELLING_MIN_30D = 50;
const BEST_SELLING_MAX_ROWS = 50;

function extractDurationToken(value: string | null | undefined): { amount: number; unit: "m" | "d" } | null {
  if (!value) return null;
  const match = value.match(/--\s*(\d+)\s*([md])\b/i);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = String(match[2]).toLowerCase() as "m" | "d";
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { amount, unit };
}

function stripDurationToken(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\s*--\s*\d+\s*[md]\b/gi, "").trim();
}

function formatDurationLabel(duration: { amount: number; unit: "m" | "d" } | null): string | null {
  if (!duration) return null;
  if (duration.unit === "m") return `${duration.amount} tháng`;
  return `${duration.amount} ngày`;
}

export async function getBestSellingVariants() {
  const marginPivotSql = await getMarginPivotSql();
  const query = `
    WITH ${SUPPLY_MAX_CTE},
    priced AS (
      SELECT
        p.id AS product_id,
        v.id AS variant_id,
        COALESCE(
          NULLIF(TRIM(BOTH FROM p.package_name::text), ''),
          NULLIF(TRIM(BOTH FROM v.display_name::text), ''),
          NULLIF(TRIM(BOTH FROM v.variant_name::text), ''),
          'product-' || p.id::text
        ) AS package,
        v.variant_name AS package_product,
        v.display_name AS id_product,
        v.is_active AS is_active,
        COALESCE(margins.pct_ctv, 0) AS pct_ctv,
        COALESCE(margins.pct_khach, 0) AS pct_khach,
        margins.pct_promo AS pct_promo,
        COALESCE(sm.price_max, 0) AS price_max,
        COALESCE(vsc.sales_count, 0) AS sold_count_30d,
        d.description,
        v.image_url AS image_url
      FROM ${TABLES.VARIANT} v
      LEFT JOIN ${TABLES.PRODUCT} p ON p.id = v.product_id
      LEFT JOIN ${TABLES.DESC_VARIANT} d ON d.id = v.id_desc
      LEFT JOIN LATERAL (${marginPivotSql}) margins ON TRUE
      LEFT JOIN supply_max sm ON sm.variant_id = v.id
      LEFT JOIN ${TABLES.VARIANT_SOLD_COUNT} vsc ON vsc.variant_id = v.id
      WHERE (p.is_active IS NULL OR p.is_active = true)
        AND (v.is_active IS NULL OR v.is_active = true)
        AND COALESCE(vsc.sales_count, 0) > $1
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
      sold_count_30d,
      ${sqlRetailPrice("price_max", "pct_ctv", "pct_khach")} AS sale_price,
      ${sqlPromoPrice("price_max", "pct_ctv", "pct_khach", "pct_promo")} AS promo_price,
      description,
      image_url
    FROM priced
    ORDER BY sold_count_30d DESC, variant_id DESC
    LIMIT $2;
  `;

  const { rows } = await pool.query<Record<string, unknown>>(query, [
    BEST_SELLING_MIN_30D,
    BEST_SELLING_MAX_ROWS,
  ]);

  return rows.map((row) => {
    const basePrice = toNumber(row.sale_price);
    const discountPctRaw = toNumber(row.pct_promo);
    const discountPct = discountPctRaw > 1 ? discountPctRaw : discountPctRaw * 100;
    const variantNameRaw = (row.package_product as string) ?? null; // product.variant.variant_name
    const displayNameRaw = (row.id_product as string) ?? null; // product.variant.display_name
    const duration = extractDurationToken(displayNameRaw);
    const durationLabel = formatDurationLabel(duration);
    const variantBaseName = stripDurationToken(variantNameRaw);
    const name =
      durationLabel && variantBaseName
        ? `${variantBaseName} - ${durationLabel}`
        : variantBaseName || "Biến thể bán chạy";

    return {
      id: toNumber(row.variant_id),
      variant_id: toNumber(row.variant_id),
      product_id: toNumber(row.product_id),
      slug: slugify((row.package as string) || String(row.product_id)),
      name,
      package: (row.package as string) ?? "",
      package_product: (row.package_product as string) ?? null,
      id_product: (row.id_product as string) ?? null,
      description:
        stripHtml((row.description as string) ?? null) || "Sản phẩm được mua nhiều trong 30 ngày",
      image_url: resolveImageUrl((row.image_url as string) ?? null),
      base_price: basePrice,
      from_price: basePrice,
      discount_percentage: Math.max(0, discountPct),
      has_promo: discountPct > 0,
      sales_count: toNumber(row.sold_count_30d),
      sold_count_30d: toNumber(row.sold_count_30d),
      average_rating: 0,
      package_count: 1,
      is_active: true,
    };
  });
}

