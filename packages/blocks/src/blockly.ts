import * as core from 'blockly/core';
import * as python from 'blockly/python';

// Node (tsx, content:check) loads Blockly's CommonJS build, where the namespace sits on .default;
// Vite and Vitest hand over the namespace itself. One place makes both work.
const unwrap = <T>(ns: T): T => (ns as { default?: T }).default ?? ns;

export const Blockly = unwrap(core);
export const { pythonGenerator, Order } = unwrap(python);
export type { Block, Workspace } from 'blockly/core';
