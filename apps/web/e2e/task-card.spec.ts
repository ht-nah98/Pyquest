import { expect, test } from '@playwright/test';
import { asCoach, expectNoPageScroll, pythonReady } from './helpers';

const SHOTS = process.env['PQ_SHOTS'] ?? 'test-results/shots';

/** After a run with many variables, task, ▶ and picture must still be readable together (AGENTS.md §9.10). */
test('a run with many variables does not squeeze the task card or the stage', async ({ page }) => {
  await asCoach(page);
  for (const [w, h] of [
    [1280, 720],
    [1866, 966],
    [1080, 730],
  ] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/l/h14/code?ex=h14-e3');
    await pythonReady(page);
    await page.getByTestId('run').click();
    await expect(page.getByTestId('var-watch')).toBeVisible();
    const box = async (id: string) =>
      (await page.getByTestId(id).boundingBox()) ?? { height: 0, y: 0 };
    expect((await box('task-card')).height).toBeGreaterThanOrEqual(90);
    expect((await box('stage')).height).toBeGreaterThanOrEqual(280);
    const watch = await box('var-watch');
    expect(watch.y + watch.height).toBeLessThanOrEqual(h);
    await expectNoPageScroll(page);
    await page.screenshot({ path: `${SHOTS}/task-card-${String(w)}.png` });
  }
});
