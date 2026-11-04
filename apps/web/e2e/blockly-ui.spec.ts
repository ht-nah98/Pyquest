import { expect, test } from '@playwright/test';
import { asCoach, pythonReady } from './helpers';

test('a closed toolbox flyout leaves no scrollbar across the workspace', async ({ page }) => {
  await asCoach(page);
  await page.goto('/l/l02/code');
  await pythonReady(page);
  await page.locator('.blocklyToolboxCategory', { hasText: 'Vẽ' }).click();
  await expect(page.locator('.blocklyToolboxFlyout')).toBeVisible();
  await page.mouse.click(500, 700);
  await expect(page.locator('.blocklyToolboxFlyout')).toBeHidden();
  // Every flyout scrollbar Blockly hid with display="none" must really be hidden.
  const shown = await page
    .locator('.blocklyFlyoutScrollbar')
    .evaluateAll(
      (els) =>
        els.filter(
          (e) => e.getAttribute('display') === 'none' && getComputedStyle(e).display !== 'none',
        ).length,
    );
  expect(shown).toBe(0);
});
