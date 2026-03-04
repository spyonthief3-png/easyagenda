import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react() // Vite standard React plugin
    ],
    server: {
      port: 5173,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      minify: 'esbuild',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom', 'react-router-dom'],
          }
        }
      },
      chunkSizeWarningLimit: 600,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      }
    }
  };
});
