import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for NagarikSathi.
 * - In development: proxies /api to Express backend (port 3000)
 * - In production (GitHub Pages): base is set via VITE_BASE_URL env var
 */
export default defineConfig({
  plugins: [react()],
  // VITE_BASE_URL is set in CI to /nagarik-sathi/ for GitHub Pages
  base: process.env.VITE_BASE_URL || '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});

