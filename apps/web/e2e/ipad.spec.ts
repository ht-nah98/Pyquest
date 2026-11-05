import { expect, test } from '@playwright/test';
import { asCoach, expectNoPageScroll, pythonReady, typeCode } from './helpers';

test('iPad landscape: slides and the code screen work by touch without page scroll', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByTestId('nickname').fill('Lan');
  await page.getByTestId('create').tap();
  await page.waitForURL('**/courses');
  await page.getByTestId('course-bay-qua-khe').tap();
  await page.getByTestId('lesson-l00').tap();
  await expect(page.getByTestId('slide-l00-hello')).toBeVisible();
  await page.getByTestId('slide-next').tap();
  await expect(page.getByTestId('slide-l00-parts')).toBeVisible();
  await expectNoPageScroll(page);

  await asCoach(page);
  await page.goto('/l/l01/code');
  await pythonReady(page);
  await expectNoPageScroll(page);
  await typeCode(page, 'from pyquest import *\ndraw_rect(100, 300, 40, 40, "gold")');
  await page.getByTestId('run').tap();
  await expect(page.getByTestId('goal-l01-g-box')).toHaveAttribute('data-ok', 'true');
  const run = await page.getByTestId('run').boundingBox();
  expect(run?.height ?? 0).toBeGreaterThanOrEqual(44);
  // Blocks above code, so the stage keeps a tall column, and the task card stays inside the window.
  const stage = await page.locator('[data-testid="code-screen"] canvas').first().boundingBox();
  expect(stage?.height ?? 0).toBeGreaterThanOrEqual(280);
  const card = await page.getByTestId('task-card').boundingBox();
  expect((card?.x ?? 0) + (card?.width ?? 0)).toBeLessThanOrEqual(1080);
  const lib = await page.getByTestId('library-toggle').boundingBox();
  expect(lib?.height ?? 0).toBeGreaterThanOrEqual(36);
});
