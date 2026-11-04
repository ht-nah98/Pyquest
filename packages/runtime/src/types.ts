/** One drawing instruction recorded while the child's program runs. This is what replaces a log. */
export type DrawEvent =
  | { t: 'clear'; color: string }
  | { t: 'sprite'; sprite: string; x: number; y: number; frame: number; flip?: true }
  | { t: 'rect'; x: number; y: number; w: number; h: number; color: string }
  | { t: 'text'; text: string; x: number; y: number; size: number; color: string }
  | { t: 'say'; text: string }
  | { t: 'frame' };

export type RunError = { line: number | null; messageVi: string; raw: string };

export type RunResult = {
  events: DrawEvent[];
  vars: Record<string, number | string | boolean>;
  error?: RunError;
  stoppedByLimit: boolean;
};

/** The child's project: path → text, e.g. { "main.py": "draw_bird(1, 2)" }. */
export type Files = Record<string, string>;

export type RunOptions = { seed: number; maxEvents: number; maxLines?: number };

export type GameInput = { keys: string[]; tapped: boolean };

export const STAGE_WIDTH = 400;
export const STAGE_HEIGHT = 600;

/** A block as Python's ast saw it; packages/blocks turns it into Blockly JSON. */
export type BlockNode = {
  type: string;
  fields?: Record<string, string | number>;
  inputs?: Record<string, BlockNode>;
  /** Nested statement lists: DO / ELSE / BODY. */
  statements?: Record<string, BlockNode[]>;
  extraState?: { code: string };
};

export type BlockTree =
  { ok: true; statements: BlockNode[] } | { ok: false; line: number | null; messageVi: string };
