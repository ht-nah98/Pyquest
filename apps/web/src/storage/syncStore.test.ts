import { describe, expect, test } from 'vitest';
import { DexieStore } from './dexieStore';
import type { Stamped } from './merge';
import { emptyLessonState, type Profile } from './store';
import { SyncStore, type Remote } from './syncStore';

let n = 0;
const me: Profile = { id: 'u1', nickname: 'Minh', avatar: '🦊', role: 'student' };

/** A cloud in memory; `down` makes every call fail like a lost Wi-Fi. */
function fakeCloud() {
  const rows = new Map<string, Stamped>();
  const cloud = {
    rows,
    down: false,
    async pull(userId: string) {
      await Promise.resolve();
      if (cloud.down) throw new Error('offline');
      return [...rows]
        .filter(([k]) => k.startsWith(`${userId}/`))
        .map(([k, v]) => ({ lessonId: k.split('/')[1] ?? '', ...v }));
    },
    async get(userId: string, lessonId: string) {
      await Promise.resolve();
      if (cloud.down) throw new Error('offline');
      return rows.get(`${userId}/${lessonId}`);
    },
    async put(userId: string, lessonId: string, row: Stamped) {
      await Promise.resolve();
      if (cloud.down) throw new Error('offline');
      rows.set(`${userId}/${lessonId}`, row);
    },
  };
  return cloud satisfies Remote & { rows: unknown; down: boolean };
}

const setup = () => {
  const local = new DexieStore(`pq-sync-${String(++n)}`);
  const cloud = fakeCloud();
  return { local, cloud, store: new SyncStore(local, cloud, me, { delayMs: 0 }) };
};

describe('SyncStore', () => {
  test('a save is on this device at once and in the cloud after a flush', async () => {
    const { store, cloud } = setup();
    await store.saveLessonState('u1', 'l01', { ...emptyLessonState(), slideIndex: 4 });
    expect((await store.getLessonState('u1', 'l01'))?.slideIndex).toBe(4);
    await store.flush();
    expect(cloud.rows.get('u1/l01')?.state.slideIndex).toBe(4);
    expect(store.status()).toBe('synced');
  });

  test('offline: the save waits in the queue, then goes when the network is back', async () => {
    const { store, cloud, local } = setup();
    cloud.down = true;
    await store.saveLessonState('u1', 'l02', { ...emptyLessonState(), exercisesDone: ['e1'] });
    await store.flush();
    expect(store.status()).toBe('offline');
    expect(await local.pending('u1')).toEqual(['l02']);
    cloud.down = false;
    await store.flush();
    expect(cloud.rows.get('u1/l02')?.state.exercisesDone).toEqual(['e1']);
    expect(await local.pending('u1')).toEqual([]);
  });

  test('start() on a new device brings the child’s lessons down', async () => {
    const { store, cloud } = setup();
    cloud.rows.set('u1/l03', { state: { ...emptyLessonState(), slideIndex: 7 }, at: 50 });
    cloud.rows.set('u2/l03', { state: { ...emptyLessonState(), slideIndex: 1 }, at: 50 });
    await store.start();
    expect((await store.getLessonState('u1', 'l03'))?.slideIndex).toBe(7);
    expect((await store.allLessonStates('u1')).size).toBe(1);
  });

  test('two devices: the cloud keeps both devices’ done exercises', async () => {
    const { store, cloud } = setup();
    cloud.rows.set('u1/l04', { state: { ...emptyLessonState(), exercisesDone: ['e1'] }, at: 1 });
    await store.saveLessonState('u1', 'l04', { ...emptyLessonState(), exercisesDone: ['e2'] });
    await store.flush();
    expect([...(cloud.rows.get('u1/l04')?.state.exercisesDone ?? [])].sort()).toEqual(['e1', 'e2']);
    expect([...((await store.getLessonState('u1', 'l04'))?.exercisesDone ?? [])].sort()).toEqual([
      'e1',
      'e2',
    ]);
  });

  test('another profile id is refused: a device only syncs the signed-in child', async () => {
    const { store } = setup();
    await expect(store.saveLessonState('u2', 'l01', emptyLessonState())).rejects.toThrow();
  });
});
