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

const FACE = `from pyquest import *

clear("skyblue")
draw_ellipse(300, 300, 240, 300, "peachpuff", border="black")
draw_circle(250, 260, 20, "white", border="black")
draw_circle(350, 260, 20, None, border="black")
draw_arc(300, 360, 60, 0, 180, "red", 6)
`;

test('studio: a face with an ellipse, outlined eyes and an arc smile', async ({ page }) => {
  await newStudent(page);
  await page.getByTestId('to-studio').click();
  await page.getByTestId('new-drawing').click();
  await page.waitForURL(/\/studio\/[a-z0-9]+$/);
  await pythonReady(page);
  await typeCode(page, FACE);
  await runAndWait(page);
  await expect(page.getByTestId('run-error')).toHaveCount(0);
  expect(await colourAt(page, 300, 200)).toEqual([255, 218, 185]); // the face, peachpuff
  expect(await colourAt(page, 250, 260)).toEqual([255, 255, 255]); // a filled eye
  expect(await colourAt(page, 350, 260)).toEqual([255, 218, 185]); // the hollow eye shows the face
  expect(await colourAt(page, 300, 420)).toEqual([255, 0, 0]); // bottom of the smile
  expect(await colourAt(page, 300, 300)).toEqual([255, 218, 185]); // above it, no line
  await page.screenshot({ path: `${SHOTS}/studio-face-1280.png` });
});

const STUDIO_JSON = new URL('../../../content/studio/studio.json', import.meta.url);
const templateCode = (id: string): string => {
  const studio = JSON.parse(readFileSync(STUDIO_JSON, 'utf8')) as {
    templates: { id: string; code: string }[];
  };
  return studio.templates.find((t) => t.id === id)?.code ?? '';
};

test('studio: 📐 trace a template — faint template, 100% when traced, 👀 turns it off', async ({
  page,
}) => {
  await newStudent(page);
  await page.getByTestId('to-studio').click();
  await page.waitForURL('**/studio');
  await page.getByTestId('trace-mode').click();
  await expect(page.getByTestId('template-ngoi-nha')).toBeVisible();
  await expect(page.getByTestId('template-pho-den-long')).toContainText('⭐⭐⭐');
  // Every card shows its template, drawn by running its code.
  await expect(page.locator('[data-testid="template-thumb"][data-drawn="true"]')).toHaveCount(6, {
    timeout: 30_000,
  });
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/studio-templates-1280.png` });

  await page.getByTestId('template-ngoi-nha').click();
  await page.waitForURL(/\/studio\/[a-z0-9]+$/);
  await pythonReady(page);
  await expect(page.getByTestId('drawing-title')).toHaveValue('🏠 Ngôi nhà');
  await expect(page.getByTestId('stage')).toHaveAttribute('data-ghost', 'on');
  await expect(page.getByTestId('ghost-toggle')).toHaveAttribute('aria-pressed', 'true');
  // The template's own hint takes the place of 💡 Thử thách.
  await expect(page.getByTestId('challenges')).toHaveCount(0);
  await page.getByTestId('template-show-hint').click();
  await expect(page.getByTestId('template-hint')).toContainText('y = 280');

  // The starter (one orange circle) looks little like the house.
  await runAndWait(page);
  await expect(page.getByTestId('likeness')).toBeVisible();
  const starter = Number(
    /(\d+)%/.exec((await page.getByTestId('likeness').textContent()) ?? '')?.[1],
  );
  expect(starter).toBeLessThan(60);

  await typeCode(page, templateCode('ngoi-nha'));
  await runAndWait(page);
  await expect(page.getByTestId('likeness')).toContainText('Giống mẫu 100%');
  await expect(page.locator(BLOCK_TEXT, { hasText: 'khaki' }).first()).toBeVisible();
  await expect(page.getByTestId('likeness')).toContainText('🎉');
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/studio-trace-1280.png` });
  await page.setViewportSize({ width: 1866, height: 966 });
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/studio-trace-1866.png` });
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.getByTestId('ghost-toggle').click();
  await expect(page.getByTestId('stage')).toHaveAttribute('data-ghost', 'off');

  // ✏️ a free drawing has no template and no 👀.
  await page.goto(page.url().replace(/\/studio\/.*$/, '/studio'));
  await page.getByTestId('new-drawing').click();
  await page.waitForURL(/\/studio\/[a-z0-9]+$/);
  await pythonReady(page);
  await expect(page.getByTestId('ghost-toggle')).toHaveCount(0);
  await expect(page.getByTestId('likeness')).toHaveCount(0);
});

test('studio: 🖼️ Kho hình shows the pictures, their code, and ➕ adds one to the drawing', async ({
  page,
}) => {
  await newStudent(page);
  await page.getByTestId('to-studio').click();
  await page.getByTestId('new-drawing').click();
  await page.waitForURL(/\/studio\/[a-z0-9]+$/);
  await pythonReady(page);

  await page.getByTestId('pictures-toggle').click();
  const panel = page.getByTestId('picture-panel');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Đổi x, y để dời hình');
  // Over the code, under Blockly's menus (AGENTS.md §9.12): the panel's own edge is on top.
  const box = await panel.boundingBox();
  const top = await page.evaluate(
    (p) =>
      document.elementFromPoint(p.x + 3, p.y + 40)?.closest('[data-testid="picture-panel"]') !==
      null,
    { x: box?.x ?? 0, y: box?.y ?? 0 },
  );
  expect(top).toBe(true);

  // 📘 and 🖼️ never cover each other.
  await page.getByTestId('library-toggle').click();
  await expect(page.getByTestId('library-panel')).toBeVisible();
  await expect(panel).toHaveCount(0);
  await page.getByTestId('pictures-toggle').click();
  await expect(page.getByTestId('library-panel')).toHaveCount(0);

  await page.getByTestId('picture-group-cay-hoa').click();
  await page.getByTestId('picture-deco-oak').click();
  await expect(page.getByTestId('picture-name')).toContainText('Cây sồi');
  await expect(page.getByTestId('picture-code')).toHaveText(
    'draw_image("images/deco-oak.png", 268, 268, scale=4)',
  );
  await page.getByTestId('picture-group-chim').click();
  await page.getByTestId('picture-bird-cu').click();
  await expect(page.getByTestId('picture-code')).toHaveText(
    'draw_image("images/bird-cu.png", 278, 280)',
  );
  await page.screenshot({ path: `${SHOTS}/studio-pictures-1280.png` });
  await page.getByTestId('picture-add').click();
  await expect.poll(() => codeText(page)).toContain('draw_image("images/bird-cu.png", 278, 280)\n');
  expect(
    (await codeText(page)).trimEnd().endsWith('draw_image("images/bird-cu.png", 278, 280)'),
  ).toBe(true);
  await expect(page.locator(BLOCK_TEXT, { hasText: 'images/bird-cu.png' }).first()).toBeVisible();

  await runAndWait(page);
  await expect(page.getByTestId('run-error')).toHaveCount(0);
  // The owl is drawn over the orange circle, in the middle of the stage.
  expect(await colourAt(page, 300, 300)).not.toEqual([255, 165, 0]);
  await expectNoPageScroll(page);
  await page.screenshot({ path: `${SHOTS}/studio-pictures-run-1280.png` });
});
