import { FunctionsHttpError } from '@supabase/supabase-js';
import { cloud } from '../../cloud/client';
import type { LessonState } from '../../storage/store';

export type Student = { id: string; login: string; nickname: string; avatar: string };
export type StudentLesson = { userId: string; lessonId: string; state: LessonState; at: number };

function db() {
  if (cloud === null) throw new Error('no cloud');
  return cloud;
}

/** Every student of the class (RLS: only the coach sees them all). */
export async function listStudents(): Promise<Student[]> {
  const { data, error } = await db()
    .from('profiles')
    .select('id, login, nickname, avatar')
    .eq('role', 'student')
    .order('created_at');
  if (error !== null) throw new Error(error.message);
  return data;
}

/** Lesson progress of the whole class, or of one student. */
export async function lessonsOf(userId?: string): Promise<StudentLesson[]> {
  let q = db().from('lesson_states').select('user_id, lesson_id, state, updated_at');
  if (userId !== undefined) q = q.eq('user_id', userId);
  const { data, error } = await q;
  if (error !== null) throw new Error(error.message);
  return (
    data as { user_id: string; lesson_id: string; state: LessonState; updated_at: string }[]
  ).map((r) => ({
    userId: r.user_id,
    lessonId: r.lesson_id,
    state: r.state,
    at: Date.parse(r.updated_at),
  }));
}

type Action =
  | { action: 'create'; login: string; nickname: string; avatar: string; pin: string }
  | { action: 'setPin'; userId: string; pin: string }
  | { action: 'remove'; userId: string };

/** The coach's account tools, in the students Edge Function. Returns an error in Vietnamese, or null. */
export async function manage(body: Action): Promise<string | null> {
  const reply = await db().functions.invoke<unknown>('students', { body });
  const error: unknown = reply.error;
  if (error === null) return null;
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response;
    try {
      const j = (await res.json()) as { message?: string; error?: string };
      return j.message ?? `Lỗi: ${j.error ?? String(res.status)}`;
    } catch {
      return `Lỗi ${String(res.status)}`;
    }
  }
  return 'Chưa có mạng, thử lại nhé.';
}
