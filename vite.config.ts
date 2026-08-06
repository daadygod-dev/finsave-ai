import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/frontend/src'),
    },
  },
  plugins: [react()],
  root: 'src/frontend',
  build: {
    outDir: '../../dist/frontend',
    emptyOutDir: true,
  },
  server: {
    // Dev convenience: proxy API calls to the backend (npm run dev:api on
    // port 3000) so VITE_API_BASE doesn't need to be set for local work.
    proxy: {
      '/api': 'http://localhost:3000',
      '/healthz': 'http://localhost:3000',
    },
  },
})
