/**
 * Shared SQL fragments for product pricing queries.
 * Used by products-list.service and promotions.service.
 */
import { TABLES } from "../../config/db.config";

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
