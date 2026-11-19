import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
      '@components': path.resolve(rootDir, './src/components'),
      '@features': path.resolve(rootDir, './src/features'),
      '@hooks': path.resolve(rootDir, './src/hooks'),
      '@lib': path.resolve(rootDir, './src/lib'),
      '@stores': path.resolve(rootDir, './src/stores'),
      '@pages': path.resolve(rootDir, './src/pages'),
      '@data': path.resolve(rootDir, './src/data'),
      '@assets': path.resolve(rootDir, './src/assets'),
      '@routes': path.resolve(rootDir, './src/routes'),
      '@services': path.resolve(rootDir, './src/services'),
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
