import { defineConfig, mergeConfig } from 'vite';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    server: {
      host: '127.0.0.1',
      port: 5177,
      strictPort: true,
      proxy: {
        '/api': 'http://127.0.0.1:3002',
        '/health': 'http://127.0.0.1:3002',
        '/ws': { target: 'ws://127.0.0.1:3002', ws: true },
      },
    },
  }),
);
