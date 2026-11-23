import { expect, test } from '@playwright/test';
import { expectNoPageScroll, newStudent, pythonReady, typeCode } from './helpers';

const SHOTS = process.env['PQ_SHOTS'] ?? 'test-results/shots';

test('iPad: the studio fits the screen, blocks above code, finger-size buttons', async ({
  page,
}) => {
  await newStudent(page, 'Lan');
  await page.getByTestId('to-studio').tap();
  await page.getByTestId('new-drawing').tap();
  await page.waitForURL(/\/studio\/[a-z0-9]+$/);
  await pythonReady(page);
  await typeCode(
    page,
    'from pyquest import *\n\nclear("navy")\nfor i in range(5):\n    draw_circle(100 + i * 100, 300, 40, "gold")\n',
  );
  await page.getByTestId('run').tap();
  await expect(page.getByTestId('stage')).not.toHaveAttribute('data-frames', '0');
  await expect(page.getByTestId('run')).toBeVisible({ timeout: 30_000 });
  await expect(
    page
      .locator('.blocklyWorkspace > .blocklyBlockCanvas .blocklyText', { hasText: 'navy' })
      .first(),
  ).toBeVisible();
  await page.getByTestId('challenge-hang-rao').tap();
  await expect(page.getByTestId('challenge-open')).toContainText('Hàng rào');

  // Blocks sit above the code below 1280 px.
  const blocks = await page.getByTestId('blocks-title').boundingBox();
  const code = await page.locator('.cm-content').boundingBox();
  expect(blocks !== null && code !== null && blocks.y < code.y).toBe(true);

  for (const id of ['run', 'download', 'challenge-show-hint', 'challenge-back']) {
    const box = await page.getByTestId(id).boundingBox();
    expect(box?.height ?? 0, id).toBeGreaterThanOrEqual(44);
  }
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/studio-ipad.png` });

  await page.getByTestId('back').tap();
  await page.waitForURL('**/studio');
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/studio-list-ipad.png` });
});
