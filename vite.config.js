import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import viteCompression from 'vite-plugin-compression'
import { fileURLToPath, URL } from 'node:url'
import { injectResourceHints } from './plugins/injectResourceHints.js'

export default defineConfig({
  plugins: [
    vue(),
    injectResourceHints(),
    viteCompression({ algorithm: 'gzip', ext: '.gz' }),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    modulePreload: { polyfill: true },
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue')) return 'vue-vendor'
            return 'vendor'
          }
        },
      },
    },
  },
})
