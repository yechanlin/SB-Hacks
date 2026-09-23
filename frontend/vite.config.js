import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    port: 5173,
    open: false,
    host: true,
    // Forward API and WebSocket traffic to Express so the app also works
    // when opened directly on the Vite port during development.
    proxy: {
      '/api': 'http://localhost:3000',
      '/agent': { target: 'ws://localhost:3000', ws: true }
    },
    fs: {
      // Allow serving files from monaco-editor
      allow: ['..']
    }
  },
  preview: {
    port: 5173,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  optimizeDeps: {
    include: ['monaco-editor']
  }
});