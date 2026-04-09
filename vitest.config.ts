import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/__tests__/mobile/**',
      '**/__tests__/e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 30,
        statements: 50,
      },
      perFile: true,
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '__tests__/**',
      ],
    },
    dangerouslyIgnoreUnhandledErrors: true,
  },
});
