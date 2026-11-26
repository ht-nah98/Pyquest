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
      /** Times the picture's game size; absent = 1 (ADR 0010). */
      scale?: number;
      /** Left and right swapped; absent = as drawn. */
      mirror?: true;
    } & By)
  /** color 'none' (color=None): only the outline; border: an outline 3 thick in that colour (ADR 0013). */
  | ({ t: 'rect'; x: number; y: number; w: number; h: number; color: string; border?: string } & By)
  | ({ t: 'text'; text: string; x: number; y: number; size: number; color: string } & By)
  /** draw_circle(x, y, r, color): a filled circle, (x, y) is its centre. */
  | ({ t: 'circle'; x: number; y: number; r: number; color: string; border?: string } & By)
  /** draw_ellipse(x, y, w, h, color): an oval, (x, y) is its centre (ADR 0013). */
  | ({
      t: 'ellipse';
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      border?: string;
    } & By)
  /** draw_arc(x, y, r, start, end, color, width): part of a circle's edge; degrees, 0 right, clockwise. */
  | ({
      t: 'arc';
      x: number;
      y: number;
      r: number;
      start: number;
      end: number;
      color: string;
      width: number;
    } & By)
  /** draw_line(x1, y1, x2, y2, color, width): a straight line with round ends. */
  | ({
      t: 'line';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      width: number;
    } & By)
  /** draw_triangle / draw_polygon: a filled shape through these corners, in order. */
  | ({ t: 'polygon'; points: [number, number][]; color: string; border?: string } & By)
  | ({ t: 'say'; text: string } & By)
  /** play_sound: a short 8-bit sound, once. */
  | ({ t: 'sound'; name: string } & By)
  /** play_music: a looping tune; name null is stop_music(). */
  | ({ t: 'music'; name: string | null } & By)
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

/** The stage in stage units (pixels of the picture), origin top-left, y down. Set per course. */
export type StageSize = { width: number; height: number };

/** Bay Qua Khe's stage, and every course that does not say otherwise. */
export const DEFAULT_STAGE: StageSize = { width: 400, height: 600 };

/** stage: what WIDTH / HEIGHT are in the child's Python; DEFAULT_STAGE when absent. */
export type RunOptions = { seed: number; maxEvents: number; maxLines?: number; stage?: StageSize };

export type GameInput = {
  keys: string[];
  /** Space or a tap since the last frame. */
  tapped: boolean;
  /** Where the mouse or finger last was, in stage units; absent = nowhere yet (0, 0 in Python). */
  pointer?: { x: number; y: number };
  /** The stage was pressed since the last frame. */
  clicked?: boolean;
};

/** @deprecated Use the course's StageSize (DEFAULT_STAGE when a course sets none). */
export const STAGE_WIDTH = DEFAULT_STAGE.width;
/** @deprecated Use the course's StageSize (DEFAULT_STAGE when a course sets none). */
export const STAGE_HEIGHT = DEFAULT_STAGE.height;

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
