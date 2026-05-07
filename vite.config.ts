import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function crossOriginIsolation(): Plugin {
  return {
    name: 'cross-origin-isolation',
    configureServer(server) {
      server.middlewares.use((_, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), crossOriginIsolation()],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
