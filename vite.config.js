import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default {
  plugins: [tailwindcss()],
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        docs: resolve(__dirname, 'docs.html'),
        'reset-password': resolve(__dirname, 'reset-password.html'),
      },
    },
  },
};
