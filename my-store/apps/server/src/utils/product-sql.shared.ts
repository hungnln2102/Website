/**
 * Shared SQL fragments for product pricing queries.
 * Used by products-list.service and promotions.service.
 */
import { TABLES } from "../config/db.config";

/** CTE: max supplier cost per variant. */
export const SUPPLY_MAX_CTE = `
  supply_max AS (
    SELECT sc.variant_id, MAX(sc.price::numeric) AS price_max
    FROM ${TABLES.SUPPLIER_COST} sc
    GROUP BY sc.variant_id
  )`;
