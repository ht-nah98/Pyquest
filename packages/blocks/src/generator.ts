import { Blockly, type Block, type Workspace } from './blockly';
import { Order, pythonGenerator } from './blockly';
import { callOf, chainOf, rawCode, registerBlocks } from './defs';

const PRECEDENCE: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2 };
const ATOMIC = 3;

const value = (block: Block, name: string): string =>
  pythonGenerator.valueToCode(block, name, Order.NONE) || '';

/** Our own precedence so `a + b + c` stays as typed instead of Blockly's `(a + b) + c`. */
function precedenceOf(block: Block | null): number {
  if (block?.type !== 'pq_arith') return ATOMIC;
  return PRECEDENCE[String(block.getFieldValue('OP'))] ?? ATOMIC;
}

function operand(block: Block, name: string, needsAbove: number): string {
  const code = value(block, name);
  const child = block.getInputTargetBlock(name);
  return precedenceOf(child) < needsAbove ? `(${code})` : code;
}

/** Python's own indent (4 spaces), so code → blocks → code gives back what the child typed. */
const INDENT = '    ';

/** An indented statement body; an empty body becomes `pass` so the code still runs. */
function body(block: Block, name: string): string {
  const code = pythonGenerator.statementToCode(block, name);
  return code === '' ? `${INDENT}pass\n` : code;
}

let installed = false;

function installGenerators(): void {
  if (installed) return;
  registerBlocks();
  pythonGenerator.INDENT = INDENT;
  const g = pythonGenerator.forBlock;
  const call = (fn: string, names: string[]) => (block: Block) =>
    `${fn}(${names.map((n) => value(block, n)).join(', ')})\n`;

  g['pq_import'] = () => 'from pyquest import *\n';
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
    const strictRight = op === '-' || op === '/' || op === '%' ? p + 1 : p;
    const code = `${operand(block, 'A', p)} ${op} ${operand(block, 'B', strictRight)}`;
    return [code, p === 1 ? Order.ADDITIVE : Order.MULTIPLICATIVE];
  };
  g['pq_raw_expr'] = (block) => [String(block.getFieldValue('CODE')), Order.ATOMIC];
  g['pq_draw_image'] = (block) => {
    const args = ['PATH', 'X', 'Y'].map((n) => value(block, n));
    if (block.getFieldValue('FLIP') === 'TRUE') args.push('flip=True');
    return `draw_image(${args.join(', ')})\n`;
  };
  g['pq_draw_text'] = call('draw_text', ['TEXT', 'X', 'Y']);
  g['pq_aug'] = (block) =>
    `${String(block.getFieldValue('NAME'))} ${String(block.getFieldValue('OP'))} ${value(block, 'VALUE') || '0'}\n`;
  g['pq_global'] = (block) => `global ${String(block.getFieldValue('NAMES'))}\n`;
  g['pq_for'] = (block) =>
    `for ${String(block.getFieldValue('VAR'))} in range(${value(block, 'COUNT') || '0'}):\n${body(block, 'DO')}`;
  g['pq_for_range'] = (block) =>
    `for ${String(block.getFieldValue('VAR'))} in range(${value(block, 'FROM') || '0'}, ${value(block, 'TO') || '0'}):\n${body(block, 'DO')}`;
  g['pq_if'] = (block) => `if ${value(block, 'COND') || 'False'}:\n${body(block, 'DO')}`;
  g['pq_if_else'] = (block) =>
    `if ${value(block, 'COND') || 'False'}:\n${body(block, 'DO')}else:\n${body(block, 'ELSE')}`;
  g['pq_def'] = (block) =>
    `def ${String(block.getFieldValue('NAME'))}(${String(block.getFieldValue('PARAMS')).trim()}):\n${body(block, 'BODY')}`;
  g['pq_return'] = (block) => `return ${value(block, 'VALUE') || 'None'}\n`;
  g['pq_call'] = (block) => {
    const { name, params } = callOf(block);
    return `${name}(${params.map((_, i) => value(block, `ARG${String(i)}`) || '0').join(', ')})\n`;
  };
  g['pq_compare'] = (block) => [
    `${value(block, 'A')} ${String(block.getFieldValue('OP'))} ${value(block, 'B')}`,
    Order.RELATIONAL,
  ];
  g['pq_logic'] = (block) => {
    const op = String(block.getFieldValue('OP'));
    return [
      `${value(block, 'A')} ${op} ${value(block, 'B')}`,
      op === 'and' ? Order.LOGICAL_AND : Order.LOGICAL_OR,
    ];
  };
  g['pq_key_pressed'] = () => ['key_pressed()', Order.FUNCTION_CALL];
  g['pq_random'] = (block) => [
    `random_int(${value(block, 'A')}, ${value(block, 'B')})`,
    Order.FUNCTION_CALL,
  ];
  g['pq_raw'] = (block) => `${rawCode(block)}\n`;
  g['pq_while'] = (block) => `while ${value(block, 'COND') || 'False'}:\n${body(block, 'DO')}`;
  g['pq_not'] = (block) => [
    `not ${pythonGenerator.valueToCode(block, 'A', Order.LOGICAL_NOT) || 'False'}`,
    Order.LOGICAL_NOT,
  ];
  g['pq_bool'] = (block) => [String(block.getFieldValue('BOOL')), Order.ATOMIC];
  g['pq_if_chain'] = (block) => {
    const { elifs, hasElse } = chainOf(block);
    let code = '';
    for (let i = 0; i <= elifs; i++) {
      const head = i === 0 ? 'if' : 'elif';
      code += `${head} ${value(block, `COND${String(i)}`) || 'False'}:\n${body(block, `DO${String(i)}`)}`;
    }
    return hasElse ? `${code}else:\n${body(block, 'ELSE')}` : code;
  };
  g['pq_call_expr'] = (block) => {
    const { name, params } = callOf(block);
    const args = params.map((_, i) => value(block, `ARG${String(i)}`) || '0').join(', ');
    return [`${name}(${args})`, Order.FUNCTION_CALL];
  };
  installed = true;
}

/** Python for a whole workspace. */
export function workspaceToPython(ws: Workspace): string {
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

/** First code line (1-based) of every statement block, nested ones too, so a selected block lights up its line. */
export function lineMap(ws: Workspace): Map<string, number> {
  installGenerators();
  pythonGenerator.init(ws);
  const map = new Map<string, number>();
  const size = (b: Block): number => {
    const code = pythonGenerator.blockToCode(b, true);
    const text = typeof code === 'string' ? code : code[0];
    return Math.max(1, text.replace(/\n$/, '').split('\n').length);
  };
  const place = (first: Block | null, start: number): number => {
    let line = start;
    for (let b = first; b !== null; b = b.getNextBlock()) {
      map.set(b.id, line);
      let inner = line + 1;
      for (const input of b.inputList) {
        if (input.type !== Blockly.inputs.inputTypes.STATEMENT) continue;
        // the `else:` line, and each `elif …:` line of a chain (DO1, DO2…)
        if (input.name === 'ELSE' || /^DO[1-9]/.test(input.name)) inner += 1;
        const child = b.getInputTargetBlock(input.name);
        inner = child === null ? inner + 1 : place(child, inner);
      }
      line += size(b);
    }
    return line;
  };
  let line = 1;
  for (const top of ws.getTopBlocks(true)) {
    if (top.outputConnection !== null) continue;
    line = place(top, line);
  }
  return map;
}
