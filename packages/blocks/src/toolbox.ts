import type { BlockNode } from '@pyquest/runtime';
import { BLOCK_TYPES } from './defs';

const num = (n: number) => ({ shadow: { type: 'pq_number', fields: { NUM: n } } });
const text = (t: string) => ({ shadow: { type: 'pq_text', fields: { TEXT: t } } });

/** Defaults the toolbox puts in a fresh block, so a dragged block already runs. */
const DEFAULT_INPUTS: Record<string, Record<string, object>> = {
  pq_print: { VALUE: text('Xin chào!') },
  pq_clear: { COLOR: text('skyblue') },
  pq_draw_rect: { X: num(0), Y: num(550), W: num(400), H: num(50), COLOR: text('green') },
  pq_assign: { VALUE: num(0) },
  pq_arith: { A: num(1), B: num(1) },
  pq_draw_image: { PATH: text('images/bird.png'), X: num(100), Y: num(300) },
  pq_draw_text: { TEXT: text('0'), X: num(200), Y: num(60) },
  pq_aug: { VALUE: num(1) },
  pq_for: { COUNT: num(3) },
  pq_for_range: { FROM: num(0), TO: num(5) },
  pq_compare: { A: num(0), B: num(0) },
  pq_random: { A: num(1), B: num(10) },
};

export type ToolboxEntry = {
  kind: 'block';
  type: string;
  inputs?: Record<string, object>;
  extraState?: { name: string; params: string[] };
};
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
  { name: 'Thư viện', colour: '20', types: ['pq_import'] },
  {
    name: 'Vẽ',
    colour: '210',
    types: ['pq_clear', 'pq_draw_rect', 'pq_draw_image', 'pq_draw_text', 'pq_print'],
  },
  { name: 'Biến', colour: '330', types: ['pq_assign', 'pq_aug', 'pq_var_get', 'pq_global'] },
  { name: 'Lặp', colour: '30', types: ['pq_for', 'pq_for_range'] },
  {
    name: 'Điều kiện',
    colour: '260',
    types: ['pq_if', 'pq_if_else', 'pq_compare', 'pq_logic', 'pq_key_pressed'],
  },
  { name: 'Lệnh tự đặt', colour: '290', types: ['pq_def', 'pq_return'] },
  { name: 'Số và chữ', colour: '160', types: ['pq_number', 'pq_text', 'pq_arith', 'pq_random'] },
];

function entry(type: string): ToolboxEntry {
  const known: readonly string[] = BLOCK_TYPES;
  if (!known.includes(type)) throw new Error(`unknown block "${type}" in toolbox`);
  const inputs = DEFAULT_INPUTS[type];
  return inputs === undefined ? { kind: 'block', type } : { kind: 'block', type, inputs };
}

/** One call block for every def in the code (top level and nested), so the child can use what they made. */
export function callBlocksFor(statements: readonly BlockNode[]): ToolboxEntry[] {
  const out: ToolboxEntry[] = [];
  const seen = new Set<string>();
  const walk = (nodes: readonly BlockNode[]) => {
    for (const n of nodes) {
      const name = n.fields?.['NAME'];
      if (n.type === 'pq_def' && typeof name === 'string' && !seen.has(name)) {
        seen.add(name);
        const raw = n.fields?.['PARAMS'];
        const params =
          typeof raw === 'string' && raw.trim() !== '' ? raw.split(',').map((p) => p.trim()) : [];
        const entry: ToolboxEntry = {
          kind: 'block',
          type: 'pq_call',
          extraState: { name, params },
        };
        if (params.length > 0)
          entry.inputs = Object.fromEntries(params.map((_, i) => [`ARG${String(i)}`, num(0)]));
        out.push(entry);
      }
      for (const list of Object.values(n.statements ?? {})) walk(list);
    }
  };
  walk(statements);
  return out;
}

/** The toolbox for a lesson: exactly the blocks it allows, plus a call block for each of the child's defs. */
export function toolboxFor(ids: readonly string[], calls: readonly ToolboxEntry[] = []): Toolbox {
  // Always categories: an always-open flyout is as wide as its widest block, and draw_rect is wide
  // enough to cover the whole workspace (no room left to drop a block).
  const contents: ToolboxCategory[] = [];
  for (const cat of CATEGORIES) {
    const inCat = cat.types.filter((t) => ids.includes(t)).map(entry);
    if (cat.name === 'Lệnh tự đặt') inCat.push(...calls);
    if (inCat.length > 0)
      contents.push({ kind: 'category', name: cat.name, colour: cat.colour, contents: inCat });
  }
  const placed = new Set(CATEGORIES.flatMap((c) => c.types));
  const rest = ids.filter((t) => !placed.has(t)).map(entry);
  if (rest.length > 0)
    contents.push({ kind: 'category', name: 'Khác', colour: '60', contents: rest });
  return { kind: 'categoryToolbox', contents };
}
