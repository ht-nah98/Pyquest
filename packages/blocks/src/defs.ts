import { Blockly, type Block } from './blockly';

/** Block colours by family, so a child links a colour with a kind of command. */
const DRAW = 210;
const VALUE = 160;
const VARIABLE = 330;
const RAW = 60;
const BLANK = '#c8ccd4';
const COMMENT = '#8fb996';
const LOOP = 30;
const CONDITION = 260;
const FUNCTION = 290;
const EVENT = 45;

/** Labels are Vietnamese; the code they make is English Python (spec §5). */
const JSON_DEFS = [
  {
    type: 'pq_draw_bird',
    message0: 'vẽ chim tại x %1 y %2',
    args0: [
      { type: 'input_value', name: 'X' },
      { type: 'input_value', name: 'Y' },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: DRAW,
    tooltip: 'draw_bird(x, y): vẽ chim, góc trên bên trái ở (x, y).',
  },
  {
    type: 'pq_print',
    message0: 'nói %1',
    args0: [{ type: 'input_value', name: 'VALUE' }],
    previousStatement: null,
    nextStatement: null,
    colour: DRAW,
    tooltip: 'print(...): hiện bong bóng thoại trên sân chơi.',
  },
  {
    type: 'pq_clear',
    message0: 'tô nền màu %1',
    args0: [{ type: 'input_value', name: 'COLOR' }],
    previousStatement: null,
    nextStatement: null,
    colour: DRAW,
    tooltip: 'clear(màu): tô kín sân chơi bằng một màu.',
  },
  {
    type: 'pq_draw_rect',
    message0: 'vẽ hình chữ nhật x %1 y %2 rộng %3 cao %4 màu %5',
    args0: [
      { type: 'input_value', name: 'X' },
      { type: 'input_value', name: 'Y' },
      { type: 'input_value', name: 'W' },
      { type: 'input_value', name: 'H' },
      { type: 'input_value', name: 'COLOR' },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: DRAW,
    tooltip: 'draw_rect(x, y, rộng, cao, màu)',
  },
  {
    type: 'pq_assign',
    message0: 'đặt %1 = %2',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'x' },
      { type: 'input_value', name: 'VALUE' },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: VARIABLE,
    tooltip: 'Cất một giá trị vào biến.',
  },
  {
    type: 'pq_var_get',
    message0: '%1',
    args0: [{ type: 'field_input', name: 'NAME', text: 'x' }],
    output: null,
    colour: VARIABLE,
    tooltip: 'Giá trị đang cất trong biến.',
  },
  {
    type: 'pq_number',
    message0: '%1',
    args0: [{ type: 'field_number', name: 'NUM', value: 0 }],
    output: 'Number',
    colour: VALUE,
  },
  {
    type: 'pq_text',
    message0: '" %1 "',
    args0: [{ type: 'field_input', name: 'TEXT', text: '' }],
    output: 'String',
    colour: VALUE,
  },
  {
    type: 'pq_arith',
    message0: '%1 %2 %3',
    args0: [
      { type: 'input_value', name: 'A' },
      {
        type: 'field_dropdown',
        name: 'OP',
        options: [
          ['+', '+'],
          ['−', '-'],
          ['×', '*'],
          ['÷', '/'],
        ],
      },
      { type: 'input_value', name: 'B' },
    ],
    inputsInline: true,
    output: 'Number',
    colour: VALUE,
  },
  {
    type: 'pq_draw_sprite',
    message0: 'vẽ hình %1 tại x %2 y %3',
    args0: [
      { type: 'input_value', name: 'NAME' },
      { type: 'input_value', name: 'X' },
      { type: 'input_value', name: 'Y' },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: DRAW,
    tooltip: 'draw_sprite(tên, x, y): vẽ một hình trong kho hình.',
  },
  {
    type: 'pq_use_sprite',
    message0: 'dùng ảnh %2 cho %1',
    args0: [
      { type: 'input_value', name: 'NAME' },
      { type: 'input_value', name: 'PATH' },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: DRAW,
    tooltip:
      'use_sprite("bird", "images/bird-cu.png"): đổi hình của chim bằng một file trong thư mục images.',
  },
  {
    type: 'pq_draw_text',
    message0: 'viết chữ %1 tại x %2 y %3',
    args0: [
      { type: 'input_value', name: 'TEXT' },
      { type: 'input_value', name: 'X' },
      { type: 'input_value', name: 'Y' },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: DRAW,
    tooltip: 'draw_text(chữ, x, y): viết chữ, (x, y) là tâm của chữ.',
  },
  {
    type: 'pq_aug',
    message0: '%1 %2 %3',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'x' },
      {
        type: 'field_dropdown',
        name: 'OP',
        options: [
          ['+=', '+='],
          ['-=', '-='],
        ],
      },
      { type: 'input_value', name: 'VALUE' },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: VARIABLE,
    tooltip: 'x += 2: cộng thêm 2 vào x. x -= 2: bớt đi 2.',
  },
  {
    type: 'pq_global',
    message0: 'dùng biến chung %1',
    args0: [{ type: 'field_input', name: 'NAMES', text: 'y' }],
    previousStatement: null,
    nextStatement: null,
    colour: VARIABLE,
    tooltip: 'global: trong một lệnh tự đặt, muốn đổi biến bên ngoài thì khai báo ở đây.',
  },
  {
    type: 'pq_for',
    message0: 'lặp %1 lần, đếm bằng %2 %3 %4',
    args0: [
      { type: 'input_value', name: 'COUNT' },
      { type: 'field_input', name: 'VAR', text: 'i' },
      { type: 'input_dummy' },
      { type: 'input_statement', name: 'DO' },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: LOOP,
    tooltip: 'for i in range(n): làm các lệnh bên trong n lần, i = 0, 1, 2…',
  },
  {
    type: 'pq_for_range',
    message0: 'lặp %1 từ %2 đến trước %3 %4 %5',
    args0: [
      { type: 'field_input', name: 'VAR', text: 'i' },
      { type: 'input_value', name: 'FROM' },
      { type: 'input_value', name: 'TO' },
      { type: 'input_dummy' },
      { type: 'input_statement', name: 'DO' },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: LOOP,
    tooltip: 'for i in range(a, b): i chạy từ a tới b - 1.',
  },
  {
    type: 'pq_if',
    message0: 'nếu %1 thì %2 %3',
    args0: [
      { type: 'input_value', name: 'COND' },
      { type: 'input_dummy' },
      { type: 'input_statement', name: 'DO' },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: CONDITION,
  },
  {
    type: 'pq_if_else',
    message0: 'nếu %1 thì %2 %3 không thì %4',
    args0: [
      { type: 'input_value', name: 'COND' },
      { type: 'input_dummy' },
      { type: 'input_statement', name: 'DO' },
      { type: 'input_statement', name: 'ELSE' },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: CONDITION,
  },
  {
    type: 'pq_compare',
    message0: '%1 %2 %3',
    args0: [
      { type: 'input_value', name: 'A' },
      {
        type: 'field_dropdown',
        name: 'OP',
        options: [
          ['==', '=='],
          ['!=', '!='],
          ['<', '<'],
          ['<=', '<='],
          ['>', '>'],
          ['>=', '>='],
        ],
      },
      { type: 'input_value', name: 'B' },
    ],
    inputsInline: true,
    output: 'Boolean',
    colour: CONDITION,
  },
  {
    type: 'pq_logic',
    message0: '%1 %2 %3',
    args0: [
      { type: 'input_value', name: 'A' },
      {
        type: 'field_dropdown',
        name: 'OP',
        options: [
          ['và (and)', 'and'],
          ['hoặc (or)', 'or'],
        ],
      },
      { type: 'input_value', name: 'B' },
    ],
    inputsInline: true,
    output: 'Boolean',
    colour: CONDITION,
  },
  {
    type: 'pq_key_pressed',
    message0: 'đang bấm Space / chạm?',
    output: 'Boolean',
    colour: EVENT,
    tooltip: 'key_pressed(): đúng (True) khi bấm Space hoặc chạm màn hình.',
  },
  {
    type: 'pq_random',
    message0: 'số ngẫu nhiên từ %1 đến %2',
    args0: [
      { type: 'input_value', name: 'A' },
      { type: 'input_value', name: 'B' },
    ],
    inputsInline: true,
    output: 'Number',
    colour: VALUE,
  },
  {
    type: 'pq_def',
    message0: 'tự đặt lệnh %1 %2 %3',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'update' },
      { type: 'input_dummy' },
      { type: 'input_statement', name: 'BODY' },
    ],
    // A file is one stack of statements (variables, then def update, then def draw…), so def chains too.
    previousStatement: null,
    nextStatement: null,
    colour: FUNCTION,
    tooltip:
      'def tên(): gom các lệnh lại dưới một cái tên. update() và draw() được gọi mỗi khung hình.',
  },
  {
    type: 'pq_raw_expr',
    message0: '%1',
    args0: [{ type: 'field_input', name: 'CODE', text: '' }],
    output: null,
    colour: RAW,
    tooltip: 'Code chữ: phần này chưa có khối, sửa ở khung Python.',
  },
];

type RawBlock = Block & { code: string; renderLines(): void };

/** "Code chữ": a statement we have no block for, shown line by line and kept exactly (ADR 0003). */
const RAW_BLOCK = {
  init(this: RawBlock) {
    this.code = '';
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(RAW);
    this.setTooltip('Code chữ: phần này chưa có khối, sửa ở khung Python.');
    this.renderLines();
  },
  renderLines(this: RawBlock) {
    for (const input of [...this.inputList]) this.removeInput(input.name);
    // A blank line or a comment is not code to worry about: show it quietly.
    if (this.code.trim() === '') {
      this.setColour(BLANK);
      this.appendDummyInput('L0').appendField(new Blockly.FieldLabelSerializable('dòng trống'));
      return;
    }
    this.setColour(this.code.trimStart().startsWith('#') ? COMMENT : RAW);
    const lines = this.code.split('\n');
    lines.forEach((line, i) => {
      this.appendDummyInput(`L${String(i)}`).appendField(
        new Blockly.FieldLabelSerializable(line.replace(/ /g, ' ')),
      );
    });
  },
  saveExtraState(this: RawBlock) {
    return { code: this.code };
  },
  loadExtraState(this: RawBlock, state: { code?: string }) {
    this.code = state.code ?? '';
    this.renderLines();
  },
};

export const BLOCK_TYPES = [...JSON_DEFS.map((d) => d.type), 'pq_raw'] as const;

let registered = false;

/** Registers PyQuest blocks once. Safe to call from tests and from the page. */
export function registerBlocks(): void {
  if (registered) return;
  Blockly.common.defineBlocksWithJsonArray(JSON_DEFS);
  Blockly.Blocks['pq_raw'] = RAW_BLOCK;
  registered = true;
}

/** The raw block's code, for the generator. */
export function rawCode(block: Block): string {
  return (block as RawBlock).code;
}
