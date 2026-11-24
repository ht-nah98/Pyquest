import { expect, test, type Page } from '@playwright/test';
import {
  asCoach,
  codeText,
  expectNoPageScroll,
  framesOf,
  newStudent,
  pythonReady,
  typeCode,
} from './helpers';

const SHOTS = process.env['PQ_SHOTS'] ?? 'test-results/shots';

const DICTS = `from pyquest import *

hero = {"x": 300, "hp": 5}
mobs = [{"x": 1, "hp": 2}, {"x": 500, "hp": 3}]
for mob in mobs:
    mob["hp"] -= 1
    if abs(mob["x"] - hero["x"]) > 250:
        hero["x"] = mob["x"]
mobs.remove(mob)
draw_image("images/hero-knight.png", hero["x"], 300, scale=4)
print(len(mobs), hero["x"], mob["hp"])`;

test('a child neither sees the draft course nor opens any of its pages by address', async ({
  page,
}) => {
  await newStudent(page);
  await expect(page.getByTestId('course-bay-qua-khe')).toBeVisible();
  await expect(page.getByTestId('course-ham-ngoc')).toHaveCount(0);
  for (const path of [
    '/c/ham-ngoc',
    '/l/h00',
    '/l/h00?mode=present',
    '/l/h00/code',
    '/l/h00/code?ex=h00-e1',
    '/l/h00/play',
    '/l/h00/play?ex=h00-e1',
    '/l/h00/notes',
  ]) {
    await page.goto(path);
    await page.waitForURL((u) => u.pathname === '/courses');
    await expect(page.getByTestId('course-bay-qua-khe')).toBeVisible();
    await expect(page.getByText('Hầm Ngọc')).toHaveCount(0);
  }
  // Bay Qua Khe opens as before.
  await page.goto('/l/l00');
  await expect(page.getByTestId('slide-l00-hello')).toBeVisible();
  // Its 📘 Thư viện still lists only what Bài 0 taught.
  await page.goto('/l/l00/code');
  await pythonReady(page);
  await page.getByTestId('library-toggle').click();
  await expect(page.getByTestId('library-why')).toHaveCount(2);
});

test('the coach opens Bài 0 of Hầm Ngọc: plays the sample game, walks the slides, does the exercise', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await asCoach(page);
  // Below Bay Qua Khe, marked as a draft.
  await expect
    .poll(() =>
      page
        .locator('[data-testid^=course-]')
        .evaluateAll((els) => els.map((e) => e.getAttribute('data-testid'))),
    )
    .toEqual(['course-bay-qua-khe', 'course-ham-ngoc']);
  await expect(page.getByTestId('course-ham-ngoc')).toContainText('Bản nháp');
  await expect(page.getByTestId('course-bay-qua-khe')).not.toContainText('Bản nháp');
  await page.screenshot({ path: `${SHOTS}/ham-ngoc-courses.png` });
  await page.getByTestId('course-ham-ngoc').click();
  await expect(page.getByTestId('lesson-h00')).toHaveAttribute('data-status', 'open');
  await expect(page.getByTestId('lesson-h00')).toContainText('Bản nháp');
  await page.screenshot({ path: `${SHOTS}/ham-ngoc-map.png` });

  await page.getByTestId('lesson-h00').click();
  await expect(page.getByTestId('slide-h00-hello')).toBeVisible();
  await expect(page.getByTestId('sample-stage')).toHaveAttribute('data-stage', '960x540');
  await expect(page.getByTestId('sample-game')).toContainText('mũi tên');
  await expect.poll(() => framesOf(page, 'sample-stage'), { timeout: 60_000 }).toBeGreaterThan(20);
  // Once clicked, the arrows and Space play the game instead of turning the slide.
  await page.getByTestId('sample-stage').click();
  for (const key of ['ArrowRight', 'ArrowRight', ' ', 'ArrowLeft']) await page.keyboard.press(key);
  await expect(page.getByTestId('slide-count')).toHaveText(/^1\//);
  const frames = await framesOf(page, 'sample-stage');
  await expect.poll(() => framesOf(page, 'sample-stage')).toBeGreaterThan(frames + 10);
  await page.screenshot({ path: `${SHOTS}/ham-ngoc-sample.png` });
  // The slide buttons still turn the slides, and then so do the arrows.
  await page.getByTestId('slide-next').click();
  await expect(page.getByTestId('slide-count')).toHaveText(/^2\//);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('slide-count')).toHaveText(/^3\//);

  // The roadmap of 12 parts stays inside its box.
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
  const builder = page.getByTestId('roadmap-builder');
  await expect(builder).toBeVisible();
  await expect(builder.locator('li')).toHaveCount(12);
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/ham-ngoc-roadmap.png` });
  const last = builder.locator('li').last();
  const inBox = async () => {
    const row = await last.boundingBox();
    const footer = await page.locator('footer').boundingBox();
    if (row === null || footer === null) throw new Error('no boxes');
    expect(row.y + row.height).toBeLessThanOrEqual(footer.y);
  };
  await inBox();
  // The iPad's size, then the coach's screen.
  for (const [width, height] of [
    [1080, 730],
    [1866, 966],
  ] as const) {
    await page.setViewportSize({ width, height });
    await inBox();
    await page.screenshot({ path: `${SHOTS}/ham-ngoc-roadmap-${String(width)}.png` });
  }
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto('/l/h00/code');
  await pythonReady(page);
  const stage = page.locator('[data-testid="code-screen"] [data-testid="stage"]');
  await expect(stage).toHaveAttribute('data-stage', '600x600');
  await typeCode(page, 'from pyquest import *\n\nprint("Mình sẽ vượt ải!")');
  await page.getByTestId('run').click();
  await expect(page.getByTestId('bubble')).toHaveText('Mình sẽ vượt ải!');
  await expect(page.getByTestId('goal-h00-g-say')).toHaveAttribute('data-ok', 'true');
  await expect(page.getByTestId('code-done')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/ham-ngoc-code.png` });
  await page.getByTestId('fullscreen').click();
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-stage', '600x600');
  expect(errors).toEqual([]);
});

