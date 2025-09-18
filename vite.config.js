import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Multi-page app configuration
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        therapists: resolve(__dirname, 'therapists-services.html'),
        privacy: resolve(__dirname, 'maisie-privacy.html')
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

