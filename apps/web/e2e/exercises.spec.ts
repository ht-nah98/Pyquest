import { expect, test } from '@playwright/test';
import { codeText, expectNoPageScroll, newStudent, pythonReady, typeCode } from './helpers';

const SHOTS =
  '/tmp/claude-1000/-home-user-Desktop-CodeQuest/e375c142-0da2-4bf3-b4a0-8aec7ea13f58/scratchpad';

const HALF = `from pyquest import *

for i in range(8):
    if i < 4:
        draw_rect(i * 50, 300, 40, 40, "red")
    else:
        draw_rect(i * 50, 300, 40, 40, "blue")
`;

test('a lesson has several exercises: the next opens when one is done; typing ones lock the blocks', async ({
  page,
}) => {
  await newStudent(page);
  await page.goto('/l/l07/code');
  await pythonReady(page);
  const bar = page.getByTestId('exercise-bar');
  await expect(bar).toBeVisible();
  await expect(page.getByTestId('exercise-l07-e2')).not.toHaveAttribute('href');

  // 👀 shows the picture to draw over the stage.
  const canvas = page.locator('[data-testid="code-screen"] canvas').first();
  await page.getByTestId('ghost-toggle').click();
  await expect(canvas).toHaveAttribute('data-ghost', 'on');

  await typeCode(page, HALF);
  await page.getByTestId('run').click();
  await expect(page.getByTestId('goal-l07-e1-same')).toHaveAttribute('data-ok', 'true');
  await expect(page.getByTestId('exercise-l07-e1')).toHaveAttribute('data-done', 'true');
  await page.screenshot({ path: `${SHOTS}/exercise-l07-e1.png` });
  await page.getByTestId('next-exercise').click();
  await expect(page).toHaveURL(/ex=l07-e2/);
  await pythonReady(page);
  // Exercise 2 starts from its own starter, not from exercise 1's code.
  await expect.poll(() => codeText(page)).toContain('"gold"');

  // The coach-free child cannot skip to 3 yet; finish 2 first.
  await typeCode(
    page,
    'from pyquest import *\n\nfor i in range(8):\n    if i % 2 == 0:\n        draw_rect(i * 50, 300, 40, 40, "gold")\n    else:\n        draw_rect(i * 50, 300, 40, 40, "black")\n',
  );
  await page.getByTestId('run').click();
  await page.getByTestId('next-exercise').click();
  await expect(page).toHaveURL(/ex=l07-e3/);
  await pythonReady(page);

  // Typing exercise: a note, no toolbox, blocks still mirror the code.
  await expect(page.getByTestId('typing-note')).toBeVisible();
  await expect(page.locator('.blocklyToolboxCategory')).toHaveCount(0);
  await expect(
    page
      .locator('.blocklyWorkspace > .blocklyBlockCanvas .blocklyText', { hasText: 'lặp' })
      .first(),
  ).toBeVisible();
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/exercise-l07-e3.png` });

  // Coming back without ?ex= opens the exercise the child was on, with its code.
  await typeCode(page, 'from pyquest import *\n# đang làm bài 3\n');
  await page.waitForTimeout(800);
  await page.goto('/l/l07/code');
  await pythonReady(page);
  await expect(page.getByTestId('exercise-l07-e3')).toHaveAttribute('aria-current', 'step');
  await expect.poll(() => codeText(page)).toContain('# đang làm bài 3');
});

test('Bài 11: lists are real blocks (danh sách [ ], với mỗi x trong)', async ({ page }) => {
  await newStudent(page);
  await page.goto('/l/l11/code');
  await pythonReady(page);
  await typeCode(
    page,
    'from pyquest import *\n\nxs = [40, 160, 280]\nfor x in xs:\n    draw_rect(x, 300, 60, 60, "green")\n',
  );
  const canvasText = (t: string) =>
    page.locator('.blocklyWorkspace > .blocklyBlockCanvas .blocklyText', { hasText: t }).first();
  await expect(canvasText('với mỗi')).toBeVisible();
  await expect(canvasText('danh sách [')).toBeVisible();
  await page.getByTestId('run').click();
  await expect(page.getByTestId('goal-l11-e1-same')).toHaveAttribute('data-ok', 'true');
  await page.locator('.blocklyToolboxCategory', { hasText: 'Danh sách' }).first().click();
  await expect(
    page.locator('.blocklyFlyout .blocklyText', { hasText: 'danh sách [' }).first(),
  ).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/lists-l11.png` });
});
