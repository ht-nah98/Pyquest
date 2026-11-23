import { PYQUEST_SOURCE } from './pyquest/pyquest.py.ts';
import type { StageSize } from './types';

/**
 * The real code of one pyquest name, cut from pyquest.py, for "Xem bên trong" in the 📘 library panel:
 * the library is just a Python file someone else wrote.
 * stage: the course's stage, so WIDTH / HEIGHT show the numbers the child's code really gets (ADR 0009);
 * without it they show the file's own line (400 × 600).
 */
export function librarySource(name: string, stage?: StageSize): string | undefined {
  if (stage !== undefined && name === 'WIDTH') return `WIDTH = ${String(stage.width)}`;
  if (stage !== undefined && name === 'HEIGHT') return `HEIGHT = ${String(stage.height)}`;
  const lines = PYQUEST_SOURCE.split('\n');
  const start = lines.findIndex((l) => l.startsWith(`def ${name}(`) || l.startsWith(`${name} = `));
  if (start < 0) return undefined;
  const first = lines[start] ?? '';
  if (!first.startsWith('def ')) return first;
  let end = start + 1;
  while (end < lines.length && (lines[end] === '' || /^\s/.test(lines[end] ?? ''))) end++;
  return lines.slice(start, end).join('\n').trimEnd();
}
