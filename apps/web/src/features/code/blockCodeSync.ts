import { registerBlocks, treeToState, workspaceToPython } from '@pyquest/blocks';
import type { BlockTree } from '@pyquest/runtime';
import * as Blockly from 'blockly/core';

export type SyncError = { line: number | null; messageVi: string };

/**
 * Keeps one Blockly workspace and one Python text in step (ADR 0003).
 * - Blocks edited → regenerate the code (onCode).
 * - Code typed → parse with Python's ast → rebuild the blocks; a syntax error keeps the old blocks.
 * The code text is the source of truth while the child types: fromCode never rewrites it, and while
 * the typed code has not parsed yet (dirty, in flight, or a syntax error) block edits must not
 * overwrite it — fromBlocks() returns null then (review C1).
 */
export class BlockCodeSync {
  /** True while blocks are being rebuilt from code; the page ignores Blockly events then. */
  applying = false;
  private disposed = false;
  /** The code pane has text the blocks do not show yet. */
  private stale = false;
  /** Only the latest parse may touch the workspace. */
  private generation = 0;

  constructor(
    private readonly ws: Blockly.Workspace,
    private readonly parse: (source: string) => Promise<BlockTree>,
    private readonly on: { onCode: (code: string) => void; onError: (e: SyncError | null) => void },
  ) {
    registerBlocks();
  }

  /** The child typed: blocks are behind the code until the next successful parse. */
  markCodeDirty(): void {
    this.stale = true;
  }

  /** True while block edits would overwrite newer typed code. */
  get blocksAreStale(): boolean {
    return this.stale;
  }

  fromBlocks(): string | null {
    if (this.stale) return null;
    this.generation++; // a parse still in flight is now older than the blocks
    const code = workspaceToPython(this.ws);
    this.on.onCode(code);
    return code;
  }

  async fromCode(source: string): Promise<boolean> {
    this.stale = true;
    const mine = ++this.generation;
    const tree = await this.parse(source);
    // The editor may have closed (or React remounted it) while Python was parsing,
    // or a newer parse / block edit superseded this one.
    if (this.disposed || mine !== this.generation) return false;
    if (!tree.ok) {
      this.on.onError({ line: tree.line, messageVi: tree.messageVi });
      return false;
    }
    this.applying = true;
    try {
      Blockly.Events.disable();
      Blockly.serialization.workspaces.load(treeToState(tree.statements), this.ws);
    } finally {
      Blockly.Events.enable();
      this.applying = false;
    }
    this.stale = false;
    this.on.onError(null);
    return true;
  }

  /** Loads saved blocks without touching the code (first paint before Python is ready). */
  loadState(state: object): void {
    this.applying = true;
    try {
      Blockly.Events.disable();
      Blockly.serialization.workspaces.load(state, this.ws);
    } finally {
      Blockly.Events.enable();
      this.applying = false;
    }
  }

  /** Stop touching the workspace: it is being disposed. */
  dispose(): void {
    this.disposed = true;
  }

  usesWorkspace(ws: Blockly.Workspace): boolean {
    return this.ws === ws;
  }

  saveState(): object {
    return Blockly.serialization.workspaces.save(this.ws);
  }
}
