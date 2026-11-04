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
  pq_aug: { VALUE: num(1) },
  pq_for: { COUNT: num(3) },
  pq_for_range: { FROM: num(0), TO: num(5) },
  pq_compare: { A: num(0), B: num(0) },
  pq_random: { A: num(1), B: num(10) },
};

export type ToolboxEntry = { kind: 'block'; type: string; inputs?: Record<string, object> };
export type Toolbox = { kind: 'flyoutToolbox'; contents: ToolboxEntry[] };

/** A flyout with exactly the blocks a lesson allows, in the lesson's order. */
export function toolboxFor(ids: readonly string[]): Toolbox {
  const known: readonly string[] = BLOCK_TYPES;
  return {
    kind: 'flyoutToolbox',
    contents: ids.map((type) => {
      if (!known.includes(type)) throw new Error(`unknown block "${type}" in toolbox`);
      const inputs = DEFAULT_INPUTS[type];
      return inputs === undefined ? { kind: 'block', type } : { kind: 'block', type, inputs };
    }),
  };
}
