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

test('iPad: 📐 pick a template by finger, the faint template and the score fit the screen', async ({
  page,
}) => {
  await newStudent(page, 'Lan');
  await page.getByTestId('to-studio').tap();
  await page.getByTestId('trace-mode').tap();
  await expect(page.locator('[data-testid="template-thumb"][data-drawn="true"]')).toHaveCount(6, {
    timeout: 30_000,
  });
  await page.screenshot({ path: `${SHOTS}/studio-templates-ipad.png` });
  await page.getByTestId('template-gia-dinh').tap();
  await page.waitForURL(/\/studio\/[a-z0-9]+$/);
  await pythonReady(page);
  await expect(page.getByTestId('stage')).toHaveAttribute('data-ghost', 'on');
  await page.getByTestId('run').tap();
  await expect(page.getByTestId('likeness')).toBeVisible({ timeout: 30_000 });
  for (const id of ['ghost-toggle', 'run', 'download']) {
    const box = await page.getByTestId(id).boundingBox();
    expect(box?.height ?? 0, id).toBeGreaterThanOrEqual(44);
  }
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/studio-trace-ipad.png` });
});

test('iPad: 🖼️ Kho hình opens by finger, tiles and ➕ are finger-size', async ({ page }) => {
  await newStudent(page, 'Lan');
  await page.getByTestId('to-studio').tap();
  await page.getByTestId('new-drawing').tap();
  await page.waitForURL(/\/studio\/[a-z0-9]+$/);
  await pythonReady(page);
  await page.getByTestId('pictures-toggle').tap();
  await page.getByTestId('picture-group-cay-hoa').tap();
  await page.getByTestId('picture-deco-lotus').tap();
  await expect(page.getByTestId('picture-code')).toContainText('deco-lotus.png');
  for (const id of ['pictures-toggle', 'picture-group-chim', 'picture-deco-lotus', 'picture-add']) {
    const box = await page.getByTestId(id).boundingBox();
    expect(box?.height ?? 0, id).toBeGreaterThanOrEqual(36);
  }
  await page.getByTestId('picture-add').tap();
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/studio-pictures-ipad.png` });
});
