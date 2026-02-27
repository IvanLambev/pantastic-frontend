import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: mode === 'production' ? {
    drop: ['console', 'debugger']
  } : undefined,
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-components': [
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs'
          ],
          'chart-vendor': ['recharts', 'd3-scale', 'd3-array'],
          'icons': ['lucide-react', '@tabler/icons-react'],
          'scroll': ['lenis']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
}))