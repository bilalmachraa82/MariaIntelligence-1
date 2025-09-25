import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path, { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  root: './client',
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-transform-remove-console', { exclude: ['error', 'warn'] }]
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@shared': resolve(__dirname, './shared'),
    },
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "client/index.html"),
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'query-vendor': ['@tanstack/react-query'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers'],
          'chart-vendor': ['recharts'],
          'utils': ['clsx', 'class-variance-authority', 'tailwind-merge']
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: true
  },
  server: {
    hmr: {
      overlay: false
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'recharts',
      'lucide-react'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  css: {
    devSourcemap: false
  }
});
