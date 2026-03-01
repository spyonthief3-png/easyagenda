import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 5173, // Move Frontend to 5173
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3000', // Proxy API to Backend
          changeOrigin: true,
          secure: false,
        }
      },
      hmr: {
        clientPort: 5173 // Force HMR on 5173
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
