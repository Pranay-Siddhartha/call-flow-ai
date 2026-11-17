import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    restoreMocks: true,
    clearMocks: true,
  },
  server: {
    port: 3000,
    open: false,
  },
});
