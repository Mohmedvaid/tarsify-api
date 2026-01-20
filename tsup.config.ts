import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  dts: false, // Skip declaration files for faster builds
  splitting: false,
  treeshake: true,
  // Resolve path aliases
  esbuildOptions(options) {
    options.alias = {
      '@': './src',
      '@config': './src/config',
      '@core': './src/core',
      '@routes': './src/routes',
      '@shared': './src/shared',
      '@plugins': './src/plugins',
    };
  },
});
