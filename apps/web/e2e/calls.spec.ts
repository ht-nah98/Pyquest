import { expect, test } from '@playwright/test';
import { asCoach, expectNoPageScroll, pythonReady, typeCode } from './helpers';

const SHOTS =
  '/tmp/claude-1000/-home-user-Desktop-CodeQuest/e375c142-0da2-4bf3-b4a0-8aec7ea13f58/scratchpad';

const BIRD = `from pyquest import *


def draw_bird(x, y):
    draw_rect(x, y + 10, 30, 20, "red")
    draw_rect(x + 30, y + 14, 8, 8, "orange")
    draw_rect(x + 8, y, 14, 10, "red")
    draw_rect(x + 20, y + 13, 4, 4, "black")


draw_bird(100, 300)
draw_bird(250, 150)
`;

test('Bài 4: the child writes draw_bird; the 📞 panel shows each call and lights up what it drew', async ({
  page,
}) => {
  await asCoach(page);
  await page.goto('/l/l04/code');
  await pythonReady(page);
  await typeCode(page, BIRD);

  await expect(
    page
      .locator('.blocklyWorkspace > .blocklyBlockCanvas .blocklyText', { hasText: '📞 draw_bird' })
      .first(),
  ).toBeVisible();
  // The toolbox offers a call block for the child's own def, like Scratch's My Blocks.
  await page
    .locator('.blocklyTreeRow, .blocklyToolboxCategory', { hasText: 'Lệnh tự đặt' })
    .first()
    .click();
  await expect(
    page.locator('.blocklyFlyout .blocklyText', { hasText: '📞 draw_bird' }).first(),
  ).toBeVisible();
  await page.mouse.click(5, 300);

  await page.getByTestId('run').click();
  await expect(page.getByTestId('goal-l04-g-call')).toHaveAttribute('data-ok', 'true');
  await expect(page.getByTestId('goal-l04-g-same')).toHaveAttribute('data-ok', 'true');

  await page.getByTestId('tab-calls').click();
  const rows = page.getByTestId('call-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1)).toContainText('draw_bird(x=250, y=150)');
  await expect(page.getByTestId('call-panel')).toContainText('draw_rect(280, 164, 8, 8, "orange")');

  const canvas = page.locator('[data-testid="code-screen"] canvas').first();
  await rows.nth(1).click();
  await expect(canvas).toHaveAttribute('data-highlight', '1');
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/calls-l04.png` });
  await rows.nth(1).click();
  await expect(canvas).toHaveAttribute('data-highlight', '');
});

test('Bài 3: a bird typed with a fixed number does not pass "moves with x"', async ({ page }) => {
  await asCoach(page);
  await page.goto('/l/l03/code');
  await pythonReady(page);
  const bird = (beak: string) =>
    `from pyquest import *\n\nx = 100\ny = 300\ndraw_rect(x, y + 10, 30, 20, "red")\ndraw_rect(${beak}, y + 14, 8, 8, "orange")\ndraw_rect(x + 8, y, 14, 10, "red")\n`;
  await typeCode(page, bird('130'));
  await page.getByTestId('run').click();
  await expect(page.getByTestId('goal-l03-g-pieces')).toHaveAttribute('data-ok', 'true');
  await expect(page.getByTestId('goal-l03-g-follow')).toHaveAttribute('data-ok', 'false');
  await typeCode(page, bird('x + 30'));
  await page.getByTestId('run').click();
  await expect(page.getByTestId('goal-l03-g-follow')).toHaveAttribute('data-ok', 'true');
});
