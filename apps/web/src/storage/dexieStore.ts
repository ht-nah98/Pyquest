import Dexie, { type EntityTable } from 'dexie';
import type { Stamped } from './merge';
import type { LessonState, Profile, ProgressStore, Role } from './store';

/** `at`: when this device last changed the row (ms). Rows written before sync existed have none. */
type LessonRow = { profileId: string; lessonId: string; state: LessonState; at?: number };
/** A lesson changed on this device and not yet sent to the cloud. */
type PendingRow = { profileId: string; lessonId: string };

/** Not crypto.randomUUID: that needs a secure context, and the class opens the app over plain-http LAN. */
function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Local-first store in IndexedDB (ADR 0001). One database per browser, so per child's device. */
export class DexieStore implements ProgressStore {
  private readonly db: Dexie & {
    profiles: EntityTable<Profile, 'id'>;
    lessons: EntityTable<LessonRow, 'profileId'>;
    outbox: EntityTable<PendingRow, 'profileId'>;
  };

  constructor(name = 'pyquest') {
    this.db = new Dexie(name) as typeof this.db;
    this.db.version(1).stores({ profiles: 'id, role', lessons: '[profileId+lessonId], profileId' });
    this.db.version(2).stores({ outbox: '[profileId+lessonId], profileId' });
  }

  listProfiles(): Promise<Profile[]> {
    return this.db.profiles.toArray();
  }

  async createProfile(nickname: string, avatar: string, role: Role): Promise<Profile> {
    const profile: Profile = { id: newId(), nickname: nickname.trim(), avatar, role };
    await this.db.profiles.add(profile);
    return profile;
  }

  async coachProfile(): Promise<Profile> {
    const existing = await this.db.profiles.where('role').equals('coach').first();
    return existing ?? this.createProfile('HLV', '🧑‍🏫', 'coach');
  }

  async getLessonState(profileId: string, lessonId: string): Promise<LessonState | undefined> {
    const row = await this.db.lessons.get({ profileId, lessonId });
    return row?.state;
  }

  async saveLessonState(profileId: string, lessonId: string, state: LessonState): Promise<void> {
    await this.db.lessons.put({ profileId, lessonId, state, at: Date.now() });
  }

  /** The state with its time, for sync. */
  async getRow(profileId: string, lessonId: string): Promise<Stamped | undefined> {
    const row = await this.db.lessons.get({ profileId, lessonId });
    return row === undefined ? undefined : { state: row.state, at: row.at ?? 0 };
  }

  /**
   * The child's own change, queued for the cloud. Its time is always later than the copy it replaces (two saves in
   * one millisecond, a device clock that runs behind), so a merge never takes it for the older one.
   */
  async saveQueued(profileId: string, lessonId: string, state: LessonState): Promise<void> {
    await this.db.transaction('rw', this.db.lessons, this.db.outbox, async () => {
      const row = await this.db.lessons.get({ profileId, lessonId });
      const at = Math.max(Date.now(), (row?.at ?? 0) + 1);
      await this.db.lessons.put({ profileId, lessonId, state, at });
      await this.db.outbox.put({ profileId, lessonId });
    });
  }

  /**
   * Stores a merged copy made from the row read at `readAt` (undefined: there was none); `pending` also queues it.
   * False, and nothing written, when the child changed the row meanwhile.
   */
  async putMerged(
    profileId: string,
    lessonId: string,
    readAt: number | undefined,
    row: Stamped,
    pending: boolean,
  ): Promise<boolean> {
    return this.db.transaction('rw', this.db.lessons, this.db.outbox, async () => {
      const now = await this.db.lessons.get({ profileId, lessonId });
      if ((now === undefined ? undefined : (now.at ?? 0)) !== readAt) return false;
      await this.db.lessons.put({ profileId, lessonId, state: row.state, at: row.at });
      if (pending) await this.db.outbox.put({ profileId, lessonId });
      return true;
    });
  }

  async allLessonStates(profileId: string): Promise<Map<string, LessonState>> {
    const rows = await this.db.lessons.where('profileId').equals(profileId).toArray();
    return new Map(rows.map((r) => [r.lessonId, r.state]));
  }

  async pending(profileId: string): Promise<string[]> {
    const rows = await this.db.outbox.where('profileId').equals(profileId).toArray();
    return rows.map((r) => r.lessonId);
  }

  /**
   * After a sync: store the merged copy and drop the lesson from the queue, but only if the child did not change
   * it meanwhile (its time is still `readAt`); otherwise keep the newer local copy queued for next time.
   */
  async settle(
    profileId: string,
    lessonId: string,
    readAt: number,
    merged: Stamped,
  ): Promise<boolean> {
    return this.db.transaction('rw', this.db.lessons, this.db.outbox, async () => {
      const row = await this.db.lessons.get({ profileId, lessonId });
      if ((row?.at ?? 0) !== readAt) return false;
      await this.db.lessons.put({ profileId, lessonId, state: merged.state, at: merged.at });
      await this.db.outbox.where('[profileId+lessonId]').equals([profileId, lessonId]).delete();
      return true;
    });
  }
}
