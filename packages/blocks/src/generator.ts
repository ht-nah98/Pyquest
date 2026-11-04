import * as Blockly from 'blockly/core';
import { Order, pythonGenerator } from 'blockly/python';
import { rawCode, registerBlocks } from './defs';

const PRECEDENCE: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };
const ATOMIC = 3;

const value = (block: Blockly.Block, name: string): string =>
  pythonGenerator.valueToCode(block, name, Order.NONE) || '';

/** Our own precedence so `a + b + c` stays as typed instead of Blockly's `(a + b) + c`. */
function precedenceOf(block: Blockly.Block | null): number {
  if (block?.type !== 'pq_arith') return ATOMIC;
  return PRECEDENCE[String(block.getFieldValue('OP'))] ?? ATOMIC;
}

function operand(block: Blockly.Block, name: string, needsAbove: number): string {
  const code = value(block, name);
  const child = block.getInputTargetBlock(name);
  return precedenceOf(child) < needsAbove ? `(${code})` : code;
}

let installed = false;

function installGenerators(): void {
  if (installed) return;
  registerBlocks();
  const g = pythonGenerator.forBlock;
  const call = (fn: string, names: string[]) => (block: Blockly.Block) =>
    `${fn}(${names.map((n) => value(block, n)).join(', ')})\n`;

  g['pq_draw_bird'] = call('draw_bird', ['X', 'Y']);
  g['pq_print'] = call('print', ['VALUE']);
  g['pq_clear'] = (block) => {
    const color = value(block, 'COLOR');
    return color === '' ? 'clear()\n' : `clear(${color})\n`;
  };
  g['pq_draw_rect'] = call('draw_rect', ['X', 'Y', 'W', 'H', 'COLOR']);
  g['pq_assign'] = (block) =>
    `${String(block.getFieldValue('NAME'))} = ${value(block, 'VALUE') || 'None'}\n`;
  g['pq_var_get'] = (block) => [String(block.getFieldValue('NAME')), Order.ATOMIC];
  g['pq_number'] = (block) => {
    const n = Number(block.getFieldValue('NUM'));
    return [String(n), n < 0 ? Order.UNARY_SIGN : Order.ATOMIC];
  };
  g['pq_text'] = (block) => [JSON.stringify(String(block.getFieldValue('TEXT'))), Order.ATOMIC];
  g['pq_arith'] = (block) => {
    const op = String(block.getFieldValue('OP'));
    const p = PRECEDENCE[op] ?? 1;
    const strictRight = op === '-' || op === '/' ? p + 1 : p;
    const code = `${operand(block, 'A', p)} ${op} ${operand(block, 'B', strictRight)}`;
    return [code, p === 1 ? Order.ADDITIVE : Order.MULTIPLICATIVE];
  };
  g['pq_raw_expr'] = (block) => [String(block.getFieldValue('CODE')), Order.ATOMIC];
  g['pq_raw'] = (block) => `${rawCode(block)}\n`;
  installed = true;
}

/** Python for a whole workspace. */
export function workspaceToPython(ws: Blockly.Workspace): string {
  installGenerators();
  return pythonGenerator.workspaceToCode(ws);
}

/** Python for a serialized workspace, using a throwaway headless workspace. */
export function toPython(state: object): string {
  installGenerators();
  const ws = new Blockly.Workspace();
  try {
    Blockly.serialization.workspaces.load(state, ws);
    return workspaceToPython(ws);
  } finally {
    ws.dispose();
  }
}

/** First code line (1-based) of every statement block, so a selected block can light up its line. */
export function lineMap(ws: Blockly.Workspace): Map<string, number> {
  installGenerators();
  pythonGenerator.init(ws);
  const map = new Map<string, number>();
  let line = 1;
  for (const top of ws.getTopBlocks(true)) {
    if (top.outputConnection !== null) continue;
    for (let b: Blockly.Block | null = top; b !== null; b = b.getNextBlock()) {
      map.set(b.id, line);
      const code = pythonGenerator.blockToCode(b, true);
      const text = typeof code === 'string' ? code : code[0];
      line += Math.max(1, text.replace(/\n$/, '').split('\n').length);
    }
  }
  return map;
}
