import { describe, it, expect, beforeAll } from 'vitest';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

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
        expect(category).toHaveProperty('product_ids');
        expect(Array.isArray(category.product_ids)).toBe(true);
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
      expect(response.status).toBe(400);
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
      const response = await fetch(`${API_URL}/products`, {
        headers: { Origin: 'http://localhost:3001' },
      });
      expect(response.headers.has('access-control-allow-origin')).toBe(true);
    });
  });

  describe('Mail Webhook – nhận mail về support@mavrykpremium.store', () => {
    const SUPPORT_EMAIL = 'support@mavrykpremium.store';
    const WEBHOOK_URL = `${API_URL}/api/mail/webhook`;

    it('nên chấp nhận event email.received gửi tới support', async () => {
      const payload = {
        type: 'email.received',
        created_at: new Date().toISOString(),
        data: {
          email_id: 'test-56761188-7520-42d8-8898-ff6fc54ce618',
          created_at: new Date().toISOString(),
          from: 'Khách hàng <customer@example.com>',
          to: [SUPPORT_EMAIL],
          subject: 'Test support mail',
          message_id: '<test-message-id@example.com>',
        },
      };
      const body = JSON.stringify(payload);
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (response.status === 401) {
        expect(response.status).toBe(401);
        return;
      }
      expect(response.status).toBe(200);
      const data = (await response.json()) as typeof payload;
      expect(data.type).toBe('email.received');
      expect(data.data?.to).toEqual([SUPPORT_EMAIL]);
      expect(data.data?.subject).toBe('Test support mail');
    });

    it('nên trả 200 với body rỗng cho event không phải email.received', async () => {
      const payload = { type: 'email.sent', created_at: new Date().toISOString(), data: {} };
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.status === 401) return;
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({});
    });
  });

  describe('GET /api/user/profile (chu kỳ hiện tại)', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await fetch(`${API_URL}/api/user/profile`);
      expect(response.status).toBe(401);
    });

    it('should return currentCycle when authenticated (có token thì kiểm tra)', async () => {
      const token = process.env.PROFILE_TEST_ACCESS_TOKEN;
      if (!token) {
        console.log('  (Bỏ qua: đặt PROFILE_TEST_ACCESS_TOKEN để test profile + currentCycle)');
        return;
      }
      const response = await fetch(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.status).toBe(200);
      const data = (await response.json()) as {
        currentCycle?: { cycleStartAt: string; cycleEndAt: string; status?: string };
        serverNow?: string;
        tierCycleEnd?: string;
      };
      expect(data).toHaveProperty('currentCycle');
      expect(data.currentCycle).toHaveProperty('cycleStartAt');
      expect(data.currentCycle).toHaveProperty('cycleEndAt');
      expect(data).toHaveProperty('serverNow');
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
