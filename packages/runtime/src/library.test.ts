import { expect, test } from 'vitest';
import { librarySource } from './library';

test('a library command shows its real code from pyquest.py', () => {
  const src = librarySource('draw_rect');
  expect(src?.startsWith('def draw_rect(x, y, w, h, color="green", border=None):')).toBe(true);
  expect(src).toContain('_emit(');
  expect(src).not.toContain('def draw_text');
});

test('a constant shows its line', () => {
  expect(librarySource('WIDTH')).toBe('WIDTH = 400');
});

test('names that are not in the library give nothing', () => {
  expect(librarySource('draw_bird')).toBeUndefined();
});

test("with the course's stage, WIDTH and HEIGHT show that stage's numbers", () => {
  const square = { width: 600, height: 600 };
  expect(librarySource('WIDTH', square)).toBe('WIDTH = 600');
  expect(librarySource('HEIGHT', square)).toBe('HEIGHT = 600');
  expect(librarySource('draw_circle', square)?.startsWith('def draw_circle(x, y, r')).toBe(true);
});
