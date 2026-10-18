import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Service worker custom (src/sw.js) : requis pour gérer les événements
      // `push` et `notificationclick` des notifications OS (Web Push).
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Le manifest existe déjà (public/site.webmanifest, lié dans index.html) :
      // on ne laisse pas le plugin en générer/injecter un second.
      manifest: false,
      injectManifest: {
        // Pas de précache d'assets statiques pour l'instant (pas de mode offline) :
        // on désactive le point d'injection pour éviter une erreur de build.
        injectionPoint: undefined,
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  base: '/',
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', 'react-hot-toast'],
          forms: ['react-hook-form', 'react-select', 'react-datepicker'],
          i18n: ['react-i18next', 'i18next', 'i18next-browser-languagedetector', 'i18next-http-backend']
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
  },
})
