/**
 * Categories list with product_ids per category.
 */
import pool from "../../config/database";
import { TABLES } from "../../config/db.config";

type CategoryRow = {
  id: number;
  name: string;
  created_at: Date | string | null;
  color: string | null;
  product_ids: Array<number | bigint> | null;
};

export async function getCategoriesList(): Promise<CategoryRow[]> {
  const query = `
    SELECT
      c.id,
      c.name,
      c.created_at,
      c.color,
      COALESCE(
        ARRAY_AGG(DISTINCT p.id ORDER BY p.id)
          FILTER (WHERE
            (p.is_active IS NULL OR p.is_active = true)
            AND (
              NULLIF(TRIM(BOTH FROM COALESCE(p.package_name::text, '')), '') IS NOT NULL
              OR EXISTS (
                SELECT 1 FROM ${TABLES.VARIANT} vv
                WHERE vv.product_id = p.id
                  AND (
                    NULLIF(TRIM(BOTH FROM COALESCE(vv.display_name::text, '')), '') IS NOT NULL
                    OR NULLIF(TRIM(BOTH FROM COALESCE(vv.variant_name::text, '')), '') IS NOT NULL
                  )
              )
            )
          ),
        ARRAY[]::int[]
      ) AS product_ids
    FROM ${TABLES.CATEGORY} c
    LEFT JOIN ${TABLES.PRODUCT_CATEGORY} pc ON pc.category_id = c.id
    LEFT JOIN ${TABLES.PRODUCT} p ON p.id = pc.product_id
    GROUP BY c.id, c.name, c.created_at, c.color
    ORDER BY c.id;
  `;
  const { rows } = await pool.query<CategoryRow>(query);
  return rows;
}
