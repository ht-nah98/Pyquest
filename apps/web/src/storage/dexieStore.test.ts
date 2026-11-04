import { describe, expect, test } from 'vitest';
import { DexieStore } from './dexieStore';
import { emptyLessonState } from './store';

let n = 0;
const fresh = () => new DexieStore(`pq-test-${String(++n)}`);

describe('DexieStore', () => {
  test('creates profiles and lists them', async () => {
    const store = fresh();
    const a = await store.createProfile('Minh', '🦊', 'student');
    await store.createProfile('Lan', '🐼', 'student');
    const list = await store.listProfiles();
    expect(list.map((p) => p.nickname).sort()).toEqual(['Lan', 'Minh']);
    expect(a.role).toBe('student');
  });

  test('saves and reads back lesson state with files', async () => {
    const store = fresh();
    const p = await store.createProfile('Minh', '🦊', 'student');
    const state = { ...emptyLessonState(), slideIndex: 3, files: { 'main.py': 'draw_bird(1, 2)' } };
    await store.saveLessonState(p.id, 'l01', state);
    expect(await store.getLessonState(p.id, 'l01')).toEqual(state);
    expect(await store.getLessonState(p.id, 'l00')).toBeUndefined();
  });

  test('two profiles never share lesson state', async () => {
    const store = fresh();
    const a = await store.createProfile('A', '🦊', 'student');
    const b = await store.createProfile('B', '🐼', 'student');
    await store.saveLessonState(a.id, 'l01', { ...emptyLessonState(), done: true });
    expect(await store.getLessonState(b.id, 'l01')).toBeUndefined();
    expect((await store.allLessonStates(a.id)).get('l01')?.done).toBe(true);
  });

  test('the coach profile is created once and found again', async () => {
    const store = fresh();
    const one = await store.coachProfile();
    const two = await store.coachProfile();
    expect(one.id).toBe(two.id);
    expect(one.role).toBe('coach');
  });
});
