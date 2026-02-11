import pool from "../config/database";
import { TABLES } from "../config/db.config";
import { cacheService } from "./cache.service";

export interface ProductWithSoldCount {
  id: string;
  name: string;
  price: number;
  sold_count: number;
}

export class ProductStatsService {
  private CACHE_TTL = 300;
  private CACHE_KEY_PREFIX = "product:sold_count:";

  async getProductSoldCount(productId: string): Promise<number> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${productId}`;
    return await cacheService.getOrSet(
      cacheKey,
      () => this.queryProductSoldCount(productId),
      this.CACHE_TTL
    );
  }

  private async queryProductSoldCount(productId: string): Promise<number> {
    const [orderListResult, orderExpiredResult] = await Promise.all([
      pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM ${TABLES.ORDER_LIST} WHERE id_product::text = $1`,
        [productId]
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM ${TABLES.ORDER_EXPIRED} WHERE id_product::text = $1`,
        [productId]
      ),
    ]);
    const a = parseInt(orderListResult.rows[0]?.count ?? "0", 10);
    const b = parseInt(orderExpiredResult.rows[0]?.count ?? "0", 10);
    return a + b;
  }

  async getProductsWithSoldCount(productIds?: string[]): Promise<Map<string, number>> {
    const ids = productIds ?? (await this.getAllProductIds());
    const soldCounts = new Map<string, number>();
    await Promise.all(
      ids.map(async (productId) => {
        const count = await this.getProductSoldCount(productId);
        soldCounts.set(productId, count);
      })
    );
    return soldCounts;
  }

  private async getAllProductIds(): Promise<string[]> {
    const result = await pool.query<{ id: number }>(
      `SELECT id FROM ${TABLES.PRODUCT} ORDER BY id`
    );
    return result.rows.map((p) => String(p.id));
  }

  async invalidateProductCache(productId: string): Promise<void> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${productId}`;
    await cacheService.del(cacheKey);
    console.log(`🔄 Cache invalidated for product ${productId}`);
  }

  async invalidateMultipleProductsCache(productIds: string[]): Promise<void> {
    await Promise.all(productIds.map((id) => this.invalidateProductCache(id)));
  }

  async invalidateAllProductsCache(): Promise<void> {
    await cacheService.delPattern(`${this.CACHE_KEY_PREFIX}*`);
    console.log("🔄 All product caches invalidated");
  }

  async getTopSellingProducts(limit: number = 10): Promise<ProductWithSoldCount[]> {
    const result = await pool.query<{ id: number; package_name: string | null }>(
      `SELECT id, package_name FROM ${TABLES.PRODUCT} ORDER BY id LIMIT 500`
    );
    const products = result.rows.map((p) => ({
      id: String(p.id),
      name: p.package_name ?? "",
      price: 0,
    }));
    const soldCounts = await this.getProductsWithSoldCount(
      products.map((p) => p.id)
    );
    const withCount = products.map((product) => ({
      ...product,
      sold_count: soldCounts.get(product.id) ?? 0,
    }));
    withCount.sort((a, b) => b.sold_count - a.sold_count);
    return withCount.slice(0, limit);
  }

  async warmUpCache(): Promise<void> {
    console.log("🔥 Warming up product sold count cache...");
    const productIds = await this.getAllProductIds();
    await Promise.all(productIds.map((id) => this.getProductSoldCount(id)));
    console.log(`✅ Cache warmed up for ${productIds.length} products`);
  }

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
      cache_hit_rate:
        productIds.length > 0 ? (cachedCount / productIds.length) * 100 : 0,
    };
  }
}

export const productStatsService = new ProductStatsService();
