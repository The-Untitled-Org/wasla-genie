import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      { find: /^#core\/(.+)\.js$/, replacement: path.resolve(__dirname, './packages/core/src/$1.ts') },
      {
        find: /^#adapters\/(.+)\.js$/,
        replacement: path.resolve(__dirname, './packages/adapters/src/$1.ts'),
      },
      { find: /^#sync\/(.+)\.js$/, replacement: path.resolve(__dirname, './packages/sync/src/$1.ts') },
      {
        find: /^#shared\/(.+)\.js$/,
        replacement: path.resolve(__dirname, './packages/shared/src/$1.ts'),
      },
      { find: '@core', replacement: path.resolve(__dirname, './packages/core/src') },
      { find: '@adapters', replacement: path.resolve(__dirname, './packages/adapters/src') },
      { find: '@syncer', replacement: path.resolve(__dirname, './packages/sync/src') },
      { find: '@cli', replacement: path.resolve(__dirname, './apps/cli/src') },
      { find: '@utils', replacement: path.resolve(__dirname, './packages/shared/src') },
      { find: '@types', replacement: path.resolve(__dirname, './packages/core/src/types') },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      reportsDirectory: './output',
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'lcov', 'html'],
      include: ['apps/cli/src/**/*.ts', 'packages/**/*.ts'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.test.ts',
        '**/*.d.ts',
        'apps/cli/src/index.ts',
        'apps/cli/src/commands/**',
        'apps/visualizer/**',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
