import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';
import { visualizer } from 'rollup-plugin-visualizer';

// Bundle analyzer configuration
export default defineConfig({
  root: './client',
  plugins: [
    react(),
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(fileURLToPath(new URL('.', import.meta.url)), './client/src'),
      '@shared': resolve(fileURLToPath(new URL('.', import.meta.url)), './shared'),
      '@server': resolve(fileURLToPath(new URL('.', import.meta.url)), './server'),
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'ES2020',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'chart-vendor': ['recharts', '@tremor/react'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'date-vendor': ['date-fns'],
          'i18n-vendor': ['i18next', 'react-i18next'],

          // Feature chunks
          'dashboard': [
            'client/src/components/dashboard/daily-tasks-dashboard.tsx',
            'client/src/components/dashboard/daily-tasks-dashboard-responsive.tsx'
          ],
          'charts': [
            'client/src/components/charts/simple-bar-chart.tsx',
            'client/src/components/charts/simple-pie-chart.tsx',
            'client/src/components/charts/custom-pie-chart.tsx'
          ],
          'ai-features': [
            'client/src/components/ai-service-status.tsx',
            'client/src/services/gemini.service.ts'
          ],
        },
      },
    },
    chunkSizeWarningLimit: 500, // 500KB limit
  },
  esbuild: {
    target: 'ES2020',
  },
});