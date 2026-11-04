import { registerBlocks, treeToState, workspaceToPython } from '@pyquest/blocks';
import type { BlockTree } from '@pyquest/runtime';
import * as Blockly from 'blockly/core';

export type SyncError = { line: number | null; messageVi: string };

/**
 * Keeps one Blockly workspace and one Python text in step (ADR 0003).
 * - Blocks edited → regenerate the code (onCode).
 * - Code typed → parse with Python's ast → rebuild the blocks; a syntax error keeps the old blocks.
 * The code text is the source of truth while the child types: fromCode never rewrites it.
 */
export class BlockCodeSync {
  /** True while blocks are being rebuilt from code; the page ignores Blockly events then. */
  applying = false;
  private disposed = false;

  constructor(
    private readonly ws: Blockly.Workspace,
    private readonly parse: (source: string) => Promise<BlockTree>,
    private readonly on: { onCode: (code: string) => void; onError: (e: SyncError | null) => void },
  ) {
    registerBlocks();
  }

  fromBlocks(): string {
    const code = workspaceToPython(this.ws);
    this.on.onCode(code);
    return code;
  }

  async fromCode(source: string): Promise<boolean> {
    const tree = await this.parse(source);
    // The editor may have closed (or React remounted it) while Python was parsing.
    if (this.disposed) return false;
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
