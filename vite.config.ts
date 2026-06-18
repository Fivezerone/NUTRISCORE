import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    sourcemap: true,
    minify: false,
    target: 'es2022',
    outDir: 'dist',
    rollupOptions: {
      input: {
        background: fileURLToPath(new URL('./src/background.ts', import.meta.url)),
        content: fileURLToPath(new URL('./src/content.tsx', import.meta.url)),
        popup: fileURLToPath(new URL('./popup.html', import.meta.url)),
        dashboard: fileURLToPath(new URL('./dashboard.html', import.meta.url))
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]'
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
