import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Development server optimizations
  server: {
    port: 4001,
    strictPort: true, // Don't auto-switch ports
    hmr: {
      overlay: true,
    },
    // Faster startup
    fs: {
      strict: false,
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
