import fs from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const BACKEND_URL = 'http://127.0.0.1:4000';
const BRANDING_ASSET_PUBLIC_DIR = path.resolve(__dirname, './public/assets/images');
const BRANDING_ASSET_EXTENSIONS = ['.webp', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.avif'];
const FAVICON_EXTENSIONS = ['.ico', '.png', '.svg', '.webp', '.jpg', '.jpeg', '.avif'];

/** Khi backend chưa chạy (ECONNREFUSED): log rõ, tránh spam stack trace. */
function proxyToBackend() {
  return {
    target: BACKEND_URL,
    changeOrigin: true,
    timeout: 30_000,
    proxyTimeout: 30_000,
    configure: (proxy: any) => {
      proxy.on('error', (err: NodeJS.ErrnoException, _req: any, res: any) => {
        if (err.code === 'ECONNREFUSED') {
          console.warn(`[vite] Backend chưa chạy tại ${BACKEND_URL}. Chạy "npm run dev" từ thư mục my-store để khởi động cả server và web.`);
          if (res && !res.headersSent) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Backend chưa sẵn sàng. Khởi động server (port 4000) rồi thử lại.' }));
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
      '/api': proxyToBackend(),
      '/products': proxyToBackend(),
      '/categories': proxyToBackend(),
      '/promotions': proxyToBackend(),
      '/product-packages': proxyToBackend(),
      '/cache': proxyToBackend(),
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
