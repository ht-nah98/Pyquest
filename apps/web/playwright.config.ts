import { defineConfig, devices } from '@playwright/test';

const PORT = 5199; // never 5173: that is the coach's server (AGENTS.md §9.9)
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
    { name: 'laptop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } }, testIgnore: /ipad/ },
    {
      name: 'ipad',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1080, height: 730 }, hasTouch: true },
      testMatch: /ipad/,
    },
  ],
  webServer: {
    command: `npx vite --port ${String(PORT)} --strictPort`,
    port: PORT,
    reuseExistingServer: false,
    env: { VITE_COACH_PIN: '2468' },
  },
});
