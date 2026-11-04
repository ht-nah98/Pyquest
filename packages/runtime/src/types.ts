/** Which of the child's own calls drew it (index into RunResult.calls); absent at the top level. */
type By = { by?: number };

/** One drawing instruction recorded while the child's program runs. This is what replaces a log. */
export type DrawEvent =
  | ({ t: 'clear'; color: string } & By)
  | ({
      t: 'sprite';
      /** The library picture, e.g. "bird-rong" for draw_image("images/bird-rong.png", …). */
      sprite: string;
      x: number;
      y: number;
      frame: number;
      flip?: true;
    } & By)
  | ({ t: 'rect'; x: number; y: number; w: number; h: number; color: string } & By)
  | ({ t: 'text'; text: string; x: number; y: number; size: number; color: string } & By)
  | ({ t: 'say'; text: string } & By)
  | { t: 'frame' };

/** One call of a function the child wrote (def), for the 📞 calls panel. */
export type Call = {
  id: number;
  /** The call it happened inside, or null at the top level. */
  parent: number | null;
  name: string;
  /** Parameter → value; anything that is not a number, word or True/False is its short repr. */
  args: Record<string, number | string | boolean>;
  /** The line that made the call; null when the game loop called it (update, draw). */
  line: number | null;
};

export type RunError = { line: number | null; messageVi: string; raw: string };

export type RunResult = {
  events: DrawEvent[];
  vars: Record<string, number | string | boolean>;
  error?: RunError;
  stoppedByLimit: boolean;
  /** The child's function calls, at most 300 (script: the whole run; game: one frame). */
  calls: Call[];
  callsTruncated?: true;
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
  /** pq_raw: { code }; pq_call / pq_call_expr: { name, params }; pq_if_chain: { elifs, else }. */
  extraState?:
    { code: string } | { name: string; params: string[] } | { elifs: number; else: boolean };
};

export type BlockTree =
  { ok: true; statements: BlockNode[] } | { ok: false; line: number | null; messageVi: string };
