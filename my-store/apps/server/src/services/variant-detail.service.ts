import prisma from '@my-store/db';

export interface VariantDetailInfo {
  variant_id: number;
  display_name: string;
  variant_name: string;
  product_id: number;
  base_name: string;
  duration: string;
  description: string | null;
  image_url: string | null;
  sold_count: number;
}

export class VariantDetailService {
  /**
   * Get variant detail with product_desc info
   */
  async getVariantDetail(variantId: number): Promise<VariantDetailInfo | null> {
    const query = `
      SELECT 
        v.id as variant_id,
        v.display_name,
        v.variant_name,
        v.product_id,
        SPLIT_PART(v.display_name, '--', 1) as base_name,
        SPLIT_PART(v.display_name, '--', 2) as duration,
        pd.description,
        pd.image_url,
        COALESCE(vsc.sales_count, 0) as sold_count
      FROM product.variant v
      LEFT JOIN product.product_desc pd 
        ON SPLIT_PART(v.display_name, '--', 1) = pd.product_id
      LEFT JOIN product.variant_sold_count vsc
        ON vsc.variant_id = v.id
      WHERE v.id = $1
    `;

    const results = await prisma.$queryRawUnsafe<VariantDetailInfo[]>(query, variantId);
    return results[0] || null;
  }

  /**
   * Get variant detail by display_name
   */
  async getVariantDetailByDisplayName(displayName: string): Promise<VariantDetailInfo | null> {
    const query = `
      SELECT 
        v.id as variant_id,
        v.display_name,
        v.variant_name,
        v.product_id,
        SPLIT_PART(v.display_name, '--', 1) as base_name,
        SPLIT_PART(v.display_name, '--', 2) as duration,
        pd.description,
        pd.image_url,
        COALESCE(vsc.sales_count, 0) as sold_count
      FROM product.variant v
      LEFT JOIN product.product_desc pd 
        ON SPLIT_PART(v.display_name, '--', 1) = pd.product_id
      LEFT JOIN product.variant_sold_count vsc
        ON vsc.variant_id = v.id
      WHERE v.display_name = $1
    `;

    const results = await prisma.$queryRawUnsafe<VariantDetailInfo[]>(query, displayName);
    return results[0] || null;
  }

  /**
   * Get all variants for a product (by base_name)
   */
  async getVariantsByBaseName(baseName: string): Promise<any[]> {
    const query = `
      WITH supply_max AS (
        SELECT sc.product_id, MAX(sc.price::numeric) AS price_max
        FROM product.supplier_cost sc
        GROUP BY sc.product_id
      )
      SELECT 
        v.id as variant_id,
        v.display_name,
        v.variant_name,
        v.product_id,
        v.form_id,
        SPLIT_PART(v.display_name, '--', 1) as base_name,
        SPLIT_PART(v.display_name, '--', 2) as duration,
        pd.description,
        pd.image_url,
        pd.rules as purchase_rules,
        COALESCE(vsc.sales_count, 0) as sold_count,
        COALESCE(pc.pct_ctv, 0) as pct_ctv,
        COALESCE(pc.pct_khach, 0) as pct_khach,
        pc.pct_promo,
        COALESCE(sm.price_max, 0) as price_max
      FROM product.variant v
      LEFT JOIN product.product_desc pd 
        ON SPLIT_PART(v.display_name, '--', 1) = pd.product_id
      LEFT JOIN product.variant_sold_count vsc
        ON vsc.variant_id = v.id
      LEFT JOIN LATERAL (
        SELECT pc.pct_ctv, pc.pct_khach, pc.pct_promo
        FROM product.price_config pc
        WHERE pc.variant_id = v.id
        ORDER BY pc.updated_at DESC NULLS LAST
        LIMIT 1
      ) pc ON TRUE
      LEFT JOIN supply_max sm ON sm.product_id = v.id
      WHERE SPLIT_PART(v.display_name, '--', 1) = $1
      ORDER BY 
        CASE 
          WHEN SPLIT_PART(v.display_name, '--', 2) ~ '^[0-9]+m$' 
          THEN CAST(REGEXP_REPLACE(SPLIT_PART(v.display_name, '--', 2), '[^0-9]', '', 'g') AS INTEGER)
          ELSE 999
        END ASC
    `;

    return await prisma.$queryRawUnsafe<any[]>(query, baseName);
  }

  /**
   * Get product info (shared across all variants)
   */
  async getProductInfo(baseName: string): Promise<{
    base_name: string;
    description: string | null;
    image_url: string | null;
    purchase_rules: string | null;
    total_sold_count: number;
    variants: any[];
  } | null> {
    const variants = await this.getVariantsByBaseName(baseName);
    
    if (variants.length === 0) {
      return null;
    }

    // Get total sold count for all variants
    const totalSoldCount = variants.reduce((sum, v) => sum + (v.sold_count || 0), 0);

    return {
      base_name: baseName,
      description: variants[0].description,
      image_url: variants[0].image_url,
      purchase_rules: variants[0].purchase_rules,
      total_sold_count: totalSoldCount,
      variants: variants,
    };
  }
}

// Export singleton
export const variantDetailService = new VariantDetailService();
