import type { BrowserContext, Route } from '@playwright/test';

/** Must match FAKE_SUPABASE in playwright.config.ts. */
export const FAKE = 'https://pq-fake.supabase.co';
const DOMAIN = 'hs.pyquest.invalid';

type User = { id: string; email: string; password: string };
type ProfileRow = {
  id: string;
  login: string | null;
  nickname: string;
  avatar: string;
  role: string;
  created_at: string;
};
type LessonRow = { user_id: string; lesson_id: string; state: unknown; updated_at: string };

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');

/**
 * A small Supabase in memory: Auth (password sign-in), PostgREST for profiles and lesson_states with the same
 * rules as the real RLS, and the students Edge Function. Lets e2e drive accounts and sync without a network.
 */
export class FakeSupabase {
  users: User[] = [];
  profiles: ProfileRow[] = [];
  lessons = new Map<string, LessonRow>();
  private n = 0;

  private id() {
    this.n += 1;
    return `00000000-0000-4000-8000-${String(this.n).padStart(12, '0')}`;
  }

  addCoach(email: string, password: string) {
    const id = this.id();
    this.users.push({ id, email, password });
    this.profiles.push({
      id,
      login: null,
      nickname: 'HLV',
      avatar: '🧑‍🏫',
      role: 'coach',
      created_at: new Date().toISOString(),
    });
  }

  lesson(login: string, lessonId: string): LessonRow | undefined {
    const p = this.profiles.find((x) => x.login === login);
    return p === undefined ? undefined : this.lessons.get(`${p.id}/${lessonId}`);
  }

  private token(u: User) {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: u.id, email: u.email, aud: 'authenticated', role: 'authenticated', exp, session_id: `s-${u.id}` })}.sig`;
    return {
      access_token: jwt,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: exp,
      refresh_token: `rt-${u.id}`,
      user: this.userJson(u),
    };
  }

  private userJson(u: User) {
    return {
      id: u.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: u.email,
      app_metadata: { provider: 'email' },
      user_metadata: {},
      created_at: new Date().toISOString(),
    };
  }

  private caller(route: Route): User | undefined {
    const auth = route.request().headers()['authorization'] ?? '';
    const jwt = auth.replace(/^Bearer /, '');
    const part = jwt.split('.')[1];
    if (part === undefined) return undefined;
    try {
      const { sub } = JSON.parse(Buffer.from(part, 'base64url').toString()) as { sub: string };
      return this.users.find((u) => u.id === sub);
    } catch {
      return undefined;
    }
  }

  private isCoach(u: User | undefined) {
    return u !== undefined && this.profiles.some((p) => p.id === u.id && p.role === 'coach');
  }

  async attach(context: BrowserContext): Promise<void> {
    await context.route(`${FAKE}/**`, (route) => this.handle(route));
  }

  private json(route: Route, status: number, body: unknown, headers: Record<string, string> = {}) {
    return route.fulfill({
      status,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': '*',
        ...headers,
      },
      body: body === undefined ? '' : JSON.stringify(body),
    });
  }

  private async handle(route: Route) {
    const req = route.request();
    const url = new URL(req.url());
    if (req.method() === 'OPTIONS') return this.json(route, 200, undefined);
    const path = url.pathname;

    if (path === '/auth/v1/token') {
      const { email, password } = req.postDataJSON() as { email: string; password: string };
      const u = this.users.find((x) => x.email === email && x.password === password);
      if (u === undefined)
        return this.json(route, 400, {
          code: 'invalid_credentials',
          error_code: 'invalid_credentials',
          msg: 'Invalid login credentials',
        });
      return this.json(route, 200, this.token(u));
    }
    if (path === '/auth/v1/user') {
      const u = this.caller(route);
      return u === undefined
        ? this.json(route, 401, { msg: 'no' })
        : this.json(route, 200, this.userJson(u));
    }
    if (path === '/auth/v1/logout')
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });

    if (path.startsWith('/rest/v1/')) return this.rest(route, path.slice('/rest/v1/'.length), url);
    if (path === '/functions/v1/students') return this.students(route);
    return this.json(route, 404, { message: `fake: ${path}` });
  }

  private rest(route: Route, table: string, url: URL) {
    const req = route.request();
    const me = this.caller(route);
    if (me === undefined) return this.json(route, 200, []);
    const coach = this.isCoach(me);
    const filters = [...url.searchParams].filter(
      ([k]) => !['select', 'order', 'limit', 'offset', 'on_conflict'].includes(k),
    );
    const match = (row: Record<string, unknown>) =>
      filters.every(([k, v]) => String(row[k]) === v.replace(/^eq\./, ''));
    const one = (req.headers()['accept'] ?? '').includes('vnd.pgrst.object');

    if (table === 'profiles' && req.method() === 'GET') {
      const rows = this.profiles.filter((p) => (p.id === me.id || coach) && match(p));
      return one
        ? rows[0]
          ? this.json(route, 200, rows[0])
          : this.json(route, 406, { code: 'PGRST116' })
        : this.json(route, 200, rows);
    }
    if (table === 'lesson_states' && req.method() === 'GET') {
      const rows = [...this.lessons.values()].filter(
        (r) => (r.user_id === me.id || coach) && match(r),
      );
      return one
        ? rows[0]
          ? this.json(route, 200, rows[0])
          : this.json(route, 406, { code: 'PGRST116' })
        : this.json(route, 200, rows);
    }
    if (table === 'lesson_states' && req.method() === 'POST') {
      const body = req.postDataJSON() as LessonRow | LessonRow[];
      for (const r of Array.isArray(body) ? body : [body]) {
        if (r.user_id !== me.id)
          return this.json(route, 403, { message: 'new row violates row-level security policy' });
        this.lessons.set(`${r.user_id}/${r.lesson_id}`, r);
      }
      return this.json(route, 201, undefined);
    }
    return this.json(route, 404, { message: `fake: ${req.method()} ${table}` });
  }

  private students(route: Route) {
    if (!this.isCoach(this.caller(route))) return this.json(route, 403, { error: 'coach only' });
    const b = route.request().postDataJSON() as {
      action: string;
      login?: string;
      nickname?: string;
      avatar?: string;
      pin?: string;
      userId?: string;
    };
    if (b.action === 'create') {
      if (!/^\d{6}$/.test(b.pin ?? ''))
        return this.json(route, 400, { error: 'pin', message: 'PIN gồm đúng 6 chữ số' });
      if (this.profiles.some((p) => p.login === b.login))
        return this.json(route, 409, { error: 'taken', message: 'Tên đăng nhập này đã có' });
      const id = this.id();
      this.users.push({ id, email: `${b.login ?? ''}@${DOMAIN}`, password: b.pin ?? '' });
      this.profiles.push({
        id,
        login: b.login ?? '',
        nickname: b.nickname ?? '',
        avatar: b.avatar ?? '🐣',
        role: 'student',
        created_at: new Date().toISOString(),
      });
      return this.json(route, 200, { id });
    }
    const u = this.users.find((x) => x.id === b.userId);
    if (u === undefined) return this.json(route, 404, { error: 'student' });
    if (b.action === 'setPin') {
      u.password = b.pin ?? '';
      return this.json(route, 200, { ok: true });
    }
    return this.json(route, 400, { error: 'action' });
  }
}
