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
    ],
  },
});
