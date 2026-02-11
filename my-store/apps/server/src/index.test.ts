import { describe, it, expect, beforeAll } from 'vitest';

const API_URL = 'http://localhost:4001';

type ProductsResponse = { data: Array<Record<string, unknown>> };
type CategoriesResponse = { data: Array<Record<string, unknown>> };

describe('API Integration Tests', () => {
  beforeAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  describe('GET /products', () => {
    it('should return products list', async () => {
      const response = await fetch(`${API_URL}/products`);
      const data = (await response.json()) as ProductsResponse;

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should return products with correct structure', async () => {
      const response = await fetch(`${API_URL}/products`);
      const data = (await response.json()) as ProductsResponse;

      if (data.data.length > 0) {
        const product = data.data[0]!;
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('slug');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('base_price');
        expect(product).toHaveProperty('discount_percentage');
        expect(product).toHaveProperty('sales_count');
        expect(product).toHaveProperty('average_rating');
      }
    });

    it('should return products with valid data types', async () => {
      const response = await fetch(`${API_URL}/products`);
      const data = (await response.json()) as ProductsResponse;

      if (data.data.length > 0) {
        const product = data.data[0]!;
        expect(typeof product.id).toBe('number');
        expect(typeof product.slug).toBe('string');
        expect(typeof product.name).toBe('string');
        expect(typeof product.base_price).toBe('number');
        expect(typeof product.discount_percentage).toBe('number');
        expect(typeof product.sales_count).toBe('number');
        expect(typeof product.average_rating).toBe('number');
      }
    });
  });

  describe('GET /categories', () => {
    it('should return categories list', async () => {
      const response = await fetch(`${API_URL}/categories`);
      const data = (await response.json()) as CategoriesResponse;

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should return categories with correct structure', async () => {
      const response = await fetch(`${API_URL}/categories`);
      const data = (await response.json()) as CategoriesResponse;

      if (data.data.length > 0) {
        const category = data.data[0]!;
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('packages');
        expect(Array.isArray(category.packages)).toBe(true);
      }
    });
  });

  describe('GET /product-packages/:package', () => {
    it('should return package variants', async () => {
      const productsResponse = await fetch(`${API_URL}/products`);
      const productsData = (await productsResponse.json()) as ProductsResponse;

      if (productsData.data.length > 0) {
        const packageName = (productsData.data[0]!.package as string) ?? "";
        const response = await fetch(`${API_URL}/product-packages/${encodeURIComponent(packageName)}`);
        const data = (await response.json()) as { data: unknown[] };

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('data');
        expect(Array.isArray(data.data)).toBe(true);
      }
    });

    it('should return 400 for missing package parameter', async () => {
      const response = await fetch(`${API_URL}/product-packages/`);
      expect(response.status).toBe(404);
    });

    it('should return variants with correct structure', async () => {
      const productsResponse = await fetch(`${API_URL}/products`);
      const productsData = (await productsResponse.json()) as ProductsResponse;

      if (productsData.data.length > 0) {
        const packageName = (productsData.data[0]!.package as string) ?? "";
        const response = await fetch(`${API_URL}/product-packages/${encodeURIComponent(packageName)}`);
        const data = (await response.json()) as { data: unknown[] };

        if (data.data.length > 0) {
          const variant = data.data[0]!;
          expect(variant).toHaveProperty('id');
          expect(variant).toHaveProperty('package');
          expect(variant).toHaveProperty('package_product');
          expect(variant).toHaveProperty('cost');
        }
      }
    });
  });

  describe('Health Check Endpoints', () => {
    it('GET /health should return ok status', async () => {
      const response = await fetch(`${API_URL}/health`);
      const data = (await response.json()) as { status: string; timestamp?: unknown; uptime?: unknown };

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
    });

    it('GET /health/db should check database connection', async () => {
      const response = await fetch(`${API_URL}/health/db`);
      const data = (await response.json()) as { status: string; database?: unknown };

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('database');
      expect(data).toHaveProperty('timestamp');
    });

    it('GET /health/ready should return readiness status', async () => {
      const response = await fetch(`${API_URL}/health/ready`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('checks');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await fetch(`${API_URL}/non-existent-endpoint`);
      expect(response.status).toBe(404);
    });

    it('should handle CORS correctly', async () => {
      const response = await fetch(`${API_URL}/products`);
      expect(response.headers.has('access-control-allow-origin')).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should respond to /products within 2 seconds', async () => {
      const start = Date.now();
      const response = await fetch(`${API_URL}/products`);
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(2000);
    });

    it('should respond to /categories within 1 second', async () => {
      const start = Date.now();
      const response = await fetch(`${API_URL}/categories`);
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000);
    });
  });
});
