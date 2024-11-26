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
        target: 'http://45.32.110.109:5555',
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
        manualChunks: undefined,
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          const info = name.split('.');
          const extType = info[info.length - 1];
          
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(name)) {
            return `assets/media/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          if (/\.(br)(\?.*)?$/i.test(name)) {
            return `[name].[hash][extname]`;
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        }
      }
    }
  },
  publicDir: 'public',
  optimizeDeps: {
    exclude: ['*.wasm']
  }
})
