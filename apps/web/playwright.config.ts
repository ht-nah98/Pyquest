import { defineConfig, devices } from '@playwright/test';

const PORT = 5199; // never 5173: that is the coach's server (AGENTS.md §9.9)
/** The cloud project's server; its Supabase is faked by e2e/fakeSupabase.ts, never the real one. */
const CLOUD_PORT = 5198;
const FAKE_SUPABASE = 'https://pq-fake.supabase.co';
const CI = process.env['CI'] !== undefined;

export default defineConfig({
  testDir: './e2e',
  timeout: (CI ? 2.5 : 1) * 90_000,
  expect: { timeout: (CI ? 2.5 : 1) * 15_000 },
  workers: CI ? 1 : 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'laptop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
      testIgnore: /ipad|cloud/,
    },
    {
      name: 'ipad',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1080, height: 730 }, hasTouch: true },
      testMatch: /ipad/,
    },
    {
      // Accounts and sync against a fake Supabase (e2e/fakeSupabase.ts), on its own server.
      name: 'cloud',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        baseURL: `http://localhost:${String(CLOUD_PORT)}`,
      },
      testMatch: /cloud/,
    },
  ],
  webServer: [
    {
      command: `npx vite --port ${String(PORT)} --strictPort`,
      port: PORT,
      reuseExistingServer: false,
      // No Supabase here: profiles stay on the device (the real project is never touched by tests).
      env: { VITE_COACH_PIN: '2468', VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' },
    },
    {
      command: `npx vite --port ${String(CLOUD_PORT)} --strictPort`,
      port: CLOUD_PORT,
      reuseExistingServer: false,
      env: {
        VITE_COACH_PIN: '',
        VITE_SUPABASE_URL: FAKE_SUPABASE,
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fake',
      },
    },
  ],
});
