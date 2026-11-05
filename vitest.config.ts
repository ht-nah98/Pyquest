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
          // Tests never reach the real Supabase project, whatever .env.local says.
          env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' },
          testTimeout: 60_000,
        },
      },
    ],
  },
});
