/**
 * Categories list with product_ids per category.
 */
import pool from "../config/database";
import { TABLES } from "../config/db.config";

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
          FILTER (WHERE p.package_name IS NOT NULL),
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
