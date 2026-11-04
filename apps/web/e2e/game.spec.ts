import { expect, test } from '@playwright/test';
import { asCoach, pythonReady, typeCode } from './helpers';

const FLAP = `from pyquest import *


def draw_bird(x, y):
    draw_image("images/bird.png", x, y)


y = 100
speed = 0


def update():
    global y, speed
    if key_pressed():
        speed = -8
    speed = speed + 0.5
    y = y + speed
    if y > 480:
        y = 480
        speed = 0


def draw():
    clear("skyblue")
    draw_rect(0, 520, 400, 80, "green")
    draw_bird(100, y)
`;

test('a game-mode lesson is graded by its scripted test run, then plays', async ({ page }) => {
  await asCoach(page);
  await page.goto('/l/l17/code');
  await pythonReady(page);
  await expect(page.getByTestId('task-card')).toContainText('Thêm nút bay');
  await page.getByTestId('hint-more').click();
  await expect(page.getByTestId('hint')).toHaveCount(1);
  await typeCode(page, FLAP);
  // Blocks follow, including the nested if inside def (no raw-code block for it).
  await expect(
    page
      .locator('.blocklyWorkspace > .blocklyBlockCanvas .blocklyText', { hasText: 'tự đặt lệnh' })
      .first(),
  ).toBeVisible();
  await page.getByTestId('run').click();
  await expect(page.getByTestId('goal-l17-g-flap')).toHaveAttribute('data-ok', 'true', {
    timeout: 30_000,
  });
  await expect(page.getByTestId('goal-l17-g-ground')).toHaveAttribute('data-ok', 'true');
  await expect(page.getByTestId('code-done')).toBeVisible();
  await page.getByTestId('fullscreen').click();
  await expect(page.getByTestId('play-screen')).toBeVisible();
});

test('the coach sees draft lessons; a child does not', async ({ page, browser, baseURL }) => {
  await asCoach(page);
  await page.goto('/c/bay-qua-khe');
  await expect(page.getByTestId('lesson-l17')).toHaveAttribute('data-status', 'open');
  await expect(page.getByTestId('lesson-l17')).toContainText('Bản nháp');
  const kidContext = await browser.newContext(baseURL === undefined ? {} : { baseURL });
  const kid = await kidContext.newPage();
  await kid.goto('/');
  await kid.getByTestId('nickname').fill('Lan');
  await kid.getByTestId('create').click();
  await kid.waitForURL('**/courses');
  await kid.goto('/c/bay-qua-khe');
  await expect(kid.getByTestId('lesson-l17')).toHaveAttribute('data-status', 'hidden');
  await kidContext.close();
});
