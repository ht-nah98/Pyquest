// The coach's account tools: add a student, set a new PIN, remove a student.
// Runs inside Supabase with the service role key, which never leaves Supabase (spec §2).
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const DOMAIN = 'hs.pyquest.invalid';
const LOGIN = /^[a-z0-9_]{2,20}$/;
const PIN = /^\d{6}$/;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

type Body =
  | { action: 'create'; login: string; nickname: string; avatar: string; pin: string }
  | { action: 'setPin'; userId: string; pin: string }
  | { action: 'remove'; userId: string };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'method' });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  // Only the coach may call this.
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
  const { data: who } = await admin.auth.getUser(token);
  if (who.user === null) return reply(401, { error: 'login' });
  const { data: me } = await admin.from('profiles').select('role').eq('id', who.user.id).single();
  if (me?.role !== 'coach') return reply(403, { error: 'coach only' });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return reply(400, { error: 'json' });
  }

  if (body.action === 'create') {
    const login = String(body.login ?? '')
      .trim()
      .toLowerCase();
    const nickname = String(body.nickname ?? '').trim();
    const avatar = String(body.avatar ?? '🐣');
    if (!LOGIN.test(login))
      return reply(400, {
        error: 'login',
        message: 'Tên đăng nhập: 2–20 chữ thường không dấu, số hoặc _',
      });
    if (nickname.length < 1 || nickname.length > 24)
      return reply(400, { error: 'nickname', message: 'Biệt danh 1–24 ký tự' });
    if (!PIN.test(String(body.pin)))
      return reply(400, { error: 'pin', message: 'PIN gồm đúng 6 chữ số' });
    const { data: taken } = await admin
      .from('profiles')
      .select('id')
      .eq('login', login)
      .maybeSingle();
    if (taken !== null) return reply(409, { error: 'taken', message: 'Tên đăng nhập này đã có' });
    const { data, error } = await admin.auth.admin.createUser({
      email: `${login}@${DOMAIN}`,
      password: body.pin,
      email_confirm: true,
    });
    if (error !== null || data.user === null)
      return reply(400, { error: 'auth', message: error?.message });
    const { error: e2 } = await admin
      .from('profiles')
      .insert({ id: data.user.id, login, nickname, avatar, role: 'student' });
    if (e2 !== null) {
      await admin.auth.admin.deleteUser(data.user.id);
      return reply(400, { error: 'profile', message: e2.message });
    }
    return reply(200, { id: data.user.id });
  }

  // setPin and remove only touch student accounts, never the coach.
  const { data: target } = await admin
    .from('profiles')
    .select('role')
    .eq('id', body.userId)
    .maybeSingle();
  if (target?.role !== 'student') return reply(404, { error: 'student' });

  if (body.action === 'setPin') {
    if (!PIN.test(String(body.pin)))
      return reply(400, { error: 'pin', message: 'PIN gồm đúng 6 chữ số' });
    const { error } = await admin.auth.admin.updateUserById(body.userId, { password: body.pin });
    return error === null
      ? reply(200, { ok: true })
      : reply(400, { error: 'auth', message: error.message });
  }
  if (body.action === 'remove') {
    const { error } = await admin.auth.admin.deleteUser(body.userId);
    return error === null
      ? reply(200, { ok: true })
      : reply(400, { error: 'auth', message: error.message });
  }
  return reply(400, { error: 'action' });
});
