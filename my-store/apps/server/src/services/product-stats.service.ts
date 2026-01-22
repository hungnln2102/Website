import prisma from '@my-store/db';
import { cacheService } from './cache.service';

export interface ProductWithSoldCount {
  id: string;
  name: string;
  price: number;
  sold_count: number;
  // ... other product fields
}

export class ProductStatsService {
  private CACHE_TTL = 300; // 5 minutes
  private CACHE_KEY_PREFIX = 'product:sold_count:';

  /**
   * Get real-time sold count for a product
   * Uses cache with automatic invalidation
   */
  async getProductSoldCount(productId: string): Promise<number> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${productId}`;

    // Try cache first
    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        // Query from database
        return await this.queryProductSoldCount(productId);
      },
      this.CACHE_TTL
    );
  }

  /**
   * Query sold count from database (real-time)
   */
  private async queryProductSoldCount(productId: string): Promise<number> {
    const [orderListCount, orderExpiredCount] = await Promise.all([
      prisma.orderList.count({
        where: { product_id: productId },
      }),
      prisma.orderExpired.count({
        where: { product_id: productId },
      }),
    ]);

    return orderListCount + orderExpiredCount;
  }

  /**
   * Get multiple products with sold count
   * Optimized with batch caching
   */
  async getProductsWithSoldCount(productIds?: string[]): Promise<Map<string, number>> {
    const products = productIds || await this.getAllProductIds();
    const soldCounts = new Map<string, number>();

    // Batch fetch from cache and DB
    await Promise.all(
      products.map(async (productId) => {
        const count = await this.getProductSoldCount(productId);
        soldCounts.set(productId, count);
      })
    );

    return soldCounts;
  }

  /**
   * Get all product IDs
   */
  private async getAllProductIds(): Promise<string[]> {
    const products = await prisma.product.findMany({
      select: { id: true },
    });
    return products.map((p) => p.id);
  }

  /**
   * Invalidate cache for a product
   * Call this when an order is created/updated/deleted
   */
  async invalidateProductCache(productId: string): Promise<void> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${productId}`;
    await cacheService.del(cacheKey);
    console.log(`🔄 Cache invalidated for product ${productId}`);
  }

  /**
   * Invalidate cache for multiple products
   */
  async invalidateMultipleProductsCache(productIds: string[]): Promise<void> {
    await Promise.all(
      productIds.map((id) => this.invalidateProductCache(id))
    );
  }

  /**
   * Invalidate all product caches
   */
  async invalidateAllProductsCache(): Promise<void> {
    await cacheService.delPattern(`${this.CACHE_KEY_PREFIX}*`);
    console.log('🔄 All product caches invalidated');
  }

  /**
   * Get products sorted by sold count
   * Real-time with caching
   */
  async getTopSellingProducts(limit: number = 10): Promise<ProductWithSoldCount[]> {
    // Get all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        // Add other fields you need
      },
    });

    // Get sold counts for all products
    const soldCounts = await this.getProductsWithSoldCount(
      products.map((p) => p.id)
    );

    // Combine and sort
    const productsWithCount = products.map((product) => ({
      ...product,
      sold_count: soldCounts.get(product.id) || 0,
    }));

    // Sort by sold_count descending
    productsWithCount.sort((a, b) => b.sold_count - a.sold_count);

    return productsWithCount.slice(0, limit);
  }

  /**
   * Warm up cache for all products
   * Call this on server startup or periodically
   */
  async warmUpCache(): Promise<void> {
    console.log('🔥 Warming up product sold count cache...');
    
    const productIds = await this.getAllProductIds();
    
    await Promise.all(
      productIds.map((id) => this.getProductSoldCount(id))
    );

    console.log(`✅ Cache warmed up for ${productIds.length} products`);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    total_products: number;
    cached_products: number;
    cache_hit_rate: number;
  }> {
    const productIds = await this.getAllProductIds();
    let cachedCount = 0;

    await Promise.all(
      productIds.map(async (id) => {
        const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;
        const exists = await cacheService.exists(cacheKey);
        if (exists) cachedCount++;
      })
    );

    return {
      total_products: productIds.length,
      cached_products: cachedCount,
      cache_hit_rate: productIds.length > 0 
        ? (cachedCount / productIds.length) * 100 
        : 0,
    };
  }
}

// Export singleton
export const productStatsService = new ProductStatsService();
