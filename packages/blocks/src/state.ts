import type { BlockNode } from '@pyquest/runtime';

type StateBlock = {
  type: string;
  fields?: Record<string, string | number>;
  inputs?: Record<string, { block: StateBlock }>;
  extraState?: BlockNode['extraState'];
  next?: { block: StateBlock };
  x?: number;
  y?: number;
};

function chain(nodes: readonly BlockNode[]): StateBlock | undefined {
  let head: StateBlock | undefined;
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (node === undefined) continue;
    const block = toStateBlock(node);
    if (head !== undefined) block.next = { block: head };
    head = block;
  }
  return head;
}

function toStateBlock(node: BlockNode): StateBlock {
  const out: StateBlock = { type: node.type };
  if (node.fields !== undefined) out.fields = node.fields;
  if (node.extraState !== undefined) out.extraState = node.extraState;
  const inputs: Record<string, { block: StateBlock }> = {};
  for (const [name, child] of Object.entries(node.inputs ?? {}))
    inputs[name] = { block: toStateBlock(child) };
  for (const [name, list] of Object.entries(node.statements ?? {})) {
    const head = chain(list);
    if (head !== undefined) inputs[name] = { block: head };
  }
  if (Object.keys(inputs).length > 0) out.inputs = inputs;
  return out;
}

/** Chains the statements into one stack, in Blockly's JSON serialization format. */
export function treeToState(statements: readonly BlockNode[]): object {
  const head = chain(statements);
  if (head !== undefined) {
    head.x = 20;
    head.y = 20;
  }
  return { blocks: { languageVersion: 0, blocks: head === undefined ? [] : [head] } };
}
