/** Present window ⇄ coach-notes window, same device (BroadcastChannel; nothing leaves the browser). */
type Msg = { kind: 'slide'; lessonId: string; index: number } | { kind: 'hello' };

const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('pq-present');

export const presentChannel = {
  announce(lessonId: string, index: number) {
    channel?.postMessage({ kind: 'slide', lessonId, index } satisfies Msg);
  },
  hello() {
    channel?.postMessage({ kind: 'hello' } satisfies Msg);
  },
  onHello(fn: () => void): () => void {
    const h = (e: MessageEvent<Msg>) => {
      if (e.data.kind === 'hello') fn();
    };
    channel?.addEventListener('message', h);
    return () => channel?.removeEventListener('message', h);
  },
  onSlide(fn: (lessonId: string, index: number) => void): () => void {
    const h = (e: MessageEvent<Msg>) => {
      if (e.data.kind === 'slide') fn(e.data.lessonId, e.data.index);
    };
    channel?.addEventListener('message', h);
    return () => channel?.removeEventListener('message', h);
  },
};
