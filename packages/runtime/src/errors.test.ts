import { describe, expect, test } from 'vitest';
import { translateError } from './errors';

describe('translateError', () => {
  test.each([
    ['SyntaxError', "'(' was never closed", 3, 'thiếu dấu ngoặc'],
    ['SyntaxError', "expected ':'", 2, 'dấu hai chấm'],
    ['IndentationError', 'expected an indented block after', 4, 'thụt lề'],
    ['NameError', "name 'drw_bird' is not defined", 1, 'drw_bird'],
    ['ZeroDivisionError', 'division by zero', 5, 'chia cho 0'],
    ['TypeError', 'can only concatenate str (not "int") to str', 6, 'chữ với số'],
    ['TypeError', 'draw_bird() missing 1 required positional argument', 7, 'số giá trị'],
    ['ValueError', 'something odd', 8, 'dòng 8'],
  ])('%s: %s', (type, msg, line, expected) => {
    const vi = translateError(type, msg, line);
    expect(vi.toLowerCase()).toContain(expected);
    expect(vi.split(/\s+/).length).toBeLessThanOrEqual(14);
  });

  test('no line number still gives a sentence', () => {
    expect(translateError('RuntimeError', 'x', null)).toMatch(/lỗi/);
  });
});