test('the sample game is wide, big on the slide, and takes the whole screen in fullscreen', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await asCoach(page);
  await page.goto('/l/h00?mode=present');
  const stage = page.getByTestId('sample-stage');
  await expect.poll(() => framesOf(page, 'sample-stage'), { timeout: 60_000 }).toBeGreaterThan(40);
  const width = async () => (await stage.boundingBox())?.width ?? 0;
  for (const [w, h] of [
    [1080, 730],
    [1866, 966],
    [1280, 720],
  ] as const) {
    await page.setViewportSize({ width: w, height: h });
    await expect.poll(width).toBeGreaterThan(Math.min(w * 0.6, 1000));
    await expectNoPageScroll(page);
    // The buttons under the game stay inside the slide.
    const button = await page.getByTestId('sample-fullscreen').boundingBox();
    const footer = await page.locator('footer').boundingBox();
    expect((button?.y ?? 9999) + (button?.height ?? 0)).toBeLessThanOrEqual(footer?.y ?? 0);
    await page.screenshot({ path: `${SHOTS}/ham-ngoc-sample-${String(w)}.png` });
  }
  await stage.click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('2');
  await page.getByTestId('sample-fullscreen').click();
  await expect(page.getByTestId('sample-full-exit')).toBeVisible();
  await expect(page.getByTestId('sample-play')).toBeHidden();
  await expect.poll(width).toBeGreaterThanOrEqual(1279);
  // 60 steps a second, however fast the screen is.
  const before = await framesOf(page, 'sample-stage');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(3000);
  await page.keyboard.up('ArrowRight');
  expect((await framesOf(page, 'sample-stage')) - before).toBeLessThanOrEqual(200);
  await page.screenshot({ path: `${SHOTS}/ham-ngoc-sample-full.png` });
  await expect(page.getByTestId('slide-count')).toHaveText(/^1\//);
  await page.getByTestId('sample-full-again').click();
  await page.keyboard.press('ArrowRight');
  await page.getByTestId('sample-full-exit').click();
  await expect(page.getByTestId('sample-play')).toBeVisible();
  expect(errors).toEqual([]);
});

/** Drags the first toolbox block with this label from a category onto free space. */
async function dragFromToolbox(page: Page, category: string, label: string): Promise<void> {
  await page.locator('.blocklyToolboxCategory', { hasText: category }).first().click();
  const source = page.locator('.blocklyFlyout .blocklyDraggable', { hasText: label }).first();
  const box = await source.boundingBox();
  const target = await page.getByTestId('blocks-pane').boundingBox();
  if (box === null || target === null) throw new Error('no boxes');
  await page.mouse.move(box.x + 15, box.y + 12);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width * 0.6, target.y + target.height * 0.9, {
    steps: 15,
  });
  await page.mouse.up();
}

test('dict code becomes blocks with Vietnamese words, and editing blocks gives the code back', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await asCoach(page);
  await page.goto('/l/h00/code');
  await pythonReady(page);
  await typeCode(page, DICTS);
  for (const label of ['hộp có tên {', 'ngăn "', 'đổi', 'giá trị tuyệt đối', 'bỏ', 'phóng to'])
    await expect(
      page
        .locator('.blocklyWorkspace > .blocklyBlockCanvas .blocklyText', { hasText: label })
        .first(),
    ).toBeAttached();
  await page.getByTestId('run').click();
  await expect(page.getByTestId('bubble').last()).toHaveText('1 500 2');
  await page.screenshot({ path: `${SHOTS}/ham-ngoc-dict-blocks.png` });

  await dragFromToolbox(page, 'Vẽ', 'nói');
  await expect.poll(() => codeText(page)).toContain('print("Xin chào!")');
  expect((await codeText(page)).replace(/\n*print\("Xin chào!"\)\n*/, '\n').trim()).toBe(DICTS);
  expect(errors).toEqual([]);
});
