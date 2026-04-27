import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,wasm}'],
        runtimeCaching: [
          // Auth & billing: NetworkOnly — must never be served from cache
          {
            urlPattern: ({ url }) =>
              url.hostname === 'api.anondoc.app' &&
              /\/(auth\/(login|refresh|logout)|billing|webhook)/.test(url.pathname),
            handler: 'NetworkOnly',
          },
          // Other API calls: NetworkFirst with 5s timeout, then cache fallback
          {
            urlPattern: ({ url }) => url.hostname === 'api.anondoc.app',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          // Images: CacheFirst, 30-day expiry
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      manifest: {
        name: 'AnonDoc — GDPR-safe AI privacy layer',
        short_name: 'AnonDoc',
        description:
          'Anonymize documents locally before sending to ChatGPT or Claude. 100% in your browser. GDPR compliant.',
        theme_color: '#FAFAF8',
        background_color: '#FAFAF8',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait-primary',
        categories: ['productivity', 'business'],
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: '/screenshots/desktop-1.png',
            sizes: '1886x905',
            type: 'image/png',
            form_factor: 'wide',
            label: 'AnonDoc — GDPR-safe AI privacy layer (desktop)',
          },
          {
            src: '/screenshots/mobile-1.png',
            sizes: '380x807',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'AnonDoc on mobile',
          },
        ],
      },
    }),
  ],
  build: {
    target: 'esnext',
  },
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/auth': { target: 'http://localhost:3000', changeOrigin: true },
      '/me': { target: 'http://localhost:3000', changeOrigin: true },
      '/billing': { target: 'http://localhost:3000', changeOrigin: true },
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/health': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
})
