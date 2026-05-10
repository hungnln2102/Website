/**
 * Shared SQL fragments for product pricing queries.
 * Used by products-list.service and promotions.service.
 */
import pool from "../../config/database";
import { DB_SCHEMA, TABLES } from "../../config/db.config";

/** CTE: max supplier cost per variant. */
export const SUPPLY_MAX_CTE = `
  supply_max AS (
    SELECT sc.variant_id, MAX(sc.price::numeric) AS price_max
    FROM ${TABLES.SUPPLIER_COST} sc
    GROUP BY sc.variant_id
  )`;

/**
 * Pivot variant_margin → pct_ctv / pct_khach / pct_promo / pct_stu (đồng bộ admin_orderlist).
 * Dùng trong `LEFT JOIN LATERAL (... ) margins ON TRUE` — bảng variant phải alias là `v`.
 */
export const MARGIN_PIVOT_SQL = `
  SELECT
    MAX(CASE WHEN pt.key = 'ctv' THEN vm.margin_ratio END) AS pct_ctv,
    MAX(CASE WHEN pt.key = 'customer' THEN vm.margin_ratio END) AS pct_khach,
    MAX(CASE WHEN pt.key = 'promo' THEN vm.margin_ratio END) AS pct_promo,
    MAX(CASE WHEN pt.key = 'student' THEN vm.margin_ratio END) AS pct_stu
  FROM ${TABLES.VARIANT_MARGIN} vm
  JOIN ${TABLES.PRICING_TIER} pt ON pt.id = vm.tier_id
  WHERE vm.variant_id = v.id
`;

const MARGIN_FALLBACK_SQL = `
  SELECT
    0::numeric AS pct_ctv,
    0::numeric AS pct_khach,
    NULL::numeric AS pct_promo,
    NULL::numeric AS pct_stu
`;

let marginPivotSqlCache:
  | {
      sql: string;
      expiresAt: number;
      source: "tables" | "fallback";
    }
  | null = null;

const MARGIN_PIVOT_CACHE_MS = 60_000;

/**
 * Resolve margin SQL safely:
 * - Use variant_margin + pricing_tier when both tables exist.
 * - Fallback to zero margins when pricing tables are absent.
 *
 * This prevents runtime 500 when Website runs on DBs that no longer keep
 * legacy pricing pivot tables.
 */
export async function getMarginPivotSql(): Promise<string> {
  const now = Date.now();
  if (marginPivotSqlCache && marginPivotSqlCache.expiresAt > now) {
    return marginPivotSqlCache.sql;
  }

  const variantMarginSchema = DB_SCHEMA.VARIANT_MARGIN?.SCHEMA ?? "product";
  const variantMarginTable = DB_SCHEMA.VARIANT_MARGIN?.TABLE ?? "variant_margin";
  const pricingTierSchema = DB_SCHEMA.PRICING_TIER?.SCHEMA ?? "product";
  const pricingTierTable = DB_SCHEMA.PRICING_TIER?.TABLE ?? "pricing_tier";

  try {
    const { rows } = await pool.query<{
      has_variant_margin: boolean;
      has_pricing_tier: boolean;
    }>(
      `
        SELECT
          EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = $1 AND table_name = $2
          ) AS has_variant_margin,
          EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = $3 AND table_name = $4
          ) AS has_pricing_tier
      `,
      [variantMarginSchema, variantMarginTable, pricingTierSchema, pricingTierTable],
    );

    const hasVariantMargin = rows[0]?.has_variant_margin === true;
    const hasPricingTier = rows[0]?.has_pricing_tier === true;
    const usePivot = hasVariantMargin && hasPricingTier;
    const source = usePivot ? "tables" : "fallback";
    const sql = usePivot ? MARGIN_PIVOT_SQL : MARGIN_FALLBACK_SQL;

    marginPivotSqlCache = { sql, source, expiresAt: now + MARGIN_PIVOT_CACHE_MS };

    if (source === "fallback") {
      console.warn(
        `[pricing] Missing pricing pivot tables (${TABLES.VARIANT_MARGIN}, ${TABLES.PRICING_TIER}); fallback to zero-margin SQL.`,
      );
    }

    return sql;
  } catch (error) {
    marginPivotSqlCache = {
      sql: MARGIN_FALLBACK_SQL,
      source: "fallback",
      expiresAt: now + MARGIN_PIVOT_CACHE_MS,
    };
    console.warn(
      "[pricing] Failed to probe pricing pivot tables; fallback to zero-margin SQL:",
      (error as Error)?.message ?? error,
    );
    return MARGIN_FALLBACK_SQL;
  }
}
