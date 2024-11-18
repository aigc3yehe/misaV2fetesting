import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    svgLoader()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://45.32.110.109:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name) {
            if (assetInfo.name.endsWith('.br')) {
              return '[name].[hash][extname]'
            }
            if (assetInfo.name.endsWith('.gz')) {
              return '[name].[hash][extname]'
            }
          }
          return '[name].[hash][extname]'
        }
      }
    }
  },
  publicDir: 'public',
  optimizeDeps: {
    exclude: ['*.wasm']
  }
})
