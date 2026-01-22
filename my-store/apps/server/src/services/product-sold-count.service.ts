import prisma from '@my-store/db';

export interface ProductWithSoldCount {
  id: string;
  package_name: string;
  image_url: string | null;
  sold_count: number;
  sold_count_updated_at: Date;
}

export class ProductSoldCountService {
  /**
   * Get products with sold count from materialized view
   * Super fast - no complex joins needed!
   */
  async getProductsWithSoldCount(limit?: number): Promise<ProductWithSoldCount[]> {
    const query = `
      SELECT 
        id,
        package_name,
        image_url,
        sold_count,
        sold_count_updated_at
      FROM product.product_with_sold_count
      ORDER BY sold_count DESC
      ${limit ? `LIMIT ${limit}` : ''}
    `;

    return await prisma.$queryRawUnsafe<ProductWithSoldCount[]>(query);
  }

  /**
   * Get single product with sold count
   */
  async getProductSoldCount(productId: string): Promise<ProductWithSoldCount | null> {
    const query = `
      SELECT 
        id,
        package_name,
        image_url,
        sold_count,
        sold_count_updated_at
      FROM product.product_with_sold_count
      WHERE id = $1
    `;

    const results = await prisma.$queryRawUnsafe<ProductWithSoldCount[]>(query, productId);
    return results[0] || null;
  }

  /**
   * Get top selling products
   */
  async getTopSellingProducts(limit: number = 10): Promise<ProductWithSoldCount[]> {
    return this.getProductsWithSoldCount(limit);
  }

  /**
   * Refresh materialized view
   * Call this from cron job every 15 minutes
   */
  async refreshSoldCount(): Promise<void> {
    try {
      await prisma.$executeRaw`SELECT product.refresh_product_sold_count()`;
      console.log('✅ Product sold count refreshed');
    } catch (error) {
      console.error('❌ Failed to refresh sold count:', error);
      throw error;
    }
  }

  /**
   * Get last update time
   */
  async getLastUpdateTime(): Promise<Date | null> {
    const query = `
      SELECT sold_count_updated_at
      FROM product.product_with_sold_count
      LIMIT 1
    `;

    const results = await prisma.$queryRawUnsafe<{ sold_count_updated_at: Date }[]>(query);
    return results[0]?.sold_count_updated_at || null;
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total_products: number;
    total_sold: number;
    last_updated: Date | null;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_products,
        SUM(sold_count) as total_sold,
        MAX(sold_count_updated_at) as last_updated
      FROM product.product_with_sold_count
    `;

    const results = await prisma.$queryRawUnsafe<any[]>(query);
    const stats = results[0];

    return {
      total_products: parseInt(stats.total_products) || 0,
      total_sold: parseInt(stats.total_sold) || 0,
      last_updated: stats.last_updated,
    };
  }
}

// Export singleton
export const productSoldCountService = new ProductSoldCountService();
