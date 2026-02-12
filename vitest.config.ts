import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, './src/config'),
      '@core': path.resolve(__dirname, './src/core'),
      '@routes': path.resolve(__dirname, './src/routes'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@plugins': path.resolve(__dirname, './src/plugins'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'dist',
        '**/*.test.ts',
        '**/types/**',
        '**/index.ts',
        // Config and infrastructure files
        'eslint.config.js',
        'vitest.config.ts',
        'tsup.config.ts',
        'prisma/seed.ts',
        'src/server.ts', // Entry point
      ],
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    // Use forks pool for better cleanup (prevents orphaned processes)
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Load .env file
    env: {
      NODE_ENV: 'test',
      FIREBASE_MOCK: 'true',
    },
  },
  esbuild: {
    target: 'node20',
  },
});
