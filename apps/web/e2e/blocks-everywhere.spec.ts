import { expect, test, type Page } from '@playwright/test';
import { asCoach, codeText, expectNoPageScroll, pythonReady } from './helpers';

const SHOTS = process.env['PQ_SHOTS'] ?? 'test-results/shots';

/** Drags the first toolbox block with this label from a category onto the workspace. */
async function dragFromToolbox(page: Page, category: string, label: string): Promise<void> {
  await page.locator('.blocklyToolboxCategory', { hasText: category }).first().click();
  const source = page.locator('.blocklyFlyout .blocklyDraggable', { hasText: label }).first();
  const box = await source.boundingBox();
  const target = await page.getByTestId('blocks-pane').boundingBox();
  if (box === null || target === null) throw new Error('no boxes');
  await page.mouse.move(box.x + 15, box.y + 12);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width * 0.6, target.y + target.height * 0.7, {
    steps: 15,
  });
  await page.mouse.up();
}

test('a game exercise (Bài 20) has a toolbox, real blocks for pipe[0] = …, and dragging writes code', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await asCoach(page);
  await page.goto('/l/l20/code');
  await pythonReady(page);
  await expect(page.getByTestId('typing-note')).toBeVisible();
  // pipe[0] = pipe[0] - 2 is a real list block now, not code text.
  await expect(
    page
      .locator('.blocklyWorkspace > .blocklyBlockCanvas .blocklyText', { hasText: 'ngăn số' })
      .first(),
  ).toBeVisible();

  await dragFromToolbox(page, 'Danh sách', 'đặt');
  await expect.poll(() => codeText(page)).toContain('xs[0] = 0');

  await page.getByTestId('run').click();
  await page.waitForTimeout(1500);
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/blocks-l20-laptop.png` });
  expect(errors).toEqual([]);
});
