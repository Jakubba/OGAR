import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) {
            return 'vendor-firestore'
          }
          if (id.includes('firebase/auth') || id.includes('@firebase/auth')) {
            return 'vendor-firebase-auth'
          }
          if (id.includes('firebase') || id.includes('@firebase')) {
            return 'vendor-firebase'
          }
          if (id.includes('lucide')) {
            return 'vendor-icons'
          }
          if (id.includes('vue-router') || id.includes('/vue/') || id.includes('pinia')) {
            return 'vendor-vue'
          }
          return 'vendor'
        },
      },
    },
  },
})