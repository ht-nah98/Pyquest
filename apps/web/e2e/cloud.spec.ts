import { readFileSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { FakeSupabase } from './fakeSupabase';
import { codeText, pythonReady, typeCode } from './helpers';

const SOLUTION =
  (
    JSON.parse(
      readFileSync(
        new URL('../../../content/courses/bay-qua-khe/lessons/l01.json', import.meta.url),
        'utf8',
      ),
    ) as { exercises: { id: string; solution: Record<string, string> }[] }
  ).exercises[0]?.solution['main.py'] ?? '';

const SHOTS =
  '/tmp/claude-1000/-home-user-Desktop-CodeQuest/e375c142-0da2-4bf3-b4a0-8aec7ea13f58/scratchpad';

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
}

test('accounts: the coach adds a child; the child learns on two devices, offline too; the coach sees the code', async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const fake = new FakeSupabase();
  fake.addCoach('hlv@example.com', 'mat-khau-hlv');

  // The coach signs in and adds a child.
  const coach = await device(browser, fake);
  await coach.goto('/');
  await coach.getByTestId('coach-open').click();
  await coach.getByTestId('coach-email').fill('hlv@example.com');
  await coach.getByTestId('coach-password').fill('mat-khau-hlv');
  await coach.getByTestId('coach-go').click();
  await coach.getByTestId('to-coach').click();
  await coach.getByTestId('new-login').fill('an');
  await coach.getByTestId('new-nickname').fill('An Nhiên');
  await coach.getByTestId('new-pin').fill('123456');
  await coach.getByTestId('new-go').click();
  await expect(coach.getByTestId('new-result')).toContainText('PIN 123456');
  await expect(coach.getByTestId('student-an')).toContainText('An Nhiên');
  await coach.screenshot({ path: `${SHOTS}/cloud-coach-home.png` });

  // A wrong PIN says so in words.
  const a = await device(browser, fake);
  await studentLogin(a, 'an', '000000');
  await expect(a.getByTestId('login-error')).toContainText('chưa đúng');
  await a.screenshot({ path: `${SHOTS}/cloud-login.png` });

  // Device A: the child finishes exercise 1; it reaches the cloud.
  await studentLogin(a, 'an', '123456');
  await a.waitForURL('**/courses');
  await a.goto('/l/l01/code');
  await pythonReady(a);
  await typeCode(a, SOLUTION);
  await a.getByTestId('run').click();
  await expect(a.getByTestId('exercise-l01-e1')).toHaveAttribute('data-done', 'true');
  await expect(a.getByTestId('sync-status')).toHaveAttribute('data-sync', 'synced', {
    timeout: 15_000,
  });
  await expect
    .poll(
      () =>
        (fake.lesson('an', 'l01')?.state as { exercisesDone?: string[] } | undefined)
          ?.exercisesDone,
    )
    .toContain('l01-e1');

  // Device B: same child, a new browser; the ✓ is there.
  const b = await device(browser, fake);
  await studentLogin(b, 'an', '123456');
  await b.waitForURL('**/courses');
  await b.goto('/l/l01/code');
  await pythonReady(b);
  await expect(b.getByTestId('exercise-l01-e1')).toHaveAttribute('data-done', 'true');

  // Device A loses Wi-Fi: the work stays on the device and goes up when the network is back.
  await a.context().setOffline(true);
  await a.getByTestId('exercise-l01-e2').click();
  await pythonReady(a);
  await typeCode(a, 'from pyquest import *\n# viết khi mất mạng\n');
  await expect(a.getByTestId('sync-status')).toHaveAttribute('data-sync', /offline|pending/, {
    timeout: 15_000,
  });
  await a.context().setOffline(false);
  await expect(a.getByTestId('sync-status')).toHaveAttribute('data-sync', 'synced', {
    timeout: 20_000,
  });
  await expect
    .poll(() => JSON.stringify(fake.lesson('an', 'l01')?.state ?? {}))
    .toContain('viết khi mất mạng');

  // The coach sees the child's code, read-only, and can run it.
  const id = fake.profiles.find((p) => p.login === 'an')?.id ?? '';
  await coach.goto(`/coach/s/${id}`);
  await expect(coach.getByTestId('see-l01-e1')).toContainText('✓');
  await coach.getByTestId('see-l01-e1').click();
  await expect(coach.getByTestId('student-code')).toContainText('draw_rect');
  await coach.getByTestId('coach-run').click();
  await expect(coach.locator('canvas').first()).not.toHaveAttribute('data-frames', '0', {
    timeout: 60_000,
  });
  await coach.screenshot({ path: `${SHOTS}/cloud-coach-code.png` });

  // Signing out asks first, then shows the sign-in screen again.
  b.on('dialog', (d) => void d.accept());
  await b.getByTestId('profile-button').click();
  await expect(b.getByTestId('login-name')).toBeVisible();
  expect(await codeText(a)).toContain('viết khi mất mạng');
});
