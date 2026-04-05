import fs from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/** my-store apps/server (sản phẩm, giỏ, thanh toán, …) */
const STORE_API_URL = process.env.VITE_STORE_API_URL || 'http://127.0.0.1:4000';
/** admin_orderlist backend — tin tức /api/public/content/* (schema content) */
const ADMIN_API_URL = process.env.VITE_ADMIN_API_URL || 'http://127.0.0.1:3001';
const BRANDING_ASSET_PUBLIC_DIR = path.resolve(__dirname, './public/assets/images');
const BRANDING_ASSET_EXTENSIONS = ['.webp', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.avif'];
const FAVICON_EXTENSIONS = ['.ico', '.png', '.svg', '.webp', '.jpg', '.jpeg', '.avif'];

/** Timeout proxy (ms). Renew Adobe /activate có Playwright lâu — phải ≥ timeout phía web (renewAdobe.api). */
const PROXY_TIMEOUT_SHORT_MS = 30_000;
const PROXY_TIMEOUT_RENEW_ADOBE_MS = 660_000;

/** Khi backend chưa chạy (ECONNREFUSED): log rõ, tránh spam stack trace. */
function proxyTo(target: string, label: string, timeoutMs: number = PROXY_TIMEOUT_SHORT_MS) {
  return {
    target,
    changeOrigin: true,
    timeout: timeoutMs,
    proxyTimeout: timeoutMs,
    configure: (proxy: any) => {
      proxy.on('error', (err: NodeJS.ErrnoException, _req: any, res: any) => {
        if (err.code === 'ECONNREFUSED') {
          console.warn(`[vite] ${label} chưa chạy tại ${target}.`);
          if (res && !res.headersSent) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Backend chưa sẵn sàng (${label}). Khởi động rồi thử lại.` }));
          }
        }
      });
    },
  };
}

function resolveBrandingAssetRequest(url: string) {
  const [pathname, search = ''] = url.split('?');

  if (!pathname.startsWith('/assets/images/')) {
    return null;
  }

  if (path.posix.extname(pathname)) {
    return null;
  }

  const assetName = pathname.slice('/assets/images/'.length);
  if (!assetName || assetName.includes('..')) {
    return null;
  }

  const extensions = assetName === 'favicon' ? FAVICON_EXTENSIONS : BRANDING_ASSET_EXTENSIONS;

  for (const extension of extensions) {
    const candidatePath = path.join(BRANDING_ASSET_PUBLIC_DIR, `${assetName}${extension}`);
    if (fs.existsSync(candidatePath)) {
      return `${pathname}${extension}${search ? `?${search}` : ''}`;
    }
  }

  return null;
}

function extensionlessBrandingAssets() {
  const rewriteBrandingRequest = (requestUrl?: string | null) => {
    if (!requestUrl) {
      return requestUrl;
    }

    return resolveBrandingAssetRequest(requestUrl) ?? requestUrl;
  };

  return {
    name: 'extensionless-branding-assets',
    configureServer(server: any) {
      server.middlewares.use((req: any, _res: any, next: () => void) => {
        req.url = rewriteBrandingRequest(req.url);
        next();
      });
    },
    configurePreviewServer(server: any) {
      server.middlewares.use((req: any, _res: any, next: () => void) => {
        req.url = rewriteBrandingRequest(req.url);
        next();
      });
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [react(), extensionlessBrandingAssets()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 4001,
    strictPort: true,
    hmr: { overlay: true },
    fs: { strict: false },
    proxy: {
      /**
       * Tin tức + banner trang chủ công khai từ admin_orderlist (DB content), không phải apps/server.
       * Phải đứng trước `/api` để khớp prefix trước.
       */
      '/api/public/content': proxyTo(ADMIN_API_URL, 'admin_orderlist (tin tức / banner)'),
      /**
       * Renew Adobe (Website Check Profile) — API thật nằm trên admin_orderlist backend,
       * không phải my-store server (4000). Nếu proxy nhầm sang 4000 → 404 "Không tìm thấy dữ liệu".
       */
      '/api/renew-adobe/public': proxyTo(
        ADMIN_API_URL,
        'admin_orderlist (Renew Adobe public)',
        PROXY_TIMEOUT_RENEW_ADOBE_MS,
      ),
      '/api': proxyTo(STORE_API_URL, 'my-store server'),
      /** Ảnh upload bài viết (admin_orderlist/static …/image/articles/) — phải trước `/image` */
      '/image/articles': proxyTo(ADMIN_API_URL, 'admin_orderlist (ảnh bài viết)'),
      '/image_variant': proxyTo(ADMIN_API_URL, 'admin_orderlist (ảnh biến thể)'),
      '/image': proxyTo(STORE_API_URL, 'my-store server'),
      '/image_product': proxyTo(STORE_API_URL, 'my-store server'),
      '/products': proxyTo(STORE_API_URL, 'my-store server'),
      '/categories': proxyTo(STORE_API_URL, 'my-store server'),
      '/promotions': proxyTo(STORE_API_URL, 'my-store server'),
      '/product-packages': proxyTo(STORE_API_URL, 'my-store server'),
      '/cache': proxyTo(STORE_API_URL, 'my-store server'),
    },
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'next-themes',
    ],
    // Force re-optimization on config change
    force: false,
  },
  // Build optimizations (only for production)
  build: {
    minify: 'esbuild', // 20-40x faster than terser
    target: 'es2020', // Modern browsers only
    cssCodeSplit: true,
    reportCompressedSize: false, // Faster builds
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }

          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }

          if (id.includes('next-themes')) {
            return 'theme-vendor';
          }

          if (id.includes('/sonner/')) {
            return 'sonner-vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: process.env.NODE_ENV !== 'production',
  },
});
