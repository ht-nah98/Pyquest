import Dexie, { type EntityTable } from 'dexie';
import type { LessonState, Profile, ProgressStore, Role } from './store';

type LessonRow = { profileId: string; lessonId: string; state: LessonState };

/** Not crypto.randomUUID: that needs a secure context, and the class opens the app over plain-http LAN. */
function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Local-first store in IndexedDB (ADR 0001). One database per browser, so per child's device. */
export class DexieStore implements ProgressStore {
  private readonly db: Dexie & {
    profiles: EntityTable<Profile, 'id'>;
    lessons: EntityTable<LessonRow, 'profileId'>;
  };

  constructor(name = 'pyquest') {
    this.db = new Dexie(name) as typeof this.db;
    this.db.version(1).stores({ profiles: 'id, role', lessons: '[profileId+lessonId], profileId' });
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
    await this.db.lessons.put({ profileId, lessonId, state });
  }

  async allLessonStates(profileId: string): Promise<Map<string, LessonState>> {
    const rows = await this.db.lessons.where('profileId').equals(profileId).toArray();
    return new Map(rows.map((r) => [r.lessonId, r.state]));
  }
}
