import type { SupabaseClient } from '@supabase/supabase-js';
import type { Stamped } from '../storage/merge';
import type { LessonState } from '../storage/store';
import type { Remote } from '../storage/syncStore';

type Row = { lesson_id: string; state: LessonState; updated_at: string };

/** lesson_states in Supabase. RLS lets a child read and write only their own rows. */
export function supabaseRemote(db: SupabaseClient): Remote {
  const stamp = (r: Row): Stamped => ({ state: r.state, at: Date.parse(r.updated_at) });
  return {
    async pull(userId) {
      const { data, error } = await db
        .from('lesson_states')
        .select('lesson_id, state, updated_at')
        .eq('user_id', userId);
      if (error !== null) throw new Error(error.message);
      return ((data as Row[] | null) ?? []).map((r) => ({ lessonId: r.lesson_id, ...stamp(r) }));
    },
    async get(userId, lessonId) {
      const { data, error } = await db
        .from('lesson_states')
        .select('lesson_id, state, updated_at')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .maybeSingle();
      if (error !== null) throw new Error(error.message);
      return data === null ? undefined : stamp(data);
    },
    async put(userId, lessonId, row) {
      const { error } = await db.from('lesson_states').upsert({
        user_id: userId,
        lesson_id: lessonId,
        state: row.state,
        updated_at: new Date(row.at).toISOString(),
      });
      if (error !== null) throw new Error(error.message);
    },
  };
}
