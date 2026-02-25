import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const BACKEND_URL = 'http://127.0.0.1:4000';

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

export default defineConfig({
  plugins: [react()],
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
      'lucide-react',
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
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react', 'sonner', 'next-themes'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: process.env.NODE_ENV !== 'production',
  },
});
