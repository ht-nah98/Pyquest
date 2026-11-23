import { PyRunner } from '@pyquest/runtime';
import { beforeAll, describe, expect, test } from 'vitest';
import { registerBlocks, toPython, treeToState } from './index';

let py: PyRunner;
beforeAll(async () => {
  registerBlocks();
  py = await PyRunner.create();
});

const statements = (source: string) => {
  const tree = py.parseBlocks(source);
  if (!tree.ok) throw new Error(`${source}: ${tree.messageVi}`);
  return tree.statements;
};
const roundTrip = (source: string) => toPython(treeToState(statements(source))).trimEnd();

/** A small seeded generator, so the same expressions come out every time. */
function seeded(seed: number) {
  let s = seed;
  const below = (n: number) => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return Math.floor((s / 2 ** 32) * n);
  };
  return { below, pick: <T>(xs: readonly T[]): T => xs[below(xs.length)] as T };
}

/** Python's precedence: a higher one binds tighter. */
const P = { or: 1, and: 2, not: 3, compare: 4, plus: 5, times: 6, minus: 7, power: 8, atom: 9 };
type Expr = { code: string; p: number };

const ATOMS = ['a', 'speed', '2', '0.5', 'mob["x"]', 'xs[i]', 'len(xs)', 'random_int(1, 6)'];

/**
 * A random expression, written the way Python itself writes it: brackets only where the meaning needs them.
 * extra: now and then brackets nobody needs, too.
 */
function expression(r: ReturnType<typeof seeded>, depth: number, extra: boolean): Expr {
  const at = (child: Expr, needs: number): string =>
    child.p < needs || (extra && r.below(8) === 0) ? `(${child.code})` : child.code;
  const sub = () => expression(r, depth - 1, extra);
  if (depth === 0 || r.below(6) === 0) {
    const atom = r.pick(ATOMS);
    return r.below(8) === 0
      ? { code: '-5', p: P.minus }
      : { code: r.below(12) === 0 ? '"chữ"' : atom, p: P.atom };
  }
  switch (r.below(12)) {
    case 0:
      return { code: `-${at(sub(), P.minus)}`, p: P.minus };
    case 1:
      return { code: `${at(sub(), P.atom)} ** ${at(sub(), P.minus)}`, p: P.power };
    case 2:
      return { code: `${at(sub(), P.times)} // ${at(sub(), P.times + 1)}`, p: P.times };
    case 3:
      return { code: `not ${at(sub(), P.not)}`, p: P.not };
    case 4: {
      const op = r.pick(['and', 'or'] as const);
      const side = () => {
        const s = sub();
        // a and b and c is one node for Python: no nested copy of the same word.
        return at(s, s.p === P[op] ? P.atom : P[op]);
      };
      return { code: `${side()} ${op} ${side()}`, p: P[op] };
    }
    case 5: {
      const op = r.pick(['<', '>=', '==']);
      return { code: `${at(sub(), P.plus)} ${op} ${at(sub(), P.plus)}`, p: P.compare };
    }
    default: {
      const op = r.pick(['+', '-', '*', '/', '%']);
      const p = op === '+' || op === '-' ? P.plus : P.times;
      return { code: `${at(sub(), p)} ${op} ${at(sub(), p + 1)}`, p };
    }
  }
}

const N = 300;

/** The statements that lost or changed a character. */
function changed(seed: number, extra: boolean, wrap: (e: () => string) => string): string[] {
  const r = seeded(seed);
  const out: string[] = [];
  for (let i = 0; i < N; i++) {
    const source = wrap(() => expression(r, 1 + r.below(4), extra).code);
    const back = roundTrip(source);
    if (back !== source) out.push(`${source}\n  → ${back}`);
  }
  return out;
}

describe('code → blocks → code never changes a character of an expression', () => {
  const FORMS: [string, (e: () => string) => string][] = [
    ['assign', (e) => `v = ${e()}`],
    ['key_set', (e) => `mob["x"] = ${e()}`],
    ['if', (e) => `if ${e()}:\n    print(${e()})`],
    ['abs', (e) => `v = abs(${e()})`],
    ['dict', (e) => `v = {"x": ${e()}, "y": ${e()}}`],
    ['key_aug', (e) => `mob["hp"] -= ${e()}`],
    ['list slot', (e) => `xs[${e()}] += ${e()}`],
    ['remove', (e) => `xs.remove(${e()})`],
    ['scale', (e) => `draw_image("images/a.png", ${e()}, ${e()}, scale=${e()})`],
    ['in a def', (e) => `def f(a):\n    v = abs(${e()})\n    return ${e()}`],
  ];
  test.each(FORMS)('%s', (_, wrap) => {
    expect(changed(7, false, wrap)).toEqual([]);
  });

  // The forms of ADR 0011 also keep brackets nobody needs: such a line stays code text.
  test.each(FORMS.filter(([n]) => ['abs', 'dict', 'key_aug', 'remove', 'scale'].includes(n)))(
    '%s, with brackets to spare',
    (_, wrap) => {
      expect(changed(11, true, wrap)).toEqual([]);
    },
  );

  test('a + b + c keeps no brackets and is made of arithmetic blocks', () => {
    for (const source of ['v = a + b + c', 'v = a * b / c % d', 'v = abs(a - b - c)']) {
      expect(JSON.stringify(statements(source))).not.toContain('pq_raw');
      expect(roundTrip(source)).toBe(source);
    }
  });

  test.each([
    'v = a + (b + c)',
    'v = a + (b - c)',
    'v = a * (b * c)',
    'v = a * (b / c)',
    'v = abs(a + (b - c))',
    'v = {"x": a + (b + c)}',
    'mob["x"] += a * (b * c)',
  ])('%j keeps the brackets on the right, as blocks', (source) => {
    expect(JSON.stringify(statements(source))).not.toContain('pq_raw');
    expect(roundTrip(source)).toBe(source);
  });

  test.each([
    'v = -a + b',
    'v = (-a) + b',
    'v = a ** 2 + b ** 2',
    'v = (a // b) * c',
    'v = speed * (-x)',
    'v = đường * (-x) + (tên ** 2)',
    'ok = a == -b',
    'ok = a and (x in xs)',
    'v = (y := 1)',
    'v = {"a": (y := 1)}',
    'v = (a **\n     b)',
    'v = ("a"\n     "b")',
    'v = (mob\n     .name())',
    'v = [*xs, a]',
  ])('%j keeps exactly the brackets that were typed', (source) => {
    const back = roundTrip(source);
    expect(py.parseBlocks(back).ok).toBe(true);
    expect(back).toBe(source);
  });
});
