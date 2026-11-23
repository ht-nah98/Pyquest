import { describe, expect, test } from 'vitest';
import { DexieStore } from '../../storage/dexieStore';
import { emptyLessonState } from '../../storage/store';
import { currentLesson } from '../coach/summary';
import { lessonStatus } from '../course/progress';
import {
  cleanTitle,
  createDrawing,
  deleteDrawing,
  drawingsOf,
  MAX_DRAWINGS,
  nextTitle,
  pngName,
  renameDrawing,
  rowOf,
} from './drawings';

let n = 0;
const fresh = () => new DexieStore(`pq-studio-test-${String(++n)}`);
const STARTER = 'from pyquest import *\n';

describe('drawings in the progress store', () => {
  test('a new drawing is a studio: row with the starter code and the next free name', async () => {
    const store = fresh();
    const p = await store.createProfile('Minh', '🦊', 'student');
    const id = await createDrawing(store, p.id, STARTER, 1000);
    expect(id).not.toBeNull();
    const row = rowOf(id ?? '');
    expect(row.length).toBeLessThanOrEqual(40);
    const state = await store.getLessonState(p.id, row);
    expect(state?.files['main.py']).toBe(STARTER);
    expect(state?.studio).toEqual({ title: 'Tranh 1', createdAt: 1000, changedAt: 1000 });
    await createDrawing(store, p.id, STARTER, 2000);
    const list = drawingsOf(await store.allLessonStates(p.id));
    expect(list.map((d) => d.title)).toEqual(['Tranh 2', 'Tranh 1']);
  });

  test('rename and delete; a deleted drawing leaves a tombstone without code', async () => {
    const store = fresh();
    const p = await store.createProfile('Minh', '🦊', 'student');
    const id = (await createDrawing(store, p.id, STARTER, 1000)) ?? '';
    await renameDrawing(store, p.id, id, '  Ngôi   nhà  ', 3000);
    let list = drawingsOf(await store.allLessonStates(p.id));
    expect(list).toEqual([{ id, title: 'Ngôi nhà', createdAt: 1000, changedAt: 3000 }]);
    await renameDrawing(store, p.id, id, '   ', 4000);
    list = drawingsOf(await store.allLessonStates(p.id));
    expect(list[0]?.title).toBe('Ngôi nhà');
    await deleteDrawing(store, p.id, id, 5000);
    expect(drawingsOf(await store.allLessonStates(p.id))).toEqual([]);
    const gone = await store.getLessonState(p.id, rowOf(id));
    expect(gone?.studio?.deleted).toBe(true);
    expect(gone?.files).toEqual({});
  });

  test(`at most ${String(MAX_DRAWINGS)} drawings; deleting one makes room`, async () => {
    const store = fresh();
    const p = await store.createProfile('Minh', '🦊', 'student');
    let last = '';
    for (let i = 0; i < MAX_DRAWINGS; i++)
      last = (await createDrawing(store, p.id, STARTER, i)) ?? '';
    expect(await createDrawing(store, p.id, STARTER, 99)).toBeNull();
    await deleteDrawing(store, p.id, last);
    expect(await createDrawing(store, p.id, STARTER, 100)).not.toBeNull();
  });

  test('studio rows do not change course progress or the coach summary', () => {
    const lessons = [{ id: 'l00', courseId: 'c', order: 0, title: 'A', hidden: true as const }];
    const states = new Map([
      [rowOf('x'), { ...emptyLessonState(), done: true, studio: { title: 'T', createdAt: 1 } }],
    ]);
    expect(lessonStatus(lessons, rowOf('x'), states, 'student')).toBe('hidden');
    expect(currentLesson(lessons, states)?.id).toBe('l00');
  });
});

describe('names', () => {
  test('cleanTitle trims, shortens and never returns empty', () => {
    expect(cleanTitle('  a   b ')).toBe('a b');
    expect(cleanTitle('x'.repeat(60))).toHaveLength(40);
    expect(cleanTitle('', 'Tranh 3')).toBe('Tranh 3');
  });

  test('nextTitle skips names in use', () => {
    const d = (title: string) => ({ id: title, title, createdAt: 0, changedAt: 0 });
    expect(nextTitle([])).toBe('Tranh 1');
    expect(nextTitle([d('Tranh 2')])).toBe('Tranh 3');
    expect(nextTitle([d('Mây')])).toBe('Tranh 2');
  });

  test('pngName is ASCII, from the title', () => {
    expect(pngName('Ngôi nhà đẹp!')).toBe('ngoi-nha-dep.png');
    expect(pngName('Đèn lồng Hội An')).toBe('den-long-hoi-an.png');
    expect(pngName('🎨🎨')).toBe('tranh.png');
  });
});
