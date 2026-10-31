import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        catalog: resolve(__dirname, 'san-pham.html'),
        product: resolve(__dirname, 'chi-tiet-san-pham.html'),
        about: resolve(__dirname, 'gioi-thieu.html'),
        contact: resolve(__dirname, 'lien-he.html'),
      },
    },
  },
});
