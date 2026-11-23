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
export async function pagePoint(
  page: Page,
  x: number,
  y: number,
  w = 400,
  h = 600,
  stage = '[data-testid="code-screen"] [data-testid="stage"]',
) {
  const box = await page.locator(stage).boundingBox();
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

/** A game that counts what it was given and says it in a bubble every frame: nothing transient to miss. */
export const INPUT_GAME = `from pyquest import *

spaces = 0
rights = 0
twos = 0
clicks = 0
at = "-"


def update():
    global spaces, rights, twos, clicks, at
    if key_pressed("space"):
        spaces += 1
    if key_pressed("right"):
        rights += 1
    if key_pressed("2"):
        twos += 1
    if clicked():
        clicks += 1
        at = str(mouse_x()) + " " + str(mouse_y())


def draw():
    clear("skyblue")
    draw_circle(mouse_x(), mouse_y(), 20, "gold")
    draw_image("images/bird.png", 40, 300, scale=3, mirror=True)
    print(spaces, rights, twos, clicks, at, mouse_x(), mouse_y())
`;

/** What INPUT_GAME counted so far; at = where the last click was, mouse = where the pointer is. */
export async function inputSeen(page: Page) {
  const text = (await page.getByTestId('bubble').last().textContent()) ?? '';
  const m = /^(\d+) (\d+) (\d+) (\d+) (-|\d+ \d+) (\d+) (\d+)$/.exec(text);
  if (m === null) throw new Error(`not the input game: ${text}`);
  const at = (m[5] ?? '').split(' ').map(Number);
  return {
    spaces: Number(m[1]),
    rights: Number(m[2]),
    twos: Number(m[3]),
    clicks: Number(m[4]),
    at: { x: at[0] ?? NaN, y: at[1] ?? NaN },
    mouse: { x: Number(m[6]), y: Number(m[7]) },
  };
}

export function near(a: { x: number; y: number }, x: number, y: number): boolean {
  return Math.abs(a.x - x) <= 1 && Math.abs(a.y - y) <= 1;
}
