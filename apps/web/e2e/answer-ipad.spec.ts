import { expect, test } from '@playwright/test';
import { expectNoPageScroll, newStudent, pythonReady } from './helpers';

test('iPad: the score line and 🔑 Đáp án fit beside the code', async ({ page }) => {
  await newStudent(page);
  await page.goto('/l/l05/code?ex=l05-e1');
  await pythonReady(page);
  const run = page.getByTestId('run');
  for (let i = 0; i < 5; i++) {
    await run.tap();
    await expect(run).toHaveText(/Chạy/);
  }
  await expect(page.getByTestId('match-score')).toBeVisible();
  await page.screenshot({ path: 'test-results/shots/answer-task-ipad.png' });
  await page.getByTestId('answer-open').tap();
  await expect(page.getByTestId('answer-panel')).toContainText('for i in range(8):');
  await expectNoPageScroll(page);
  await page.screenshot({ path: 'test-results/shots/answer-ipad.png' });
});
