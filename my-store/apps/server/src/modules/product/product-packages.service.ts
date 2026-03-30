/**
 * Product package variants by package name (deduplicated by package_product + id_product + cost).
 */
import prisma from "@my-store/db";
import { TABLES } from "../../config/db.config";
import { toNumber } from "./product.helpers";
import { deriveProductSeo } from "./product-seo";

type PackageProductRow = {
  id: number | bigint;
  package: string | null;
  package_product: string | null;
  id_product: string | null;
  cost: string | null;
};

export async function getProductPackages(packageName: string) {
  const query = `
    WITH supply_max AS (
      SELECT sc.variant_id, MAX(sc.price::numeric) AS price_max
      FROM ${TABLES.SUPPLIER_COST} sc
      GROUP BY sc.variant_id
    ),
    priced AS (
      SELECT
        v.id,
        p.package_name AS package,
        v.variant_name AS package_product,
        v.display_name AS id_product,
        v.updated_at AS created_at,
        v.is_active AS is_active,
        v.form_id AS form_id,
        COALESCE(v.pct_ctv, 0) AS pct_ctv,
        COALESCE(v.pct_khach, 0) AS pct_khach,
        v.pct_promo,
        COALESCE(sm.price_max, 0) AS price_max,
        COALESCE(vsc.sales_count, 0) AS sold_count_30d,
        v.short_desc,
        v.description,
        v.image_url,
        v.rules AS purchase_rules
      FROM ${TABLES.VARIANT} v
      LEFT JOIN ${TABLES.PRODUCT} p ON p.id = v.product_id
      LEFT JOIN supply_max sm ON sm.variant_id = v.id
      LEFT JOIN ${TABLES.VARIANT_SOLD_COUNT} vsc ON vsc.variant_id = v.id
      WHERE p.package_name ILIKE $1
        AND (p.is_active IS NULL OR p.is_active = true)
    )
    SELECT
      *,
      (COALESCE(pct_ctv::numeric, 0) * price_max * COALESCE(pct_khach::numeric, 0)) AS cost
    FROM priced
    WHERE package_product IS NOT NULL;
  `;
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(query, packageName);

  const dedup = new Map<string, PackageProductRow & Record<string, unknown>>();
  rows.forEach((row) => {
    const packageProductKey = ((row.package_product as string) ?? "")
      .trim()
      .toLowerCase();
    const idProductKey = ((row.id_product as string) ?? "").trim().toLowerCase();
    const costValue = toNumber(row.cost);
    const seo = deriveProductSeo({
      shortDesc: (row.short_desc as string | null) ?? null,
      descriptionHtml: (row.description as string | null) ?? null,
      rulesHtml: (row.purchase_rules as string | null) ?? null,
    });
    const key = `${packageProductKey}-${idProductKey}-${costValue}`;

    if (!dedup.has(key)) {
      dedup.set(
        key,
        {
          ...row,
          id: Number(row.id),
          cost: String(costValue),
          description: seo.descriptionHtml || row.description || null,
          short_description: seo.shortDescription,
          purchase_rules: seo.rulesHtml || row.purchase_rules || null,
          seo_heading: seo.heading,
          seo_title: seo.title,
          seo_slug: seo.slug,
          created_at: (row.created_at as Date | null) ?? null,
          sold_count_30d: toNumber(row.sold_count_30d ?? 0),
          pct_promo: toNumber(row.pct_promo ?? 0),
          is_active: row.is_active !== false,
          form_id: row.form_id != null ? Number(row.form_id) : null,
        } as unknown as PackageProductRow & Record<string, unknown>
      );
    }
  });

  return Array.from(dedup.values());
}
