import { describe, expect, test, vi } from 'vitest';
import { PyClient } from './client';

type Listener = ((e: MessageEvent) => void) | null;

class FakeWorker {
  onmessage: Listener = null;
  onerror: ((e: Event) => void) | null = null;
  terminated = false;
  sent: unknown[] = [];
  postMessage(msg: unknown) {
    this.sent.push(msg);
  }
  terminate() {
    this.terminated = true;
  }
  reply(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

function client() {
  const made: FakeWorker[] = [];
  const c = new PyClient(() => {
    const w = new FakeWorker();
    made.push(w);
    return w as unknown as Worker;
  });
  return { c, made };
}

describe('PyClient', () => {
  test('a failed load can be retried with a fresh worker', async () => {
    const { c, made } = client();
    const first = c.warmUp();
    made[0]!.reply({ kind: 'failed', message: 'boom' });
    await expect(first).rejects.toThrow('boom');
    expect(c.status).toBe('failed');
    expect(made[0]!.terminated).toBe(true);
    const second = c.warmUp();
    expect(made).toHaveLength(2);
    made[1]!.reply({ kind: 'ready' });
    await second;
    expect(c.status).toBe('ready');
  });

  test('a worker script that cannot load fails instead of loading forever', async () => {
    const { c, made } = client();
    const p = c.warmUp();
    made[0]!.onerror?.(new Event('error'));
    await expect(p).rejects.toThrow();
    expect(c.status).toBe('failed');
  });

  test('a worker that dies while running is replaced: its calls fail, the next run works', async () => {
    const { c, made } = client();
    const ready = c.warmUp();
    made[0]!.reply({ kind: 'ready' });
    await ready;
    const run = c.run({ 'main.py': '' }, 'main.py');
    await vi.waitFor(() => {
      expect(made[0]!.sent).toHaveLength(1);
    });
    made[0]!.onerror?.(new Event('error')); // out of memory
    await expect(run).rejects.toThrow();
    expect(made[0]!.terminated).toBe(true);
    expect(c.hasPending).toBe(false);
    // A fresh one is already loading, so ▶ comes back by itself.
    expect(made).toHaveLength(2);
    expect(c.status).toBe('loading');
    made[1]!.reply({ kind: 'ready' });
    const again = c.run({ 'main.py': '' }, 'main.py');
    await vi.waitFor(() => {
      expect(made[1]!.sent).toHaveLength(1);
    });
    const id = (made[1]!.sent[0] as { id: number }).id;
    made[1]!.reply({ id, ok: true, result: { events: [], vars: {}, stoppedByLimit: false } });
    await again;
    expect(c.status).toBe('ready');
  });

  test('Python that failed by itself (a wasm crash) is not used again', async () => {
    const { c, made } = client();
    const ready = c.warmUp();
    made[0]!.reply({ kind: 'ready' });
    await ready;
    const run = c.run({ 'main.py': '' }, 'main.py');
    await vi.waitFor(() => {
      expect(made[0]!.sent).toHaveLength(1);
    });
    const id = (made[0]!.sent[0] as { id: number }).id;
    made[0]!.reply({ id, ok: false, message: 'Maximum call stack size exceeded' });
    await expect(run).rejects.toThrow();
    expect(made[0]!.terminated).toBe(true);
    expect(made).toHaveLength(2);
    made[1]!.reply({ kind: 'ready' });
    expect(c.status).toBe('ready');
  });

  test('a game does not go on in the fresh worker, which never started it', async () => {
    const { c, made } = client();
    const ready = c.warmUp();
    made[0]!.reply({ kind: 'ready' });
    await ready;
    const answer = async (w: FakeWorker) => {
      await vi.waitFor(() => {
        expect(w.sent.length).toBeGreaterThan(0);
      });
      const { id } = w.sent.shift() as { id: number };
      w.reply({ id, ok: true, result: { events: [], vars: {}, stoppedByLimit: false } });
    };
    const start = c.startGame({ 'main.py': '' }, 'main.py');
    await answer(made[0]!);
    await start;
    const step = c.step({ keys: [], tapped: false });
    await answer(made[0]!);
    await step;
    made[0]!.onerror?.(new Event('error')); // between two steps: nothing was in flight
    made[1]!.reply({ kind: 'ready' });
    await expect(c.step({ keys: [], tapped: false })).rejects.toThrow();
    expect(made[1]!.sent).toEqual([]);
    const again = c.startGame({ 'main.py': '' }, 'main.py');
    await answer(made[1]!);
    await again;
  });

  test('a fresh worker that cannot load is not tried for ever', async () => {
    const { c, made } = client();
    const ready = c.warmUp();
    made[0]!.reply({ kind: 'ready' });
    await ready;
    made[0]!.onerror?.(new Event('error'));
    made[1]!.onerror?.(new Event('error'));
    expect(made).toHaveLength(2);
    expect(c.status).toBe('failed'); // the "Thử lại" button
  });

  test('hasPending is true only while a call is in flight', async () => {
    const { c, made } = client();
    const ready = c.warmUp();
    made[0]!.reply({ kind: 'ready' });
    await ready;
    expect(c.hasPending).toBe(false);
    const run = c.run({ 'main.py': '' }, 'main.py');
    await Promise.resolve();
    await Promise.resolve();
    expect(c.hasPending).toBe(true);
    const id = (made[0]!.sent[0] as { id: number }).id;
    made[0]!.reply({ id, ok: true, result: { events: [], vars: {}, stoppedByLimit: false } });
    await run;
    expect(c.hasPending).toBe(false);
  });
});
