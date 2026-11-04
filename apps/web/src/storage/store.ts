import type { StepKind } from '@pyquest/content-schema';

export type Role = 'student' | 'coach';
export type Profile = { id: string; nickname: string; avatar: string; role: Role };

/** Everything we keep about one child in one lesson. No personal data (AGENTS.md §3 rule 8). */
export type LessonState = {
  stepIndex: number;
  slideIndex: number;
  /** The furthest slide reached; a child may jump back to any slide up to here. */
  furthestSlide?: number;
  quizAnswers: Record<string, number>;
  files: Record<string, string>;
  workspace?: object;
  roadmapOrder?: string[];
  done: boolean;
  doneSteps: StepKind[];
};

export const emptyLessonState = (): LessonState => ({
  stepIndex: 0,
  slideIndex: 0,
  quizAnswers: {},
  files: {},
  done: false,
  doneSteps: [],
});

/** The page only talks to storage through this; Supabase will be a second implementation (spec §3). */
export interface ProgressStore {
  listProfiles(): Promise<Profile[]>;
  createProfile(nickname: string, avatar: string, role: Role): Promise<Profile>;
  coachProfile(): Promise<Profile>;
  getLessonState(profileId: string, lessonId: string): Promise<LessonState | undefined>;
  saveLessonState(profileId: string, lessonId: string, state: LessonState): Promise<void>;
  allLessonStates(profileId: string): Promise<Map<string, LessonState>>;
}
