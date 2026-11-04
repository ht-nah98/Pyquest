import { describe, expect, test } from 'vitest';
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
