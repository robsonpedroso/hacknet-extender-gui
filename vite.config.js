import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  logLevel: 'error',
  plugins: [
    react(),
  ],
  server: {
    port: 5174
  }
});