import { expect, test } from '@playwright/test';
import { asCoach, pythonReady, typeCode } from './helpers';

test('the stage is big enough to see the picked character after a run', async ({ page }) => {
  await asCoach(page);
  await page.goto('/l/l03/code');
  await pythonReady(page);
  await typeCode(
    page,
    'from pyquest import *\n\nuse_sprite("bird", "images/bird-rong.png")\ndraw_bird(100, 300)\n',
  );
  await page.getByTestId('run').click();
  await expect(page.getByTestId('goal-l03-g-bird')).toHaveAttribute('data-ok', 'true');
  await expect(page.getByTestId('walkthrough')).not.toHaveAttribute('open', '');
  const stage = await page.locator('[data-testid="code-screen"] canvas').first().boundingBox();
  expect(stage?.height ?? 0).toBeGreaterThanOrEqual(280);
  await page.screenshot({
    path: '/tmp/claude-1000/-home-user-Desktop-CodeQuest/e375c142-0da2-4bf3-b4a0-8aec7ea13f58/scratchpad/stage-after.png',
  });
});

test('a mistyped picture path suggests the real file', async ({ page }) => {
  await asCoach(page);
  await page.goto('/l/l03/code');
  await pythonReady(page);
  await typeCode(
    page,
    'from pyquest import *\n\nuse_sprite("bird", "images/rong.png")\ndraw_bird(100, 300)\n',
  );
  await page.getByTestId('run').click();
  await expect(page.getByText('images/bird-rong.png?')).toBeVisible();
});
