import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Raise the warning threshold to 600 kB so leaflet's unavoidable
    // tile-layer bundle doesn't spam the build log.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy vendor libraries into their own cacheable chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-leaflet': ['leaflet'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
