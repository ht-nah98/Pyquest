import type { BlockNode } from '@pyquest/runtime';

type StateBlock = {
  type: string;
  fields?: Record<string, string | number>;
  inputs?: Record<string, { block: StateBlock }>;
  extraState?: { code: string };
  next?: { block: StateBlock };
  x?: number;
  y?: number;
};

function toStateBlock(node: BlockNode): StateBlock {
  const out: StateBlock = { type: node.type };
  if (node.fields !== undefined) out.fields = node.fields;
  if (node.extraState !== undefined) out.extraState = node.extraState;
  if (node.inputs !== undefined) {
    out.inputs = Object.fromEntries(
      Object.entries(node.inputs).map(([name, child]) => [name, { block: toStateBlock(child) }]),
    );
  }
  return out;
}

/** Chains the statements into one stack, in Blockly's JSON serialization format. */
export function treeToState(statements: readonly BlockNode[]): object {
  let head: StateBlock | undefined;
  for (let i = statements.length - 1; i >= 0; i--) {
    const node = statements[i];
    if (node === undefined) continue;
    const block = toStateBlock(node);
    if (head !== undefined) block.next = { block: head };
    head = block;
  }
  if (head !== undefined) {
    head.x = 20;
    head.y = 20;
  }
  return { blocks: { languageVersion: 0, blocks: head === undefined ? [] : [head] } };
}
