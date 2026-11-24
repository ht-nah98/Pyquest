import { expect, test } from '@playwright/test';
import {
  asCoach,
  framesOf,
  INPUT_GAME,
  inputSeen,
  near,
  newStudent,
  pagePoint,
  pythonReady,
  typeCode,
} from './helpers';

const SHOTS = process.env['PQ_SHOTS'] ?? 'test-results/shots';
const PLAY_STAGE = '[data-testid="play-stage"]';

test('keys and mouse reach Python: arrows are not Space, a click is one frame at the right place', async ({
  page,
}) => {
  await asCoach(page);
  await page.goto('/l/l17/code');
  await pythonReady(page);
  await typeCode(page, INPUT_GAME);
  // clicked() and key_pressed("right") are blocks, not code text.
  for (const label of ['vừa bấm chuột', 'đang bấm phím'])
    await expect(
      page.locator('.blocklyBlockCanvas .blocklyText', { hasText: label }).first(),
    ).toBeAttached();
  await page.getByTestId('run').click();

  // The scripted test taps too; the live game after it starts from 0, and so does the fullscreen one.
  await expect(page.getByTestId('bubble').last()).toHaveText(/^0 0 0 0 - /, { timeout: 60_000 });
  await page.getByTestId('fullscreen').click();
  await expect(page.getByTestId('play-screen')).toBeVisible();
  await expect(page.getByTestId('bubble').last()).toHaveText(/^0 0 0 0 - /, { timeout: 60_000 });

  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await inputSeen(page)).rights).toBeGreaterThan(3);
  await page.keyboard.up('ArrowRight');
  const arrows = (await inputSeen(page)).rights;
  await page.keyboard.down('d');
  await expect.poll(async () => (await inputSeen(page)).rights).toBeGreaterThan(arrows + 3);
  // The window loses focus while D is held: it is let go.
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect
    .poll(async () => {
      const before = (await inputSeen(page)).rights;
      const frames = await framesOf(page, 'play-stage');
      await expect.poll(() => framesOf(page, 'play-stage')).toBeGreaterThan(frames + 5);
      return (await inputSeen(page)).rights - before;
    })
    .toBe(0);
  await page.keyboard.up('d');
  // As short as a press gets: still seen for one frame.
  await page.keyboard.press('2');
  await expect.poll(async () => (await inputSeen(page)).twos).toBeGreaterThanOrEqual(1);
  expect((await inputSeen(page)).spaces).toBe(0);
  expect((await inputSeen(page)).clicks).toBe(0);

  const over = await pagePoint(page, 120, 450, 400, 600, PLAY_STAGE);
  await page.mouse.move(over.x, over.y);
  await expect.poll(async () => near((await inputSeen(page)).mouse, 120, 450)).toBe(true);
  await page.mouse.down();
  await expect.poll(async () => (await inputSeen(page)).spaces).toBeGreaterThan(5);
  const held = await inputSeen(page);
  expect(held.clicks).toBe(1);
  expect(near(held.at, 120, 450)).toBe(true);
  await page.screenshot({ path: `${SHOTS}/game-input-1280.png` });

  // Dragged into the black bar and let go there: Space is not stuck, the pointer stays where it last was.
  const bar = await pagePoint(page, -100, 300, 400, 600, PLAY_STAGE);
  await page.mouse.move(bar.x, bar.y);
  await page.mouse.up();
  const letGo = await framesOf(page, 'play-stage');
  await expect.poll(() => framesOf(page, 'play-stage')).toBeGreaterThan(letGo + 5);
  const spaces = (await inputSeen(page)).spaces;
  await expect.poll(() => framesOf(page, 'play-stage')).toBeGreaterThan(letGo + 15);
  expect((await inputSeen(page)).spaces).toBe(spaces);
  // A press in the bar still flaps, as it always did, but clicks nothing.
  await page.mouse.down();
  await page.mouse.up();
  await expect.poll(async () => (await inputSeen(page)).spaces).toBeGreaterThan(spaces);
  expect((await inputSeen(page)).clicks).toBe(1);

  // ↻ Chơi lại starts from 0 and is not itself a tap on the game.
  await page.getByTestId('play-again').click();
  await expect(page.getByTestId('bubble').last()).toHaveText(/^0 0 0 0 - /);
});

test('the code screen’s own stage gives the same: click, place, Space', async ({ page }) => {
  await asCoach(page);
  await page.goto('/l/l17/code');
  await pythonReady(page);
  await typeCode(page, INPUT_GAME);
  await page.getByTestId('run').click();
  await expect(page.getByTestId('bubble').last()).toHaveText(/^0 0 0 0 - /, { timeout: 60_000 });
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await inputSeen(page)).rights).toBeGreaterThan(3);
  await page.keyboard.up('ArrowRight');
  expect((await inputSeen(page)).spaces).toBe(0);
  const p = await pagePoint(page, 300, 100);
  await page.mouse.click(p.x, p.y);
  await expect.poll(async () => (await inputSeen(page)).clicks).toBe(1);
  // One screen pixel is about two stage units here.
  const seen = await inputSeen(page);
  expect(Math.abs(seen.at.x - 300)).toBeLessThanOrEqual(2);
  expect(Math.abs(seen.at.y - 100)).toBeLessThanOrEqual(2);
  expect(seen.spaces).toBeGreaterThanOrEqual(1);
});

test('the coach plays the game being made on the dev server; a child is sent away', async ({
  page,
}) => {
  await newStudent(page);
  await page.goto('/coach/prototype');
  await page.waitForURL((u) => u.pathname === '/');
  await expect(page.getByTestId('play-screen')).toHaveCount(0);

  await asCoach(page);
  await page.goto('/coach/prototype');
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-stage', '1600x900');
  // With tools/prototypes/ham-ngoc/main.py it plays; without it, it says so.
  await expect
    .poll(
      async () =>
        (await framesOf(page, 'play-stage')) > 20 ||
        (
          await page
            .getByTestId('play-error')
            .textContent({ timeout: 100 })
            .catch(() => '')
        )?.includes('Chưa có game thử') === true,
      { timeout: 60_000 },
    )
    .toBe(true);
  await page.screenshot({ path: `${SHOTS}/prototype-1280.png` });
  await page.getByTestId('back-to-code').click();
  await page.waitForURL('**/courses');
});
