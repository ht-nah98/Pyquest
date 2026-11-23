import { expect, test } from '@playwright/test';
import { asCoach, expectNoPageScroll, pagePoint, pythonReady, readout, typeCode } from './helpers';

const SHOTS = process.env['PQ_SHOTS'] ?? 'test-results/shots';

test('iPad: a finger on the stage shows its x, y; lifting it hides the readout', async ({
  page,
}) => {
  await asCoach(page);
  await page.goto('/l/l01/code');
  await pythonReady(page);
  await expect(page.getByTestId('stage-size-x')).toHaveText('x → 400');
  await expect(page.getByTestId('stage-size-y')).toHaveText('y ↓ 600');
  await typeCode(page, 'from pyquest import *\ndraw_rect(100, 300, 40, 40, "gold")');
  await page.getByTestId('run').tap();
  await expect(page.getByTestId('goal-l01-g-box')).toHaveAttribute('data-ok', 'true');

  // Touch down and drag without lifting (Playwright only taps, so speak to Chrome directly).
  const cdp = await page.context().newCDPSession(page);
  const a = await pagePoint(page, 100, 300);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [a] });
  const first = await readout(page);
  expect(Math.abs(first.x - 100)).toBeLessThanOrEqual(1);
  expect(Math.abs(first.y - 300)).toBeLessThanOrEqual(1);
  const b = await pagePoint(page, 250, 120);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [b] });
  await expect
    .poll(async () => {
      const r = await readout(page);
      return Math.abs(r.x - 250) <= 1 && Math.abs(r.y - 120) <= 1;
    })
    .toBe(true);
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/coords-ipad.png` });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.getByTestId('stage-pointer')).toHaveCount(0);
});
