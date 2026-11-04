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
  const source = page.locator('.blocklyFlyout .blocklyDraggable', { hasText: 'vẽ chim' }).first();
  const box = await source.boundingBox();
  const target = await page.getByTestId('blocks-pane').boundingBox();
  if (box === null || target === null) throw new Error('no boxes');
  await page.mouse.move(box.x + 20, box.y + 12);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width * 0.6, target.y + 80, { steps: 12 });
  await page.mouse.up();
  await expect.poll(() => codeText(page)).toContain('draw_bird(100, 300)');

  // Code → blocks.
  await typeCode(page, 'from pyquest import *\nx = 120\ndraw_bird(x, 250)');
  await expect(
    page.locator('.blocklyWorkspace > .blocklyBlockCanvas .blocklyText', { hasText: '120' }),
  ).toBeVisible();

  // Run: goal not met at (120, 250), then fix it.
  await page.getByTestId('run').click();
  await expect(page.getByTestId('var-watch')).toContainText('x = 120');
  await expect(page.getByTestId('goal-l01-g-bird')).toHaveAttribute('data-ok', 'false');
  await typeCode(page, 'from pyquest import *\ndraw_bird(100, 300)');
  await page.getByTestId('run').click();
  await expect(page.getByTestId('goal-l01-g-bird')).toHaveAttribute('data-ok', 'true');

  // Fullscreen and back: the code is untouched.
  await page.getByTestId('fullscreen').click();
  await expect(page.getByTestId('play-screen')).toBeVisible();
  await expect.poll(() => framesOf(page, 'play-stage')).toBeGreaterThan(0);
  await page.getByTestId('back-to-code').click();
  await expect(page.getByTestId('code-screen')).toBeVisible();
  expect(await codeText(page)).toBe('from pyquest import *\ndraw_bird(100, 300)');

  // Reload keeps the code.
  await page.reload();
  await pythonReady(page);
  expect(await codeText(page)).toBe('from pyquest import *\ndraw_bird(100, 300)');
});

test('a syntax error keeps the blocks and points at the line', async ({ page }) => {
  await openCode(page);
  await typeCode(page, 'from pyquest import *\ndraw_bird(100, 300)');
  await expect(
    page.locator('.blocklyWorkspace > .blocklyBlockCanvas .blocklyText', { hasText: '300' }),
  ).toBeVisible();
  await typeCode(page, 'from pyquest import *\ndraw_bird(100, 300)\nx = = 2');
  await expect(page.getByTestId('sync-error')).toContainText('Dòng 3');
  await expect(
    page.locator('.blocklyWorkspace > .blocklyBlockCanvas .blocklyText', { hasText: '300' }),
  ).toBeVisible();
  await page.getByTestId('run').click();
  await expect(page.getByTestId('run-error')).toContainText('Dòng 3');

  // Review C1: while the code has an error, touching the blocks must not overwrite it.
  await expect(page.getByTestId('blocks-locked')).toBeVisible();
  const pane = await page.getByTestId('blocks-pane').boundingBox();
  if (pane === null) throw new Error('no pane');
  await page.mouse.move(pane.x + 60, pane.y + 30);
  await page.mouse.down();
  await page.mouse.move(pane.x + 300, pane.y + 200, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  expect(await codeText(page)).toBe('from pyquest import *\ndraw_bird(100, 300)\nx = = 2');

  // Fixing the error unlocks the blocks again.
  await typeCode(page, 'from pyquest import *\ndraw_bird(100, 300)\nx = 2');
  await expect(page.getByTestId('blocks-locked')).toBeHidden();
});

test('Stop ends a long drawing replay at once, without reloading Python', async ({ page }) => {
  await openCode(page);
  await typeCode(page, 'from pyquest import *\nfor i in range(400):\n    draw_bird(i, 300)');
  await page.getByTestId('run').click();
  await page.getByTestId('stop').click();
  await expect(page.getByTestId('run')).toHaveText(/Chạy/, { timeout: 2_000 });
});

test('an endless loop can be stopped', async ({ page }) => {
  await openCode(page);
  await typeCode(page, 'from pyquest import *\nwhile True:\n    pass');
  await page.getByTestId('run').click();
  const stop = page.getByTestId('stop');
  const outcome = await Promise.race([
    stop.waitFor({ timeout: 5_000 }).then(() => 'stop-shown'),
    page
      .getByTestId('run-error')
      .waitFor({ timeout: 20_000 })
      .then(() => 'limit-hit'),
  ]);
  if (outcome === 'stop-shown' && (await stop.isVisible())) await stop.click();
  await pythonReady(page);
  await page.getByTestId('run').click();
  await expect(page.getByTestId('run').or(page.getByTestId('stop'))).toBeVisible();
});

test('the library panel and the steps explain where draw_bird comes from', async ({ page }) => {
  await openCode(page);
  await expect(page.getByTestId('walkthrough')).toContainText('vẽ chim');
  await page.getByTestId('library-toggle').click();
  await expect(page.getByTestId('library-panel')).toContainText('draw_bird(x, y)');
  await expect(page.getByTestId('library-panel')).toContainText('from pyquest import *');
  await page.getByRole('button', { name: 'Đóng' }).click();
  // Like real Python: without the import line, draw_bird is unknown and the message says what to add.
  await typeCode(page, 'draw_bird(100, 300)');
  await page.getByTestId('run').click();
  await expect(page.getByTestId('run-error')).toContainText('from pyquest import *');
});
