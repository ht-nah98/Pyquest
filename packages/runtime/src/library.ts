import { PYQUEST_SOURCE } from './pyquest/pyquest.py.ts';

/**
 * The real code of one pyquest name, cut from pyquest.py, for "Xem bên trong" in the 📘 library panel:
 * the library is just a Python file someone else wrote.
 */
export function librarySource(name: string): string | undefined {
  const lines = PYQUEST_SOURCE.split('\n');
  const start = lines.findIndex((l) => l.startsWith(`def ${name}(`) || l.startsWith(`${name} = `));
  if (start < 0) return undefined;
  const first = lines[start] ?? '';
  if (!first.startsWith('def ')) return first;
  let end = start + 1;
  while (end < lines.length && (lines[end] === '' || /^\s/.test(lines[end] ?? ''))) end++;
  return lines.slice(start, end).join('\n').trimEnd();
}
