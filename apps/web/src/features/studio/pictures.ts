import type { Asset } from '@pyquest/content-schema';
import type { StageSize } from '@pyquest/runtime';

/** Pixel art is 16 × 16: four times bigger is about the size of a hand on the 600 × 600 stage. */
export const PIXEL_SCALE = 4;

/** A picture as big as the stage: it is a background, drawn under every shape. */
export const isBackground = (a: Asset, stage: StageSize): boolean =>
  a.width === stage.width && a.height === stage.height;

/** The one line of Python that puts this picture on the stage (🖼️ Kho hình, spec 2026-11-26 §5.3). */
export function pictureLine(a: Asset, stage: StageSize): string {
  const path = `"images/${a.id}.png"`;
  if (isBackground(a, stage)) return `draw_image(${path}, 0, 0)`;
  const scale = a.pixel === true ? PIXEL_SCALE : 1;
  const x = Math.round((stage.width - a.width * scale) / 2);
  const y = Math.round((stage.height - a.height * scale) / 2);
  return `draw_image(${path}, ${String(x)}, ${String(y)}${scale === 1 ? '' : `, scale=${String(scale)}`})`;
}

/**
 * The child's code with one more line. 'end': after everything. 'under': right after the first top-level
 * clear() (else after `from pyquest import *`, else at the top), so a background lies under every shape.
 */
export function withLine(code: string, line: string, where: 'end' | 'under'): string {
  if (where === 'end') {
    const body = code.replace(/\n*$/, '');
    return body === '' ? `${line}\n` : `${body}\n${line}\n`;
  }
  const lines = code.split('\n');
  let at = lines.findIndex((l) => /^clear\(/.test(l));
  if (at < 0) at = lines.findIndex((l) => /^from pyquest import \*/.test(l));
  lines.splice(at + 1, 0, line);
  return lines.join('\n');
}
