import { BLOCK_TYPES } from './defs';

const num = (n: number) => ({ shadow: { type: 'pq_number', fields: { NUM: n } } });
const text = (t: string) => ({ shadow: { type: 'pq_text', fields: { TEXT: t } } });

/** Defaults the toolbox puts in a fresh block, so a dragged block already runs. */
const DEFAULT_INPUTS: Record<string, Record<string, object>> = {
  pq_draw_bird: { X: num(100), Y: num(300) },
  pq_print: { VALUE: text('Xin chào!') },
  pq_clear: { COLOR: text('skyblue') },
  pq_draw_rect: { X: num(0), Y: num(550), W: num(400), H: num(50), COLOR: text('green') },
  pq_assign: { VALUE: num(0) },
  pq_arith: { A: num(1), B: num(1) },
  pq_draw_sprite: { NAME: text('pipe'), X: num(200), Y: num(300) },
  pq_draw_text: { TEXT: text('0'), X: num(200), Y: num(60) },
  pq_use_sprite: { NAME: text('bird'), PATH: text('images/bird-cu.png') },
  pq_aug: { VALUE: num(1) },
  pq_for: { COUNT: num(3) },
  pq_for_range: { FROM: num(0), TO: num(5) },
  pq_compare: { A: num(0), B: num(0) },
  pq_random: { A: num(1), B: num(10) },
};

export type ToolboxEntry = { kind: 'block'; type: string; inputs?: Record<string, object> };
export type ToolboxCategory = {
  kind: 'category';
  name: string;
  colour: string;
  contents: ToolboxEntry[];
};
export type Toolbox =
  | { kind: 'flyoutToolbox'; contents: ToolboxEntry[] }
  | { kind: 'categoryToolbox'; contents: ToolboxCategory[] };

/** Category of each block, in the order the categories appear. Colours match defs.ts families. */
const CATEGORIES: { name: string; colour: string; types: string[] }[] = [
  {
    name: 'Vẽ',
    colour: '210',
    types: [
      'pq_clear',
      'pq_draw_bird',
      'pq_draw_sprite',
      'pq_use_sprite',
      'pq_draw_rect',
      'pq_draw_text',
      'pq_print',
    ],
  },
  { name: 'Biến', colour: '330', types: ['pq_assign', 'pq_aug', 'pq_var_get', 'pq_global'] },
  { name: 'Lặp', colour: '30', types: ['pq_for', 'pq_for_range'] },
  {
    name: 'Điều kiện',
    colour: '260',
    types: ['pq_if', 'pq_if_else', 'pq_compare', 'pq_logic', 'pq_key_pressed'],
  },
  { name: 'Lệnh tự đặt', colour: '290', types: ['pq_def'] },
  { name: 'Số và chữ', colour: '160', types: ['pq_number', 'pq_text', 'pq_arith', 'pq_random'] },
];

/** Up to this many blocks: one flyout. More: categories, so the flyout never pushes the workspace away. */
const FLYOUT_MAX = 6;

function entry(type: string): ToolboxEntry {
  const known: readonly string[] = BLOCK_TYPES;
  if (!known.includes(type)) throw new Error(`unknown block "${type}" in toolbox`);
  const inputs = DEFAULT_INPUTS[type];
  return inputs === undefined ? { kind: 'block', type } : { kind: 'block', type, inputs };
}

/** The toolbox for a lesson: exactly the blocks it allows. */
export function toolboxFor(ids: readonly string[]): Toolbox {
  const entries = ids.map(entry);
  if (ids.length <= FLYOUT_MAX) return { kind: 'flyoutToolbox', contents: entries };
  const contents: ToolboxCategory[] = [];
  for (const cat of CATEGORIES) {
    const inCat = cat.types.filter((t) => ids.includes(t)).map(entry);
    if (inCat.length > 0)
      contents.push({ kind: 'category', name: cat.name, colour: cat.colour, contents: inCat });
  }
  const placed = new Set(CATEGORIES.flatMap((c) => c.types));
  const rest = ids.filter((t) => !placed.has(t)).map(entry);
  if (rest.length > 0)
    contents.push({ kind: 'category', name: 'Khác', colour: '60', contents: rest });
  return { kind: 'categoryToolbox', contents };
}
