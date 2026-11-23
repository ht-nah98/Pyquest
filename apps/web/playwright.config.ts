import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env['PQ_E2E_PORT'] ?? 5199);
// 5173 is the coach's server (AGENTS.md §9.9); 5174 would put the cloud project's server on it.
if (PORT === 5173 || PORT === 5174)
  throw new Error(`PQ_E2E_PORT=${String(PORT)} is the coach's server; pick another port.`);
/** The cloud project's server; its Supabase is faked by e2e/fakeSupabase.ts, never the real one. */
const CLOUD_PORT = PORT - 1;
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
