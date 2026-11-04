import { expect, test } from '@playwright/test';
import { asCoach, codeText, pythonReady } from './helpers';

test('dragging a new def out of the toolbox works while the toolbox refreshes its call blocks', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await asCoach(page);
  await page.goto('/l/l04/code?ex=l04-e1');
  await pythonReady(page);
  await page.locator('.blocklyToolboxCategory', { hasText: 'Lệnh tự đặt' }).first().click();
  const source = page
    .locator('.blocklyFlyout .blocklyDraggable', { hasText: 'tự đặt lệnh' })
    .first();
  const box = await source.boundingBox();
  const target = await page.getByTestId('blocks-pane').boundingBox();
  if (box === null || target === null) throw new Error('no boxes');
  await page.mouse.move(box.x + 15, box.y + 12);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width * 0.55, target.y + 260, { steps: 15 });
  await page.mouse.up();
  await expect.poll(() => codeText(page)).toContain('def draw_bird():');
  await page.locator('.blocklyToolboxCategory', { hasText: 'Lệnh tự đặt' }).first().click();
  await expect(
    page.locator('.blocklyFlyout .blocklyText', { hasText: '📞 draw_bird' }).first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
