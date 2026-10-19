import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/CoffeePeer/', // GitHub Pages serves the app at /<repo>/
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'CoffeePeer',
        short_name: 'CoffeePeer',
        theme_color: '#6f4e37',
        background_color: '#ffffff',
        display: 'standalone',
        // ponytail: one 512px icon declared for both sizes, browsers downscale
        icons: [
          { src: 'icon-512.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
