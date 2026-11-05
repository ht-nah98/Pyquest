import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = (import.meta.env['VITE_SUPABASE_URL'] as string | undefined) ?? '';
const key = (import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined) ?? '';

/**
 * The Supabase client, or null when the app runs without accounts (dev, e2e, a class with no Internet):
 * then profiles live on the device as before (spec 2026-11-05 §6).
 */
export const cloud: SupabaseClient | null =
  url !== '' && key !== '' ? createClient(url, key) : null;

/** Students log in with a name the coach chose; Supabase Auth needs an e-mail, so it gets one that sends nothing. */
export const STUDENT_DOMAIN = 'hs.pyquest.invalid';
export const studentEmail = (login: string) => `${login.trim().toLowerCase()}@${STUDENT_DOMAIN}`;
