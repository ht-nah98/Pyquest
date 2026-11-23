import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { codeText, expectNoPageScroll, newStudent, pythonReady, typeCode } from './helpers';

const SHOTS = process.env['PQ_SHOTS'] ?? 'test-results/shots';

const DRAWING =
  'from pyquest import *\n\nclear("white")\ndraw_circle(300, 300, 150, "red")\ndraw_line(0, 0, 600, 600, "blue", 6)\n';

const BLOCK_TEXT = '.blocklyWorkspace > .blocklyBlockCanvas .blocklyText';

/** The colour of one stage point on the canvas, read after the run finished (AGENTS.md §9.8). */
async function colourAt(page: Page, x: number, y: number): Promise<number[]> {
  return page.getByTestId('stage').evaluate(
    (el, p) => {
      const c = el as HTMLCanvasElement;
      const k = c.width / 600;
      const d = c
        .getContext('2d')
        ?.getImageData(Math.round(p.x * k), Math.round(p.y * k), 1, 1).data;
      return d === undefined ? [] : [d[0] ?? 0, d[1] ?? 0, d[2] ?? 0];
    },
    { x, y },
  );
}

/** Runs and waits for ▶ Chạy to come back (the replay is over). */
async function runAndWait(page: Page) {
  await page.getByTestId('run').click();
  await expect(page.getByTestId('stage')).not.toHaveAttribute('data-frames', '0');
  await expect(page.getByTestId('run')).toBeVisible({ timeout: 30_000 });
}

test('studio: new drawing, run, reload, rename, download a PNG, delete', async ({ page }) => {
  await newStudent(page);
  await expect(page.getByTestId('studio-count')).toHaveText('0 tranh');
  await page.screenshot({ path: `${SHOTS}/studio-courses-1280.png` });
  await page.getByTestId('to-studio').click();
  await page.waitForURL('**/studio');
  await expect(page.getByTestId('no-drawings')).toBeVisible();

  await page.getByTestId('new-drawing').click();
  await page.waitForURL(/\/studio\/[a-z0-9]+$/);
  const url = page.url();
  await pythonReady(page);
  await expect(page.getByTestId('stage')).toHaveAttribute('data-stage', '600x600');
  await expect(page.getByTestId('stage-size-x')).toHaveText('x → 600');
  await expect(page.getByTestId('drawing-title')).toHaveValue('Tranh 1');
  expect(await codeText(page)).toContain('draw_circle(300, 300, 100, "orange")');

  await typeCode(page, DRAWING);
  await runAndWait(page);
  expect(await colourAt(page, 300, 200)).toEqual([255, 0, 0]);
  expect(await colourAt(page, 590, 20)).toEqual([255, 255, 255]);
  // The blocks follow the typed code (the editor is the code screen's, AGENTS.md §9.11).
  await expect(page.locator(BLOCK_TEXT, { hasText: 'red' }).first()).toBeVisible();

  // A challenge and its hint.
  await page.getByTestId('challenge-ngoi-nha').click();
  await expect(page.getByTestId('challenge-open')).toContainText('Ngôi nhà');
  await page.getByTestId('challenge-show-hint').click();
  await expect(page.getByTestId('challenge-hint')).toBeVisible();
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/studio-1280.png` });
  await page.setViewportSize({ width: 1866, height: 966 });
  await expect(page.getByTestId('run')).toBeVisible();
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/studio-1866.png` });
  await page.setViewportSize({ width: 1280, height: 720 });

  // Rename, then reload: the code and the name are kept.
  await page.getByTestId('drawing-title').fill('Ngôi nhà đẹp');
  await page.waitForTimeout(500); // autosave is debounced 300 ms
  await page.reload();
  await pythonReady(page);
  await expect(page.getByTestId('drawing-title')).toHaveValue('Ngôi nhà đẹp');
  expect(await codeText(page)).toContain('draw_circle(300, 300, 150, "red")');

  // ⬇️ Tải tranh runs the code when nothing is drawn yet, then saves a 600 × 600 PNG named after the title.
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 30_000 }),
    page.getByTestId('download').click(),
  ]);
  expect(download.suggestedFilename()).toBe('ngoi-nha-dep.png');
  const png = readFileSync(await download.path());
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  expect(png.readUInt32BE(16)).toBe(600);
  expect(png.readUInt32BE(20)).toBe(600);

  // The list shows it; rename there; the card counts it; delete asks first.
  await page.getByTestId('back').click();
  await page.waitForURL('**/studio');
  const id = url.split('/').pop() ?? '';
  const card = page.getByTestId(`drawing-${id}`);
  await expect(card).toContainText('Ngôi nhà đẹp');
  await card.getByTestId('rename').click();
  await card.getByTestId('rename-input').fill('Cầu vồng');
  await card.getByTestId('rename-save').click();
  await expect(card).toContainText('Cầu vồng');
  await expect(page.getByTestId('drawing-count')).toHaveText('1/50 tranh');
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/studio-list-1280.png` });
  await page.getByTestId('back').click();
  await expect(page.getByTestId('studio-count')).toHaveText('1 tranh');
  await page.getByTestId('to-studio').click();

  page.once('dialog', (d) => void d.accept());
  await page.getByTestId(`drawing-${id}`).getByTestId('delete').click();
  await expect(page.getByTestId('no-drawings')).toBeVisible();
  await page.goto(url);
  await expect(page.getByTestId('drawing-missing')).toBeVisible();
});
