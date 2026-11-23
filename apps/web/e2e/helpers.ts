import { expect, type Page } from '@playwright/test';

export const COACH_PIN = '2468';

export async function newStudent(page: Page, name = 'Minh'): Promise<void> {
  await page.goto('/');
  await page.getByTestId('nickname').fill(name);
  await page.getByTestId('create').click();
  await page.waitForURL('**/courses');
}

export async function asCoach(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByTestId('coach-pin').fill(COACH_PIN);
  await page.getByTestId('coach-enter').click();
  await page.waitForURL('**/courses');
}

/** Waits until Python is loaded and ▶ Chạy is ready. */
export async function pythonReady(page: Page): Promise<void> {
  await expect(page.getByTestId('run')).toHaveText(/Chạy/, { timeout: 60_000 });
}

/** Replaces the whole Python text the way a child would: select all, type. */
export async function typeCode(page: Page, code: string): Promise<void> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');
  // CodeMirror auto-closes brackets and indents; insertText types the text exactly.
  await page.keyboard.insertText(code);
}

export async function codeText(page: Page): Promise<string> {
  return page
    .locator('.cm-content')
    .evaluate((el) => [...el.querySelectorAll('.cm-line')].map((l) => l.textContent).join('\n'));
}

/** Asserts the page itself never scrolls (AGENTS.md §9.10). */
export async function expectNoPageScroll(page: Page): Promise<void> {
  const [sh, ih, sw, iw] = await page.evaluate(() => {
    const s = document.scrollingElement ?? document.documentElement;
    return [s.scrollHeight, innerHeight, s.scrollWidth, innerWidth];
  });
  expect(sh).toBeLessThanOrEqual(ih);
  expect(sw).toBeLessThanOrEqual(iw);
}

/** A monotonic counter on the canvas: no transient value to miss (AGENTS.md §9.8). */
export async function framesOf(page: Page, testId: string): Promise<number> {
  return Number(await page.getByTestId(testId).getAttribute('data-frames'));
}

/** Where a stage point is on the page: through the canvas scaling and its letterbox bars. */
export async function pagePoint(page: Page, x: number, y: number, w = 400, h = 600) {
  const box = await page.locator('[data-testid="code-screen"] [data-testid="stage"]').boundingBox();
  if (box === null) throw new Error('no stage');
  const k = Math.min(box.width / w, box.height / h);
  return {
    x: box.x + (box.width - w * k) / 2 + x * k,
    y: box.y + (box.height - h * k) / 2 + y * k,
  };
}

/** The pointer readout, read from its attributes once it shows (AGENTS.md §9.8). */
export async function readout(page: Page) {
  const badge = page.getByTestId('stage-pointer');
  await expect(badge).toBeVisible();
  return {
    x: Number(await badge.getAttribute('data-x')),
    y: Number(await badge.getAttribute('data-y')),
  };
}
