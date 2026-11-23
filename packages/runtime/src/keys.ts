/** The keys key_pressed("…") knows (ADR 0010). One list for Python, the blocks and the page. */
export const KEYS = ['left', 'right', 'up', 'down', 'space', '1', '2', '3'] as const;

export type KeyName = (typeof KEYS)[number];
