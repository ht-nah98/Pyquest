import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '../storage/store';
import { studentEmail } from './client';

const CACHE = 'pq-cloud-profile';

type ProfileRow = { id: string; nickname: string; avatar: string; role: Profile['role'] };

function cache(p: Profile | null) {
  try {
    if (p === null) localStorage.removeItem(CACHE);
    else localStorage.setItem(CACHE, JSON.stringify(p));
  } catch {
    /* private window: sign in again next time */
  }
}

function cached(): Profile | null {
  try {
    const raw = localStorage.getItem(CACHE);
    return raw === null ? null : (JSON.parse(raw) as Profile);
  } catch {
    return null;
  }
}

async function profileOf(db: SupabaseClient, userId: string): Promise<Profile> {
  const { data, error } = await db
    .from('profiles')
    .select('id, nickname, avatar, role')
    .eq('id', userId)
    .maybeSingle();
  if (error !== null) throw new Error(error.message);
  if (data === null) throw new Error('no-profile');
  const r: ProfileRow = data;
  const p: Profile = { id: r.id, nickname: r.nickname, avatar: r.avatar, role: r.role };
  cache(p);
  return p;
}

/** The signed-in person on this device. Works offline: the session and the profile are kept in the browser. */
export async function restoreProfile(db: SupabaseClient): Promise<Profile | null> {
  const { data } = await db.auth.getSession();
  const user = data.session?.user;
  if (user === undefined) return null;
  const known = cached();
  if (known !== null && known.id === user.id) {
    void profileOf(db, user.id).catch(() => undefined); // refresh nickname/avatar when online
    return known;
  }
  try {
    return await profileOf(db, user.id);
  } catch {
    return null;
  }
}

/** Why a sign-in failed, in words for a child. */
export type SignInError = 'wrong' | 'offline' | 'no-profile';

async function signIn(
  db: SupabaseClient,
  email: string,
  password: string,
): Promise<Profile | SignInError> {
  try {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error !== null) {
      return /fetch|network/i.test(error.message) ? 'offline' : 'wrong';
    }
    return await profileOf(db, data.user.id);
  } catch (e) {
    if (e instanceof Error && e.message === 'no-profile') {
      await db.auth.signOut();
      return 'no-profile';
    }
    return 'offline';
  }
}

export const signInStudent = (db: SupabaseClient, login: string, pin: string) =>
  signIn(db, studentEmail(login), pin);

export const signInCoach = (db: SupabaseClient, email: string, password: string) =>
  signIn(db, email.trim(), password);

export async function signOut(db: SupabaseClient): Promise<void> {
  cache(null);
  await db.auth.signOut({ scope: 'local' });
}
