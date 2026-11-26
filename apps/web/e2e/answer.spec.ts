import { expect, test } from '@playwright/test';
import { asCoach, expectNoPageScroll, newStudent, pythonReady, typeCode } from './helpers';

// Bài 5 · Hàng 8 ô: 8 gold boxes at x = i * 50, y = 300 (spec 2026-11-26 lesson-likeness).
const NEAR = `from pyquest import *

for i in range(8):
    draw_rect(i * 50 + 4, 303, 40, 40, "gold")
`;

test('a picture a few pixels off passes, and shows how much it looks like the model', async ({
  page,
}) => {
  await newStudent(page);
  await page.goto('/l/l05/code?ex=l05-e1');
  await pythonReady(page);
  await typeCode(page, NEAR);
  await page.getByTestId('run').click();
  await expect(page.getByTestId('match-score')).toHaveText(/Giống mẫu \d+% · cần 90%/);
  await expect(page.getByTestId('goal-l05-e1-same')).toHaveAttribute('data-ok', 'true');
  await expect(page.getByTestId('next-exercise')).toBeVisible();
  await page.screenshot({ path: 'test-results/shots/answer-score-1280.png' });
});

test('after 5 runs that do not pass, 🔑 opens the answer beside the code', async ({ page }) => {
  await newStudent(page);
  await page.goto('/l/l05/code?ex=l05-e1');
  await pythonReady(page);
  const run = page.getByTestId('run');
  for (let i = 0; i < 4; i++) {
    await run.click();
    await expect(run).toHaveText(/Chạy/);
  }
  await expect(page.getByTestId('match-score')).toHaveText(/Giống mẫu \d+% · cần 90%/);
  await expect(page.getByTestId('answer-open')).toHaveCount(0);
  await run.click();
  await expect(run).toHaveText(/Chạy/);
  await page.getByTestId('answer-open').click();
  const panel = page.getByTestId('answer-panel');
  await expect(panel).toContainText('for i in range(8):');
  await expect(panel).toContainText('draw_rect(i * 50, 300, 40, 40, "gold")');
  await expectNoPageScroll(page);
  await page.screenshot({ path: 'test-results/shots/answer-1280.png' });
  await page.setViewportSize({ width: 1866, height: 966 });
  await expectNoPageScroll(page);
  await page.screenshot({ path: 'test-results/shots/answer-1866.png' });
  await page.getByTestId('answer-close').click();
  await expect(page.getByTestId('task-card')).toBeVisible();
});

test('the coach sees 🔑 from the start', async ({ page }) => {
  await asCoach(page);
  await page.goto('/l/l05/code?ex=l05-e1');
  await pythonReady(page);
  await expect(page.getByTestId('answer-open')).toBeVisible();
});
