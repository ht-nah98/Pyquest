import type { GameInput } from '@pyquest/runtime';

export type StagePoint = { x: number; y: number };

/**
 * What the player does between two frames, on every game screen: keys held, presses, the pointer.
 * No DOM here: useGameKeys and useGameLoop feed it, and each step takes one GameInput from it.
 */
export class GameInputs {
  /** The keys down now: the physical key → its name (→ and D are two keys for "right"). */
  private held = new Map<string, string>();
  /** Fingers or mouse buttons on the stage now; any of them counts as Space held. */
  private pressing = new Set<number>();
  /** Pressed since the last step: a press shorter than a frame still counts for one frame. */
  private fresh = new Set<string>();
  private pointer: StagePoint | null = null;
  private clicked = false;

  /** by: the physical key. repeat: it was down before (a new game, the window back): held, but not pressed now. */
  key(name: string, down: boolean, by = name, repeat = false): void {
    if (down) {
      this.held.set(by, name);
      if (!repeat) this.fresh.add(name);
    } else this.held.delete(by);
  }

  /** point: null in the bars beside the picture, where the last known place stays. */
  pointerMove(point: StagePoint | null): void {
    if (point !== null) this.pointer = point;
  }

  /** A press anywhere on the play area flaps; only one on the picture is a click. */
  pointerDown(id: number, point: StagePoint | null): void {
    this.pointerMove(point);
    this.pressing.add(id);
    this.fresh.add('space');
    if (point !== null) this.clicked = true;
  }

  pointerUp(id: number): void {
    this.pressing.delete(id);
  }

  /** The window lost focus: the key-up events will never come. */
  releaseAll(): void {
    this.held.clear();
    this.pressing.clear();
  }

  /** A new game starts: nothing pressed before it counts. */
  reset(): void {
    this.releaseAll();
    this.fresh.clear();
    this.clicked = false;
  }

  /** The input of one step; presses are used up. */
  take(): GameInput {
    const keys = new Set([...this.held.values(), ...this.fresh]);
    if (this.pressing.size > 0) keys.add('space');
    const input: GameInput = {
      keys: [...keys],
      tapped: this.fresh.has('space'),
      clicked: this.clicked,
      ...(this.pointer === null ? {} : { pointer: this.pointer }),
    };
    this.fresh.clear();
    this.clicked = false;
    return input;
  }
}
