import { expect, test } from '@playwright/test';
import { asCoach, framesOf, pythonReady, typeCode } from './helpers';

const SHOTS = process.env['PQ_SHOTS'] ?? 'test-results/shots';

const INF_GAME = `from pyquest import *

nearest = 0
big = 10 ** 5000


def update():
    global nearest
    nearest = float("inf")
    for d in [40, 7, 90]:
        if d < nearest:
            nearest = d
    nearest = nearest + float("inf")


def draw():
    clear("skyblue")
`;

test('inf and endless numbers in the variables do not freeze a game; drawn, they are an error', async ({
  page,
}) => {
  await asCoach(page);
  await page.goto('/l/l17/code');
  await pythonReady(page);
  await typeCode(page, INF_GAME);
  await page.getByTestId('run').click();
  await expect(page.getByTestId('stop')).toBeVisible();
  await expect.poll(() => framesOf(page, 'stage'), { timeout: 60_000 }).toBeGreaterThan(20);
  await expect(page.getByTestId('var-watch')).toContainText('nearest = "inf"');
  await expect(page.getByTestId('var-watch')).toContainText('big = "số rất dài"');
  await page.screenshot({ path: `${SHOTS}/python-inf-1280.png` });
  await page.getByTestId('stop').click();
  await pythonReady(page);

  await typeCode(page, INF_GAME + '    draw_rect(nearest, 0, 5, 5)\n');
  await page.getByTestId('run').click();
  await expect(page.getByTestId('run-error')).toHaveText(/x không được là inf/);
  await expect(page.getByTestId('run')).toBeVisible();
});

test('the worker dies in the middle of a game: a message, and ▶ works again by itself', async ({
  page,
}) => {
  await asCoach(page);
  await page.goto('/l/l17/code');
  await pythonReady(page);
  await typeCode(page, INF_GAME);
  await page.getByTestId('run').click();
  await expect.poll(() => framesOf(page, 'stage'), { timeout: 60_000 }).toBeGreaterThan(5);
  await page.workers()[0]?.evaluate(() => {
    setTimeout(() => {
      throw new Error('out of memory');
    }, 0);
  });
  await expect(page.getByTestId('run-error')).toHaveText(/Có trục trặc khi chạy/);
  await expect(page.getByTestId('stop')).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/python-crash-1280.png` });
  await pythonReady(page);
  // The blocks show the typed code, even when its parse died with the worker.
  await expect(
    page.locator('.blocklyBlockCanvas .blocklyText', { hasText: '10 ** 5000' }).first(),
  ).toBeAttached();
  const before = await framesOf(page, 'stage');
  await page.getByTestId('run').click();
  await expect.poll(() => framesOf(page, 'stage'), { timeout: 60_000 }).toBeGreaterThan(before + 5);
  await expect(page.getByTestId('run-error')).toHaveCount(0);
  await page.getByTestId('stop').click();
});

test('a program that breaks Python itself (endless recursion, no limit) leaves ▶ usable', async ({
  page,
}) => {
  await asCoach(page);
  await page.goto('/l/l01/code');
  await pythonReady(page);
  await typeCode(
    page,
    'import sys\nsys.setrecursionlimit(10 ** 6)\n\n\ndef f():\n    return f()\n\n\nf()',
  );
  await page.getByTestId('run').click();
  await expect(page.getByTestId('run-error')).toBeVisible({ timeout: 60_000 });
  await pythonReady(page);
  await typeCode(page, 'print("vẫn chạy")');
  await page.getByTestId('run').click();
  await expect(page.getByTestId('bubble')).toHaveText('vẫn chạy');
  await expect(page.getByTestId('run-error')).toHaveCount(0);
});
