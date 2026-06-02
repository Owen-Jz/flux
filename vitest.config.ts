import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    // Mirror the tsconfig `@/*` -> project root path alias so tests can
    // resolve `@/...` imports the same way the Next.js build does.
    alias: [{ find: /^@\//, replacement: `${rootDir}/` }],
  },
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
