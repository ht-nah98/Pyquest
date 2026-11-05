import type { DexieStore } from './dexieStore';
import { mergeLessonState, type Stamped } from './merge';
import type { LessonState, Profile, ProgressStore } from './store';

/** The cloud side of sync (Supabase in the app, a map in tests). */
export interface Remote {
  pull(userId: string): Promise<({ lessonId: string } & Stamped)[]>;
  get(userId: string, lessonId: string): Promise<Stamped | undefined>;
  put(userId: string, lessonId: string, row: Stamped): Promise<void>;
}

/** ☁️ everything sent · ⏳ waiting to send · 📴 no network, kept on this device · ⚠️ the cloud refused. */
export type SyncStatus = 'synced' | 'pending' | 'offline' | 'error';

/**
 * Local-first progress for the signed-in child (spec 2026-11-05 §4): every save lands in IndexedDB at once
 * and is queued; the queue goes to the cloud when there is a network. Two devices merge, never lose a ✓.
 */
export class SyncStore implements ProgressStore {
  private state: SyncStatus = 'synced';
  private timer: ReturnType<typeof setTimeout> | undefined;
  private running: Promise<void> | null = null;
  private again = false;
  private readonly listeners = new Set<(s: SyncStatus) => void>();
  private readonly delayMs: number;

  constructor(
    private readonly local: DexieStore,
    private readonly remote: Remote,
    private readonly me: Profile,
    opts: { delayMs?: number } = {},
  ) {
    this.delayMs = opts.delayMs ?? 1500;
  }

  status(): SyncStatus {
    return this.state;
  }

  onStatus(fn: (s: SyncStatus) => void): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private set(s: SyncStatus) {
    if (s === this.state) return;
    this.state = s;
    for (const fn of this.listeners) fn(s);
  }

  private mine(profileId: string) {
    if (profileId !== this.me.id) throw new Error('this device syncs only the signed-in child');
  }

  listProfiles(): Promise<Profile[]> {
    return Promise.resolve([this.me]);
  }

  createProfile(): Promise<Profile> {
    return Promise.reject(new Error('accounts are made by the coach'));
  }

  coachProfile(): Promise<Profile> {
    return Promise.resolve(this.me);
  }

  getLessonState(profileId: string, lessonId: string): Promise<LessonState | undefined> {
    return this.local.getLessonState(profileId, lessonId);
  }

  allLessonStates(profileId: string): Promise<Map<string, LessonState>> {
    return this.local.allLessonStates(profileId);
  }

  async saveLessonState(profileId: string, lessonId: string, state: LessonState): Promise<void> {
    this.mine(profileId);
    await this.local.putRow(profileId, lessonId, { state, at: Date.now() }, true);
    if (this.state === 'synced') this.set('pending');
    this.schedule();
  }

  /** Send the queue soon (saves come in bursts while the child types). */
  schedule(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), this.delayMs);
  }

  /** Bring the child's lessons down (a new device), merge them in, then send what this device has. */
  async start(): Promise<void> {
    try {
      const rows = await this.remote.pull(this.me.id);
      for (const r of rows) {
        const mine = await this.local.getRow(this.me.id, r.lessonId);
        const merged = mergeLessonState(mine, { state: r.state, at: r.at });
        // Something this device had that the cloud lacks: queue it, flush sends it.
        const changed =
          mine !== undefined && JSON.stringify(merged.state) !== JSON.stringify(r.state);
        if (mine === undefined || mine.at !== merged.at || changed) {
          await this.local.putRow(this.me.id, r.lessonId, merged, changed);
        }
      }
    } catch {
      this.set('offline');
      return;
    }
    await this.flush();
  }

  /** Send every queued lesson. One flush at a time; a call during a flush runs once more after it. */
  flush(): Promise<void> {
    if (this.running !== null) {
      this.again = true;
      return this.running;
    }
    this.running = this.send().finally(() => {
      this.running = null;
      if (this.again) {
        this.again = false;
        void this.flush();
      }
    });
    return this.running;
  }

  private async send(): Promise<void> {
    clearTimeout(this.timer);
    const queue = await this.local.pending(this.me.id);
    if (queue.length === 0) {
      this.set('synced');
      return;
    }
    this.set('pending');
    for (const lessonId of queue) {
      const mine = await this.local.getRow(this.me.id, lessonId);
      if (mine === undefined) continue;
      let merged: Stamped;
      try {
        merged = mergeLessonState(mine, await this.remote.get(this.me.id, lessonId));
        await this.remote.put(this.me.id, lessonId, merged);
      } catch (e) {
        this.set(isOffline(e) ? 'offline' : 'error');
        return;
      }
      await this.local.settle(this.me.id, lessonId, mine.at, merged);
    }
    const left = await this.local.pending(this.me.id);
    this.set(left.length === 0 ? 'synced' : 'pending');
    if (left.length > 0) this.schedule();
  }
}

/** A fetch that never reached the server (no Wi-Fi) rather than a server that said no. */
export function isOffline(e: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  const msg = e instanceof Error ? e.message : String(e);
  return /offline|failed to fetch|network|load failed/i.test(msg);
}
