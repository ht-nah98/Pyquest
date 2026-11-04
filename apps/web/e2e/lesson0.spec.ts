import { expect, test } from '@playwright/test';
import { asCoach, codeText, framesOf, newStudent, pythonReady, typeCode } from './helpers';

test('a child goes through lesson 0 in self-study mode; draft lessons stay hidden', async ({
  page,
}) => {
  await newStudent(page);
  await page.getByTestId('course-bay-qua-khe').click();
  await expect(page.locator('[data-testid^=lesson-l]')).toHaveCount(20);
  await expect(page.getByTestId('lesson-l00')).toHaveAttribute('data-status', 'open');
  // Bài 1 is a draft again since the smallest-pieces rewrite (spec §7): hidden from children until the
  // coach approves it. When the coach removes its draft flag, this goes back to 'locked'.
  await expect(page.getByTestId('lesson-l01')).toHaveAttribute('data-status', 'hidden');
  await expect(page.getByTestId('lesson-l05')).toHaveAttribute('data-status', 'hidden');

  await page.getByTestId('lesson-l00').click();
  await expect(page.getByTestId('slide-l00-hello')).toBeVisible();

  // The sample game plays.
  await page.getByTestId('sample-play').click();
  await expect.poll(() => framesOf(page, 'sample-stage'), { timeout: 60_000 }).toBeGreaterThan(20);

  await page.getByTestId('slide-next').click();
  await page.getByTestId('slide-next').click();
  await expect(page.getByTestId('slide-l00-quiz-gravity')).toBeVisible();
  await expect(page.getByTestId('slide-next')).toBeDisabled();
  await page.getByRole('button', { name: 'Vì em bấm sai phím' }).click();
  await expect(page.getByTestId('quiz-explain')).toContainText('Chưa đúng');
  await expect(page.getByTestId('slide-next')).toBeDisabled();
  await page.getByRole('button', { name: 'Vì có trọng lực kéo xuống' }).click();
  await page.getByTestId('slide-next').click();
  await page.getByTestId('slide-next').click();
  await page.getByRole('button', { name: 'Hiểu chim bay thế nào và thiết kế cách bay' }).click();
  await page.getByTestId('slide-next').click();

  // Design: the roadmap builder, then its quiz.
  await expect(page.getByTestId('roadmap-builder')).toBeVisible();
  await page.getByTestId('slide-next').click();
  await page.getByRole('button', { name: 'Sân khấu và nhân vật' }).click();
  await page.getByTestId('slide-next').click();
  await page.getByTestId('slide-next').click();

  // Code: gated until the goals pass.
  await expect(page.getByTestId('slide-l00-first-line')).toBeVisible();
  await expect(page.getByTestId('slide-next')).toBeDisabled();
  await page.getByTestId('to-code').click();
  await pythonReady(page);
  expect(await codeText(page)).toContain('print("Xin chào!")');
  await typeCode(page, 'from pyquest import *\nprint("Mình sẽ làm game!")');
  await page.getByTestId('run').click();
  await expect(page.getByTestId('bubble')).toHaveText('Mình sẽ làm game!');
  await expect(page.getByTestId('goal-l00-g-say')).toHaveAttribute('data-ok', 'true');
  await page.getByTestId('code-done').click();

  await expect(page.getByTestId('slide-next')).toBeEnabled();
  await page.getByTestId('slide-next').click();
  await page.getByTestId('slide-next').click();
  await page.getByTestId('slide-finish').click();
  await expect(page.getByTestId('lesson-l00')).toHaveAttribute('data-status', 'done');
  await expect(page.getByTestId('lesson-l01')).toHaveAttribute('data-status', 'hidden');
});

test('the coach presents lesson 0 and the notes window follows the slides', async ({
  page,
  context,
}) => {
  await asCoach(page);
  await page.goto('/l/l00');
  await expect(page.locator('[data-mode=present]')).toBeVisible();
  const notes = await context.newPage();
  await notes.goto('/l/l00/notes');
  await expect(notes.getByTestId('coach-notes-text')).toContainText('Cho cả lớp chơi');
  await page.bringToFront();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('slide-count')).toHaveText('2/11');
  await expect(notes.getByTestId('coach-notes-text')).toContainText('Chỉ vào từng phần');
  // No quiz gate in present mode.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('slide-count')).toHaveText('4/11');
  // The coach can switch to the child's view.
  await page.getByTestId('toggle-mode').click();
  await expect(page.locator('[data-mode=self]')).toBeVisible();
});
