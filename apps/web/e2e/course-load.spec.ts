import { expect, test } from '@playwright/test';
import { newStudent, pythonReady } from './helpers';

/** A whole lesson file (a head is asked for with ?head). ADR 0012. */
const isBody = (url: string) => /\/lessons\/[a-z]\d{2}\.json/.test(url) && !/[?&]head\b/.test(url);

test('a child downloads the open course, and never the draft one', async ({ page }) => {
  const bodies: string[] = [];
  page.on('request', (r) => {
    if (isBody(r.url())) bodies.push(/([a-z]\d{2})\.json/.exec(r.url())?.[1] ?? '');
  });
  await newStudent(page);
  await page.getByTestId('course-bay-qua-khe').click();
  await expect(page.getByTestId('lesson-l25')).toBeVisible();
  await expect.poll(() => new Set(bodies).size).toBe(26);
  await page.goto('/c/ham-ngoc');
  await page.waitForURL((u) => u.pathname === '/courses');
  await page.goto('/l/l01/code');
  await pythonReady(page);
  expect(bodies.filter((id) => id.startsWith('h'))).toEqual([]);
});

test('the network is down: the page says so, and ↻ opens the lesson once it is back', async ({
  page,
}) => {
  await newStudent(page);
  let down = true;
  await page.route(
    (u) => isBody(u.href),
    (route) => (down ? route.abort() : route.continue()),
  );
  await page.goto('/l/l00');
  await expect(page.getByTestId('course-failed')).toBeVisible();
  await page.screenshot({ path: 'test-results/shots/course-failed.png' });
  down = false;
  await page.getByRole('button', { name: /Thử lại/ }).click();
  await expect(page.getByTestId('slide-l00-hello')).toBeVisible();
});
