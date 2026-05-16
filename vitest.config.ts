import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@adapters': path.resolve(__dirname, './src/adapters'),
      '@syncer': path.resolve(__dirname, './src/syncer'),
      '@cli': path.resolve(__dirname, './src/cli'),
      '@daemon': path.resolve(__dirname, './src/daemon'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/core/types'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.test.ts',
        '**/*.d.ts',
      ],
    },
  },
});
