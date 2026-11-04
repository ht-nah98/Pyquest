import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        // Headless packages and tools must run on plain Node (AGENTS.md §3 rule 1).
        test: {
          name: 'node',
          environment: 'node',
          include: ['packages/*/src/**/*.test.ts', 'tools/*/src/**/*.test.ts'],
          testTimeout: 60_000,
        },
      },
      {
        extends: './apps/web/vite.config.ts',
        root: './apps/web',
        test: {
          name: 'web',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['./src/test/setup.ts'],
          testTimeout: 60_000,
        },
      },
    ],
  },
});
