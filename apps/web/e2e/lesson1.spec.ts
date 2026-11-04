import { expect, test, type Page } from '@playwright/test';
import { asCoach, codeText, expectNoPageScroll, framesOf, pythonReady, typeCode } from './helpers';

async function openCode(page: Page) {
  await asCoach(page);
  await page.goto('/l/l01/code');
  await pythonReady(page);
}

test('drag a block, edit the code, blocks follow, run, fullscreen and back', async ({ page }) => {
  await openCode(page);
  await expectNoPageScroll(page);

  // Drag "vẽ chim" from the flyout into the workspace.
  const source = page.locator('.blocklyFlyout .blocklyDraggable').first();
  const box = await source.boundingBox();
  const target = await page.getByTestId('blocks-pane').boundingBox();
  if (box === null || target === null) throw new Error('no boxes');
  await page.mouse.move(box.x + 20, box.y + 12);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width * 0.6, target.y + 80, { steps: 12 });
  await page.mouse.up();
  await expect.poll(() => codeText(page)).toContain('draw_bird(100, 300)');

  // Code → blocks.
  await typeCode(page, 'x = 120\ndraw_bird(x, 250)');
  await expect(page.locator('.blocklyWorkspace > .blocklyBlockCanvas .blocklyText', { hasText: '120' })).toBeVisible();

  // Run: goal not met at (120, 250), then fix it.
  await page.getByTestId('run').click();
  await expect(page.getByTestId('var-watch')).toContainText('x = 120');
  await expect(page.getByTestId('goal-l01-g-bird')).toHaveAttribute('data-ok', 'false');
  await typeCode(page, 'draw_bird(100, 300)');
  await page.getByTestId('run').click();
  await expect(page.getByTestId('goal-l01-g-bird')).toHaveAttribute('data-ok', 'true');

  // Fullscreen and back: the code is untouched.
  await page.getByTestId('fullscreen').click();
  await expect(page.getByTestId('play-screen')).toBeVisible();
  await expect.poll(() => framesOf(page, 'play-stage')).toBeGreaterThan(0);
  await page.getByTestId('back-to-code').click();
  await expect(page.getByTestId('code-screen')).toBeVisible();
  expect(await codeText(page)).toBe('draw_bird(100, 300)');

  // Reload keeps the code.
  await page.reload();
  await pythonReady(page);
  expect(await codeText(page)).toBe('draw_bird(100, 300)');
});

test('a syntax error keeps the blocks and points at the line', async ({ page }) => {
  await openCode(page);
  await typeCode(page, 'draw_bird(100, 300)');
  await expect(page.locator('.blocklyWorkspace > .blocklyBlockCanvas .blocklyText', { hasText: '300' })).toBeVisible();
  await typeCode(page, 'draw_bird(100, 300)\nx = = 2');
  await expect(page.getByTestId('sync-error')).toContainText('Dòng 2');
  await expect(page.locator('.blocklyWorkspace > .blocklyBlockCanvas .blocklyText', { hasText: '300' })).toBeVisible();
  await page.getByTestId('run').click();
  await expect(page.getByTestId('run-error')).toContainText('Dòng 2');
});

test('an endless loop can be stopped', async ({ page }) => {
  await openCode(page);
  await typeCode(page, 'while True:\n    pass');
  await page.getByTestId('run').click();
  const stop = page.getByTestId('stop');
  const outcome = await Promise.race([
    stop.waitFor({ timeout: 5_000 }).then(() => 'stop-shown'),
    page.getByTestId('run-error').waitFor({ timeout: 20_000 }).then(() => 'limit-hit'),
  ]);
  if (outcome === 'stop-shown' && (await stop.isVisible())) await stop.click();
  await pythonReady(page);
  await page.getByTestId('run').click();
  await expect(page.getByTestId('run').or(page.getByTestId('stop'))).toBeVisible();
});
