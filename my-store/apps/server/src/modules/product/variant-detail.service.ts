import prisma from "@my-store/db";
import { TABLES } from "../../config/db.config";
import { deriveProductSeo } from "./product-seo";

export interface VariantDetailInfo {
  variant_id: number;
  display_name: string;
  variant_name: string;
  product_id: number;
  base_name: string;
  duration: string;
  short_description?: string | null;
  description: string | null;
  purchase_rules?: string | null;
  seo_heading?: string | null;
  seo_title?: string | null;
  seo_slug?: string | null;
  image_url: string | null;
  sold_count: number;
}

type RawVariantDetailRow = {
  variant_id: number | bigint;
  display_name: string;
  variant_name: string;
  product_id: number | bigint;
  form_id?: number | bigint | null;
  base_name: string;
  duration: string;
  short_desc?: string | null;
  description: string | null;
  purchase_rules?: string | null;
  image_url: string | null;
  sold_count: number | bigint | string | null;
  pct_ctv?: number | bigint | string | null;
  pct_khach?: number | bigint | string | null;
  pct_promo?: number | bigint | string | null;
  price_max?: number | bigint | string | null;
};

const toNum = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const mapVariantSeoRow = (row: RawVariantDetailRow) => {
  const seo = deriveProductSeo({
    shortDesc: row.short_desc,
    descriptionHtml: row.description,
    rulesHtml: row.purchase_rules,
  });

  return {
    variant_id: toNum(row.variant_id),
    display_name: row.display_name,
    variant_name: row.variant_name,
    product_id: toNum(row.product_id),
    form_id: row.form_id != null ? toNum(row.form_id) : null,
    base_name: row.base_name,
    duration: row.duration,
    short_description: seo.shortDescription,
    description: seo.descriptionHtml || row.description,
    purchase_rules: seo.rulesHtml || row.purchase_rules || null,
    seo_heading: seo.heading,
    seo_title: seo.title,
    seo_slug: seo.slug,
    image_url: row.image_url,
    sold_count: toNum(row.sold_count),
    pct_ctv: row.pct_ctv != null ? toNum(row.pct_ctv) : 0,
    pct_khach: row.pct_khach != null ? toNum(row.pct_khach) : 0,
    pct_promo: row.pct_promo != null ? toNum(row.pct_promo) : null,
    price_max: row.price_max != null ? toNum(row.price_max) : 0,
  };
};

export class VariantDetailService {
  /**
   * Get variant detail with product_desc info
   */
  async getVariantDetail(variantId: number): Promise<VariantDetailInfo | null> {
    const query = `
      SELECT
        v.id AS variant_id,
        v.display_name,
        v.variant_name,
        v.product_id,
        SPLIT_PART(v.display_name, '--', 1) AS base_name,
        SPLIT_PART(v.display_name, '--', 2) AS duration,
        d.short_desc,
        d.description,
        d.rules AS purchase_rules,
        COALESCE(v.image_url, p.image_url) AS image_url,
        COALESCE(vsc.sales_count, 0) AS sold_count
      FROM ${TABLES.VARIANT} v
      LEFT JOIN ${TABLES.PRODUCT} p ON p.id = v.product_id
      LEFT JOIN ${TABLES.DESC_VARIANT} d ON d.id = v.id_desc
      LEFT JOIN ${TABLES.VARIANT_SOLD_COUNT} vsc
        ON vsc.variant_id = v.id
      WHERE v.id = $1
    `;

    const results = await prisma.$queryRawUnsafe<RawVariantDetailRow[]>(query, variantId);
    const row = results[0];
    return row ? mapVariantSeoRow(row) : null;
  }

