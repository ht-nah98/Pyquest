import { expect, test } from '@playwright/test';
import { asCoach, pythonReady, typeCode } from './helpers';

test('the stage is big enough to see the picked character after a run', async ({ page }) => {
  await asCoach(page);
  await page.goto('/l/l13/code');
  await pythonReady(page);
  await typeCode(
    page,
    'from pyquest import *\n\n\ndef draw_bird(x, y):\n    draw_image("images/bird-rong.png", x, y)\n\n\ndraw_bird(100, 300)\ndraw_bird(250, 150)\n',
  );
  await page.getByTestId('run').click();
  await expect(page.getByTestId('goal-l13-g-image')).toHaveAttribute('data-ok', 'true');
  await expect(page.getByTestId('walkthrough')).not.toHaveAttribute('open', '');
  const stage = await page.locator('[data-testid="code-screen"] canvas').first().boundingBox();
  expect(stage?.height ?? 0).toBeGreaterThanOrEqual(280);
  await page.screenshot({
    path: '/tmp/claude-1000/-home-user-Desktop-CodeQuest/e375c142-0da2-4bf3-b4a0-8aec7ea13f58/scratchpad/stage-after.png',
  });
});

test('a mistyped picture path suggests the real file', async ({ page }) => {
  await asCoach(page);
  await page.goto('/l/l13/code');
  await pythonReady(page);
  await typeCode(page, 'from pyquest import *\n\ndraw_image("images/rong.png", 100, 300)\n');
  await page.getByTestId('run').click();
  await expect(page.getByText('images/bird-rong.png?')).toBeVisible();
});
