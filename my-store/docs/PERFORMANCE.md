# Performance Optimization Guide

## Database Optimization

### 1. Query Optimization

**Current Complex Queries**
The server uses CTEs (Common Table Expressions) for complex queries. These are already optimized but can be improved:

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_variant_active ON variant(active);
CREATE INDEX idx_product_category ON product(category_id);
CREATE INDEX idx_supplier_cost_product ON supplier_cost(product_id);
CREATE INDEX idx_price_config_variant ON price_config(variant_id);
```

**Prisma Schema Updates**
```prisma
model variant {
  id Int @id @default(autoincrement())
  active Boolean @default(true)
  
  @@index([active])
}

model product {
  id Int @id @default(autoincrement())
  category_id String?
  
  @@index([category_id])
}
```

### 2. Connection Pooling

Already handled by Prisma, but can be configured:

```javascript
// In @my-store/db
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query'] : [],
});
```

### 3. Query Caching

Implement Redis caching for frequently accessed data:

```typescript
// Example: Cache products for 5 minutes
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedProducts() {
  const cached = await redis.get('products:all');
  if (cached) {
    return JSON.parse(cached);
  }
  
  const products = await fetchProducts();
  await redis.setex('products:all', 300, JSON.stringify(products));
  return products;
}
```

## Frontend Optimization

### 1. Code Splitting

Vite already handles this, but ensure lazy loading for routes:

```typescript
// Lazy load pages
const HomePage = lazy(() => import('@/components/pages/HomePage'));
const ProductDetailPage = lazy(() => import('@/components/pages/ProductDetailPage'));

// Wrap with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <HomePage />
</Suspense>
```

### 2. Image Optimization

```typescript
// Use modern image formats
<img
  src={image_url}
  loading="lazy"
  decoding="async"
  srcSet={`${image_url}?w=400 400w, ${image_url}?w=800 800w`}
  sizes="(max-width: 768px) 400px, 800px"
/>
```

### 3. Bundle Size Optimization

**Vite Config Updates**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', 'sonner'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

### 4. React Query Optimization

```typescript
// Configure React Query for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

## Network Optimization

### 1. Enable Compression

```typescript
// In server
import compression from 'compression';

app.use(compression({
  level: 6,
  threshold: 1024,
}));
```

### 2. HTTP/2

Configure your server to use HTTP/2:

```nginx
# Nginx config
server {
    listen 443 ssl http2;
    # ... rest of config
}
```

### 3. CDN Setup

Use Cloudflare or similar:
- Cache static assets
- Enable Brotli compression
- Use edge caching

## Monitoring

### 1. Performance Metrics

```typescript
// Add performance monitoring
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  next();
});
```

### 2. Database Query Monitoring

```typescript
// Enable Prisma query logging in development
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
  ],
});

prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn(`Slow query (${e.duration}ms): ${e.query}`);
  }
});
```

## Benchmarking

### Load Testing

```bash
# Install Apache Bench
apt-get install apache2-utils

# Test API endpoint
ab -n 1000 -c 10 http://localhost:4001/products

# Expected results:
# - Requests per second: >100
# - Time per request: <100ms
# - Failed requests: 0
```

### Lighthouse Audit

```bash
npx lighthouse http://localhost:3001 --view

# Target scores:
# - Performance: >90
# - Accessibility: >90
# - Best Practices: >90
# - SEO: >90
```

## Performance Checklist

- [ ] Database indexes added
- [ ] Query caching implemented
- [ ] Code splitting configured
- [ ] Images optimized
- [ ] Compression enabled
- [ ] HTTP/2 enabled
- [ ] CDN configured
- [ ] Monitoring in place
- [ ] Load testing completed
- [ ] Lighthouse score >90
