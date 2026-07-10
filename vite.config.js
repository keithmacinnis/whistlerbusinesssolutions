import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Serve dashboard.html for /dashboard client-side routes in dev
// (production equivalent lives in vercel.json rewrites).
const dashboardSpaFallback = () => ({
  name: 'dashboard-spa-fallback',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url.split('?')[0]
      if (url === '/dashboard' || (url.startsWith('/dashboard/') && !url.includes('.'))) {
        req.url = '/dashboard.html'
      }
      next()
    })
  }
})

export default defineConfig({
  plugins: [react(), tailwindcss(), dashboardSpaFallback()],
  // Multi-page app configuration
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        therapists: resolve(__dirname, 'therapists-services.html'),
        privacy: resolve(__dirname, 'maisie-privacy.html'),
        shop: resolve(__dirname, 'shop.html'),
        shopSuccess: resolve(__dirname, 'shop-success.html'),
        shopCancel: resolve(__dirname, 'shop-cancel.html'),
        dashboard: resolve(__dirname, 'dashboard.html')
      }
    },
    // Output directory for Vercel
    outDir: 'dist',
    // Generate source maps for debugging
    sourcemap: true
  },
  // Development server configuration
  server: {
    port: 3000,
    open: true
  },
  // Asset handling
  assetsInclude: ['**/*.jpg', '**/*.png', '**/*.webp', '**/*.mp3'],
  // Public directory for static assets
  publicDir: 'public'
})
