import { expect, test, type Browser, type Page } from '@playwright/test';
import { FakeSupabase } from './fakeSupabase';
import { codeText, pythonReady, typeCode } from './helpers';

const SHOTS = process.env['PQ_SHOTS'] ?? 'test-results/shots';

async function device(browser: Browser, fake: FakeSupabase): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await fake.attach(context);
  return context.newPage();
}

async function studentLogin(page: Page, login: string, pin: string) {
  await page.goto('/');
  await page.getByTestId('login-name').fill(login);
  await page.getByTestId('login-pin').fill(pin);
  await page.getByTestId('login-go').click();
  await page.waitForURL('**/courses');
}

test('studio: a drawing syncs to the child’s other device and the coach sees it; a delete syncs too', async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const fake = new FakeSupabase();
  fake.addCoach('hlv@example.com', 'mat-khau-hlv');

  const coach = await device(browser, fake);
  await coach.goto('/');
  await coach.getByTestId('coach-open').click();
  await coach.getByTestId('coach-email').fill('hlv@example.com');
  await coach.getByTestId('coach-password').fill('mat-khau-hlv');
  await coach.getByTestId('coach-go').click();
  await coach.getByTestId('to-coach').click();
  await coach.getByTestId('new-login').fill('an');
  await coach.getByTestId('new-nickname').fill('An');
  await coach.getByTestId('new-pin').fill('123456');
  await coach.getByTestId('new-go').click();
  await expect(coach.getByTestId('new-result')).toContainText('PIN 123456');

  // Device A draws.
  const a = await device(browser, fake);
  await studentLogin(a, 'an', '123456');
  await a.getByTestId('to-studio').click();
  await a.getByTestId('new-drawing').click();
  await a.waitForURL(/\/studio\/[a-z0-9]+$/);
  const id = a.url().split('/').pop() ?? '';
  await pythonReady(a);
  await typeCode(
    a,
    'from pyquest import *\n\nclear("black")\ndraw_circle(300, 300, 80, "yellow")\n',
  );
  await a.getByTestId('drawing-title').fill('Mặt trăng');
  await expect(a.getByTestId('sync-status')).toHaveAttribute('data-sync', 'synced', {
    timeout: 20_000,
  });
  await expect
    .poll(() => JSON.stringify(fake.lesson('an', `studio:${id}`)?.state ?? {}))
    .toContain('Mặt trăng');
  expect(JSON.stringify(fake.lesson('an', `studio:${id}`)?.state)).toContain('yellow');

  // Device B: same child, the drawing is there with its code.
  const b = await device(browser, fake);
  await studentLogin(b, 'an', '123456');
  await expect(b.getByTestId('studio-count')).toHaveText('1 tranh');
  await b.getByTestId('to-studio').click();
  await expect(b.getByTestId(`drawing-${id}`)).toContainText('Mặt trăng');
  await b.getByTestId(`drawing-${id}`).getByTestId('open-drawing').click();
  await pythonReady(b);
  expect(await codeText(b)).toContain('draw_circle(300, 300, 80, "yellow")');

  // The coach sees the drawing on the child's page, read-only, and runs it.
  const userId = fake.profiles.find((p) => p.login === 'an')?.id ?? '';
  await coach.goto(`/coach/s/${userId}`);
  await expect(coach.getByTestId('student-drawings')).toContainText('Mặt trăng');
  await coach.getByTestId(`see-drawing-${id}`).click();
  await expect(coach.getByTestId('student-code')).toContainText('draw_circle');
  await expect(coach.getByTestId('stage')).toHaveAttribute('data-stage', '600x600');
  await coach.getByTestId('coach-run').click();
  await expect(coach.getByTestId('stage')).not.toHaveAttribute('data-frames', '0', {
    timeout: 60_000,
  });
  await coach.screenshot({ path: `${SHOTS}/studio-coach-1280.png` });

  // Device A deletes it; device B's next start drops it.
  await a.getByTestId('back').click();
  a.once('dialog', (d) => void d.accept());
  await a.getByTestId(`drawing-${id}`).getByTestId('delete').click();
  await expect(a.getByTestId('no-drawings')).toBeVisible();
  const row = () => fake.lesson('an', `studio:${id}`)?.state as { studio?: { deleted?: boolean } };
  await expect.poll(() => row().studio?.deleted, { timeout: 20_000 }).toBe(true);
  // B pulls on start; under load the first pull may finish after the list drew, so open it again.
  await expect(async () => {
    await b.goto('/studio');
    await expect(b.getByTestId('no-drawings')).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 40_000 });
});
