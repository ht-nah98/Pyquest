import * as Blockly from 'blockly/core';

/** Block colours by family, so a child links a colour with a kind of command. */
const DRAW = 210;
const VALUE = 160;
const VARIABLE = 330;
const RAW = 60;

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
    type: 'pq_raw_expr',
    message0: '%1',
    args0: [{ type: 'field_input', name: 'CODE', text: '' }],
    output: null,
    colour: RAW,
    tooltip: 'Code chữ: phần này chưa có khối, sửa ở khung Python.',
  },
];

type RawBlock = Blockly.Block & { code: string; renderLines(): void };

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
    const lines = this.code === '' ? [''] : this.code.split('\n');
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
export function rawCode(block: Blockly.Block): string {
  return (block as RawBlock).code;
}
