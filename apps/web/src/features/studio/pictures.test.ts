import type { Asset } from '@pyquest/content-schema';
import { describe, expect, test } from 'vitest';
import { isBackground, pictureLine, withLine } from './pictures';

const STAGE = { width: 600, height: 600 };
const asset = (over: Partial<Asset>): Asset => ({
  id: 'x',
  group: 'deco',
  file: 'x.png',
  width: 16,
  height: 16,
  frames: 1,
  credit: 'ai-generated',
  ...over,
});

describe('pictureLine: the code that puts one library picture on the stage', () => {
  test('a 16 × 16 pixel picture is made 4 times bigger and put in the middle', () => {
    expect(pictureLine(asset({ id: 'deco-oak', pixel: true }), STAGE)).toBe(
      'draw_image("images/deco-oak.png", 268, 268, scale=4)',
    );
  });

  test('a background as big as the stage goes in the top-left corner', () => {
    const bg = asset({ id: 'bg-lang-que', group: 'background', width: 600, height: 600 });
    expect(isBackground(bg, STAGE)).toBe(true);
    expect(pictureLine(bg, STAGE)).toBe('draw_image("images/bg-lang-que.png", 0, 0)');
  });

  test('any other picture keeps its size and sits in the middle', () => {
    const bird = asset({ id: 'bird-cu', group: 'bird', width: 44, height: 40 });
    expect(isBackground(bird, STAGE)).toBe(false);
    expect(pictureLine(bird, STAGE)).toBe('draw_image("images/bird-cu.png", 278, 280)');
  });
});

describe('withLine: adding a picture line to the child’s code', () => {
  const LINE = 'draw_image("images/a.png", 0, 0)';

  test('end: on its own line after everything, with one newline at the end', () => {
    expect(withLine('from pyquest import *\nclear("white")\n', LINE, 'end')).toBe(
      `from pyquest import *\nclear("white")\n${LINE}\n`,
    );
    expect(withLine('clear("white")', LINE, 'end')).toBe(`clear("white")\n${LINE}\n`);
    expect(withLine('', LINE, 'end')).toBe(`${LINE}\n`);
  });

  test('under: right after the first top-level clear(), so the picture lies under every shape', () => {
    const code =
      'from pyquest import *\n\nclear("white")\ndraw_circle(1, 1, 1, "red")\nclear("red")\n';
    expect(withLine(code, LINE, 'under')).toBe(
      `from pyquest import *\n\nclear("white")\n${LINE}\ndraw_circle(1, 1, 1, "red")\nclear("red")\n`,
    );
  });

  test('under: an indented clear() inside a loop or def is not the sky', () => {
    const code = 'from pyquest import *\nfor i in range(2):\n    clear("red")\n';
    expect(withLine(code, LINE, 'under')).toBe(
      `from pyquest import *\n${LINE}\nfor i in range(2):\n    clear("red")\n`,
    );
  });

  test('under: no clear() — right after the import line; no import — at the very top', () => {
    expect(withLine('from pyquest import *\ndraw_circle(1, 1, 1, "red")\n', LINE, 'under')).toBe(
      `from pyquest import *\n${LINE}\ndraw_circle(1, 1, 1, "red")\n`,
    );
    expect(withLine('draw_circle(1, 1, 1, "red")\n', LINE, 'under')).toBe(
      `${LINE}\ndraw_circle(1, 1, 1, "red")\n`,
    );
  });
});
