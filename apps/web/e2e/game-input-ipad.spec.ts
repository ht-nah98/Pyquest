import { expect, test } from '@playwright/test';
import {
  asCoach,
  expectNoPageScroll,
  INPUT_GAME,
  inputSeen,
  near,
  pagePoint,
  pythonReady,
  typeCode,
} from './helpers';

const SHOTS = process.env['PQ_SHOTS'] ?? 'test-results/shots';
const PLAY_STAGE = '[data-testid="play-stage"]';

test('iPad: a tap is a flap and a click at the finger; a finger held is Space held, then let go', async ({
  page,
}) => {
  await asCoach(page);
  await page.goto('/l/l17/code');
  await pythonReady(page);
  await typeCode(page, INPUT_GAME);
  await page.getByTestId('run').tap();
  await expect(page.getByTestId('bubble').last()).toHaveText(/^0 0 0 0 - /, { timeout: 60_000 });
  await page.getByTestId('fullscreen').tap();
  await expect(page.getByTestId('play-screen')).toBeVisible();
  await expect(page.getByTestId('bubble').last()).toHaveText(/^0 0 0 0 - /, { timeout: 60_000 });

  const p = await pagePoint(page, 320, 480, 400, 600, PLAY_STAGE);
  await page.touchscreen.tap(p.x, p.y);
  await expect.poll(async () => (await inputSeen(page)).clicks).toBe(1);
  const tap = await inputSeen(page);
  expect(near(tap.at, 320, 480)).toBe(true);
  expect(tap.spaces).toBeGreaterThanOrEqual(1);
  expect(tap.rights).toBe(0);

  // Hold and drag (Playwright only taps, so speak to Chrome directly).
  const cdp = await page.context().newCDPSession(page);
  const a = await pagePoint(page, 100, 100, 400, 600, PLAY_STAGE);
  const b = await pagePoint(page, 200, 400, 400, 600, PLAY_STAGE);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [a] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [b] });
  await expect.poll(async () => near((await inputSeen(page)).mouse, 200, 400)).toBe(true);
  await expect.poll(async () => (await inputSeen(page)).spaces).toBeGreaterThan(tap.spaces + 5);
  expect((await inputSeen(page)).clicks).toBe(2);
  expect(near((await inputSeen(page)).at, 100, 100)).toBe(true);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect
    .poll(async () => {
      const before = (await inputSeen(page)).spaces;
      await page.waitForTimeout(300);
      return (await inputSeen(page)).spaces - before;
    })
    .toBe(0);
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/game-input-ipad.png` });
});

test('iPad: tapping the stage of the code screen flaps: key_pressed() as Bay Qua Khe uses it', async ({
  page,
}) => {
  await asCoach(page);
  await page.goto('/l/l17/code');
  await pythonReady(page);
  // The smallest flap game: counts how often the bird went up.
  await typeCode(
    page,
    'from pyquest import *\nflaps = 0\n\n\ndef update():\n    global flaps\n    if key_pressed():\n        flaps += 1\n\n\ndef draw():\n    clear("skyblue")\n    print(flaps)\n',
  );
  await page.getByTestId('run').tap();
  await expect(page.getByTestId('bubble').last()).toHaveText('0', { timeout: 60_000 });
  await page.locator('[data-testid="code-screen"] [data-testid="stage"]').tap();
  await expect
    .poll(async () => Number(await page.getByTestId('bubble').last().textContent()))
    .toBeGreaterThanOrEqual(1);
});
