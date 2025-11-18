// Vite config for GitHub Pages deployment
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Use the GitHub Pages base in production; serve from root during development
  base: process.env.NODE_ENV === 'production' ? '/blood-sugar-monitoring/' : '/',
  plugins: [react()],
  // During development, proxy requests under `/api` to the backend
  // so the browser talks only to the dev server origin and avoids CORS.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
