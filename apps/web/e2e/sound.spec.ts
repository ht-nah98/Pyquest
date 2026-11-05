import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { asCoach, newStudent, pythonReady, typeCode } from './helpers';

const L22 = JSON.parse(
  readFileSync(
    new URL('../../../content/courses/bay-qua-khe/lessons/l22.json', import.meta.url),
    'utf8',
  ),
) as { exercises: { id: string; solution: Record<string, string> }[] };
const SOLUTION = L22.exercises.find((e) => e.id === 'l22-e2')?.solution['main.py'] ?? '';

const SHOTS =
  '/tmp/claude-1000/-home-user-Desktop-CodeQuest/e375c142-0da2-4bf3-b4a0-8aec7ea13f58/scratchpad';

test('sound: the child’s play_music / play_sound are heard, ■ Dừng ends the tune, 🔇 silences and is remembered', async ({
  page,
}) => {
  await asCoach(page);
  await page.goto('/l/l22/code?ex=l22-e2');
  await pythonReady(page);
  await typeCode(page, SOLUTION);
  // The blocks show the sound blocks, not raw code.
  await expect(
    page.locator('.blocklyBlockCanvas .blocklyText', { hasText: 'bật nhạc' }).first(),
  ).toBeVisible();
  await page.getByTestId('run').click();
  for (const g of ['l22-e2-music', 'l22-e2-flap', 'l22-e2-point'])
    await expect(page.getByTestId(`goal-${g}`)).toHaveAttribute('data-ok', 'true');
  const stage = page.locator('[data-testid="code-screen"] canvas').first();
  await expect(stage).toHaveAttribute('data-music', 'happy');
  // ✅ every goal: the app's own sound played.
  expect(Number(await stage.getAttribute('data-sounds'))).toBeGreaterThan(0);
  await page.screenshot({ path: `${SHOTS}/sound-l22-e2.png` });

  await page.getByTestId('stop').click();
  await expect(stage).toHaveAttribute('data-music', '');

  await page.getByTestId('mute').click();
  await expect(page.getByTestId('mute')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByTestId('mute')).toHaveAttribute('aria-pressed', 'true');
});

test('a draft exercise is only for the coach: a child does not see "Thêm tiếng cho game" yet', async ({
  page,
}) => {
  await newStudent(page);
  await page.goto('/l/l22/code');
  await pythonReady(page);
  await expect(page.getByTestId('exercise-l22-e2')).toHaveCount(0);
});
