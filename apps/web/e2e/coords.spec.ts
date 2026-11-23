import { expect, test } from '@playwright/test';
import { asCoach, expectNoPageScroll, pagePoint, pythonReady, readout, typeCode } from './helpers';

const SHOTS = process.env['PQ_SHOTS'] ?? 'test-results/shots';

test('the code screen always shows the stage size and the x, y under the mouse', async ({
  page,
}) => {
  await asCoach(page);
  await page.goto('/l/l01/code');
  await pythonReady(page);
  await expect(page.getByTestId('stage')).toHaveAttribute('data-stage', '400x600');
  await expect(page.getByTestId('stage-origin')).toHaveText('(0, 0)');
  await expect(page.getByTestId('stage-size-x')).toHaveText('x → 400');
  await expect(page.getByTestId('stage-size-y')).toHaveText('y ↓ 600');
  await expect(page.getByTestId('stage-pointer')).toHaveCount(0);

  await typeCode(page, 'from pyquest import *\ndraw_rect(100, 300, 40, 40, "gold")');
  await page.getByTestId('run').click();
  await expect(page.getByTestId('goal-l01-g-box')).toHaveAttribute('data-ok', 'true');

  // The corner of the gold box reads (100, 300).
  const p = await pagePoint(page, 100, 300);
  await page.mouse.move(p.x, p.y);
  const r = await readout(page);
  expect(Math.abs(r.x - 100)).toBeLessThanOrEqual(1);
  expect(Math.abs(r.y - 300)).toBeLessThanOrEqual(1);
  await expect(page.getByTestId('stage-pointer')).toHaveText(`x ${String(r.x)} · y ${String(r.y)}`);
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/coords-1280.png` });

  // The far corner reads the stage size.
  const end = await pagePoint(page, 399.5, 599.5);
  await page.mouse.move(end.x, end.y);
  // One screen pixel is about two stage units here, so the last pixel reads 398–400.
  await expect.poll(async () => (await readout(page)).x).toBeGreaterThanOrEqual(398);
  await expect.poll(async () => (await readout(page)).y).toBeGreaterThanOrEqual(598);

  // Leaving the stage hides the readout.
  await page.mouse.move(5, 5);
  await expect(page.getByTestId('stage-pointer')).toHaveCount(0);

  // The coach's screen: labels and readout follow the bigger stage.
  await page.setViewportSize({ width: 1866, height: 966 });
  const q = await pagePoint(page, 200, 450);
  await page.mouse.move(q.x, q.y);
  const big = await readout(page);
  expect(Math.abs(big.x - 200)).toBeLessThanOrEqual(1);
  expect(Math.abs(big.y - 450)).toBeLessThanOrEqual(1);
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/coords-1866.png` });
});

test('the fullscreen game shows no coordinates help', async ({ page }) => {
  await asCoach(page);
  await page.goto('/l/l01/play');
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-stage', '400x600');
  await expect(page.getByTestId('stage-size-x')).toHaveCount(0);
});
