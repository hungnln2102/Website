/**
 * Product package variants by package name (deduplicated by package_product + id_product + cost).
 */
import prisma from "@my-store/db";
import { toNumber } from "../utils/product-helpers";

type PackageProductRow = {
  id: number | bigint;
  package: string | null;
  package_product: string | null;
  id_product: string | null;
  cost: string | null;
};

export async function getProductPackages(packageName: string) {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    WITH supply_max AS (
      SELECT sc.product_id, MAX(sc.price::numeric) AS price_max
      FROM product.supplier_cost sc
      GROUP BY sc.product_id
    ),
    priced AS (
      SELECT
        v.id,
        p.package_name AS package,
        v.variant_name AS package_product,
        v.display_name AS id_product,
        v.created_at AS created_at,
        v.is_active AS is_active,
        v.form_id AS form_id,
        COALESCE(pc.pct_ctv, 0) AS pct_ctv,
        COALESCE(pc.pct_khach, 0) AS pct_khach,
        pc.pct_promo,
        COALESCE(sm.price_max, 0) AS price_max,
        COALESCE(vsc.sales_count, 0) AS sold_count_30d,
        pd.description,
        pd.image_url,
        pd.rules as purchase_rules
      FROM product.variant v
      LEFT JOIN product.product p ON p.id = v.product_id
      LEFT JOIN LATERAL (
        SELECT pc.pct_ctv, pc.pct_khach, pc.pct_promo
        FROM product.price_config pc
        WHERE pc.variant_id = v.id
        ORDER BY pc.updated_at DESC NULLS LAST
        LIMIT 1
      ) pc ON TRUE
      LEFT JOIN supply_max sm ON sm.product_id = v.id
      LEFT JOIN product.variant_sold_count vsc ON vsc.variant_id = v.id
      LEFT JOIN product.product_desc pd ON 
        TRIM(pd.product_id::text) = TRIM(v.display_name::text)
        OR TRIM(pd.product_id::text) = TRIM(SPLIT_PART(v.display_name::text, '--', 1))
      WHERE p.package_name ILIKE ${packageName}
    )
    SELECT
      *,
      (COALESCE(pct_ctv::numeric, 0) * price_max * COALESCE(pct_khach::numeric, 0)) AS cost
    FROM priced
    WHERE package_product IS NOT NULL;
  `;

  const dedup = new Map<string, PackageProductRow & Record<string, unknown>>();
  rows.forEach((row) => {
    const packageProductKey = ((row.package_product as string) ?? "").trim().toLowerCase();
    const idProductKey = ((row.id_product as string) ?? "").trim().toLowerCase();
    const costValue = toNumber(row.cost);
    const key = `${packageProductKey}-${idProductKey}-${costValue}`;
    if (!dedup.has(key)) {
      dedup.set(key, {
        ...row,
        id: Number(row.id),
        cost: String(costValue),
        created_at: (row.created_at as Date | null) ?? null,
        sold_count_30d: toNumber(row.sold_count_30d ?? 0),
        pct_promo: toNumber(row.pct_promo ?? 0),
        is_active: row.is_active !== false,
        form_id: row.form_id != null ? Number(row.form_id) : null,
      } as unknown as PackageProductRow & Record<string, unknown>);
    }
  });
  return Array.from(dedup.values());
}
