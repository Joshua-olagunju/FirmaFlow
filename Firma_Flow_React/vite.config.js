import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Build configuration for production
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Set to true if you want source maps in production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          icons: ['lucide-react']
        }
      }
    }
  },
  // Development server configuration
  server: {
    proxy: {
      // Proxy /api requests to the PHP backend served by Apache
      // Rewrites /api/* -> /FirmaFlow/api/* so PHP files in the project root are reachable
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/FirmaFlow/api')
      }
    }
  },
  // Base path for production (adjust if deploying to a subdirectory)
  base: '/',
})