  /**
   * Get variant detail by display_name
   */
  async getVariantDetailByDisplayName(
    displayName: string
  ): Promise<VariantDetailInfo | null> {
    const query = `
      SELECT
        v.id AS variant_id,
        v.display_name,
        v.variant_name,
        v.product_id,
        SPLIT_PART(v.display_name, '--', 1) AS base_name,
        SPLIT_PART(v.display_name, '--', 2) AS duration,
        d.short_desc,
        d.description,
        d.rules AS purchase_rules,
        COALESCE(v.image_url, p.image_url) AS image_url,
        COALESCE(vsc.sales_count, 0) AS sold_count
      FROM ${TABLES.VARIANT} v
      LEFT JOIN ${TABLES.PRODUCT} p ON p.id = v.product_id
      LEFT JOIN ${TABLES.DESC_VARIANT} d ON d.id = v.id_desc
      LEFT JOIN ${TABLES.VARIANT_SOLD_COUNT} vsc
        ON vsc.variant_id = v.id
      WHERE v.display_name = $1
    `;

    const results = await prisma.$queryRawUnsafe<RawVariantDetailRow[]>(
      query,
      displayName
    );
    const row = results[0];
    return row ? mapVariantSeoRow(row) : null;
  }

  /**
   * Get all variants for a product (by base_name)
   */
  async getVariantsByBaseName(baseName: string): Promise<any[]> {
    const query = `
      WITH supply_max AS (
        SELECT sc.variant_id, MAX(sc.price::numeric) AS price_max
        FROM ${TABLES.SUPPLIER_COST} sc
        GROUP BY sc.variant_id
      )
      SELECT
        v.id AS variant_id,
        v.display_name,
        v.variant_name,
        v.product_id,
        v.form_id,
        SPLIT_PART(v.display_name, '--', 1) AS base_name,
        SPLIT_PART(v.display_name, '--', 2) AS duration,
        d.short_desc,
        d.description,
        COALESCE(v.image_url, p.image_url) AS image_url,
        d.rules AS purchase_rules,
        COALESCE(vsc.sales_count, 0) AS sold_count,
        COALESCE(v.pct_ctv, 0) AS pct_ctv,
        COALESCE(v.pct_khach, 0) AS pct_khach,
        v.pct_promo,
        COALESCE(sm.price_max, 0) AS price_max
      FROM ${TABLES.VARIANT} v
      LEFT JOIN ${TABLES.PRODUCT} p ON p.id = v.product_id
      LEFT JOIN ${TABLES.DESC_VARIANT} d ON d.id = v.id_desc
      LEFT JOIN ${TABLES.VARIANT_SOLD_COUNT} vsc
        ON vsc.variant_id = v.id
      LEFT JOIN supply_max sm ON sm.variant_id = v.id
      WHERE SPLIT_PART(v.display_name, '--', 1) = $1
      ORDER BY
        CASE
          WHEN SPLIT_PART(v.display_name, '--', 2) ~ '^[0-9]+m$'
          THEN CAST(
            REGEXP_REPLACE(SPLIT_PART(v.display_name, '--', 2), '[^0-9]', '', 'g')
            AS INTEGER
          )
          ELSE 999
        END ASC
    `;

    const rows = await prisma.$queryRawUnsafe<RawVariantDetailRow[]>(query, baseName);
    return rows.map(mapVariantSeoRow);
  }

  /**
   * Get product info (shared across all variants)
   * Return JSON-safe object to avoid BigInt serialization issues.
   */
  async getProductInfo(baseName: string): Promise<{
    base_name: string;
    short_description: string | null;
    description: string | null;
    seo_heading: string | null;
    seo_title: string | null;
    seo_slug: string | null;
    image_url: string | null;
    purchase_rules: string | null;
    total_sold_count: number;
    variants: any[];
  } | null> {
    const variants = await this.getVariantsByBaseName(baseName);

    if (variants.length === 0) {
      return null;
    }

    const totalSoldCount = variants.reduce(
      (sum, variant) => sum + toNum(variant.sold_count),
      0
    );
    const canonicalVariant =
      variants.find(
        (variant) =>
          variant.short_description ||
          variant.description ||
          variant.purchase_rules
      ) || variants[0];

    return {
      base_name: baseName,
      short_description: canonicalVariant.short_description || null,
      description: canonicalVariant.description || null,
      seo_heading: canonicalVariant.seo_heading || null,
      seo_title: canonicalVariant.seo_title || null,
      seo_slug: canonicalVariant.seo_slug || null,
      image_url: canonicalVariant.image_url || null,
      purchase_rules: canonicalVariant.purchase_rules || null,
      total_sold_count: totalSoldCount,
      variants,
    };
  }
}

// Export singleton
export const variantDetailService = new VariantDetailService();
