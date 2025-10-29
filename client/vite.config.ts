import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // @ts-expect-error - Tailwind plugin types not updated yet
    tailwindcss({
      theme: {
        extend: {
          fontFamily: {
            todoist: [
              'Segoe UI',
              'Roboto',
              'Helvetica Neue',
              'Arial',
              'sans-serif',
            ],
            todoistform: [
              'Twemoji Country Flags',
              '-apple-system'
            ],
          },
          fontWeight: {
            medium: '500',
            semibold: '600',
            bold: '700',
          },
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
