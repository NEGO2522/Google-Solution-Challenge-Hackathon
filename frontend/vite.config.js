import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const isDev = process.env.NODE_ENV !== 'production'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',

      // Service worker filename
      filename: 'sw.js',

      // Cache the shell + assets
      workbox: {
        // Only glob-precache in production builds; dev-dist has no real assets
        globPatterns: isDev ? [] : ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        // Don't cache Supabase or Gemini API calls — always fresh
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/auth/],
        runtimeCaching: [
          {
            // Cache map tiles for offline field use
            urlPattern: /^https:\/\/[abc]\.basemaps\.cartocdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          {
            // Cache Leaflet marker images
            urlPattern: /^https:\/\/unpkg\.com\/leaflet.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'leaflet-assets',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Network-first for Supabase — fall back to cache if offline
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },

      // Web App Manifest
      manifest: {
        name: 'VolunteerBridge',
        short_name: 'VBridge',
        description: 'AI-powered volunteer dispatch for disaster relief and community crisis response.',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        orientation: 'portrait-primary',
        categories: ['utilities', 'productivity'],
        lang: 'en',
        icons: [
          {
            src: '/icons/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Report Crisis',
            short_name: 'Report',
            description: 'Report a new crisis or emergency',
            url: '/report',
            icons: [{ src: '/icons/pwa-192.png', sizes: '192x192' }],
          },
          {
            name: 'My Tasks',
            short_name: 'Tasks',
            description: 'View and manage your assigned tasks',
            url: '/tasks',
            icons: [{ src: '/icons/pwa-192.png', sizes: '192x192' }],
          },
          {
            name: 'Live Map',
            short_name: 'Map',
            description: 'View live crisis map',
            url: '/map',
            icons: [{ src: '/icons/pwa-192.png', sizes: '192x192' }],
          },
        ],
        screenshots: [
          {
            src: '/screenshots/01-dashboard.png',
            sizes: '1280x720',
            type: 'image/png',
            label: 'Dashboard Overview',
          },
          {
            src: '/screenshots/02-live-map.png',
            sizes: '1280x720',
            type: 'image/png',
            label: 'Live Crisis Map',
          },
        ],
      },

      // Dev mode — lets you test the SW during `npm run dev`
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],

  optimizeDeps: {
    include: ['leaflet', 'react-leaflet'],
  },

  define: {
    'process.env': {},
  },
})
