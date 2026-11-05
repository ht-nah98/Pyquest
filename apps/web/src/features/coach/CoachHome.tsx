import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { catalog } from '../../content/catalog';
import type { LessonState } from '../../storage/store';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';
import { TopBar } from '../../ui/TopBar';
import { lessonsOf, listStudents, manage, type Student } from './coachApi';
import { cellOf, currentLesson } from './summary';

const AVATARS = ['🦊', '🐼', '🐯', '🦉', '🐸', '🐙', '🦄', '🐲'];
const input = 'min-h-11 rounded-[10px] border-2 border-ink bg-white px-3';

/** getRandomValues works over plain-http LAN too (unlike randomUUID). */
export const randomPin = () =>
  Array.from(crypto.getRandomValues(new Uint32Array(6)), (n) => String(n % 10)).join('');

/** 👥 The coach's class: who is where in the course, and the account tools (spec 2026-11-05 §5). */
export function CoachHome() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [states, setStates] = useState<Map<string, Map<string, LessonState>>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const [round, setRound] = useState(0);
  const load = () => {
    setRound((n) => n + 1);
  };

  useEffect(() => {
    let alive = true;
    Promise.all([listStudents(), lessonsOf()])
      .then(([list, rows]) => {
        if (!alive) return;
        const by = new Map<string, Map<string, LessonState>>();
        for (const r of rows) {
          const m = by.get(r.userId) ?? new Map<string, LessonState>();
          m.set(r.lessonId, r.state);
          by.set(r.userId, m);
        }
        setStudents(list);
        setStates(by);
        setError(null);
      })
      .catch(() => {
        if (alive) setError('Chưa tải được lớp. Kiểm tra mạng rồi bấm ↻.');
      });
    return () => {
      alive = false;
    };
  }, [round]);

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar title="👥 Lớp của tôi" back="/courses" />
      <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <h2 className="flex-1 text-2xl">Tiến độ</h2>
          <Button onClick={load} data-testid="coach-reload">
            ↻ Tải lại
          </Button>
        </div>
        {error !== null && <p className="rounded-[8px] bg-oops-soft px-3 py-2">{error}</p>}
        {students === null && error === null && <p className="text-ink-soft">Đang tải…</p>}
        {students !== null && students.length === 0 && (
          <p className="text-ink-soft">Chưa có bé nào. Thêm bé ở khung bên dưới.</p>
        )}
        {students !== null &&
          students.length > 0 &&
          catalog.courses().map((course) => (
            <Panel key={course.id} className="overflow-x-auto p-3">
              <h3 className="mb-2 text-xl">{course.title}</h3>
              <table
                className="border-separate border-spacing-1 text-sm"
                data-testid="progress-grid"
              >
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-paper text-left">Bé</th>
                    <th className="text-left">Đang ở</th>
                    {course.lessons.map((l) => (
                      <th key={l.id} className="w-8 text-center font-pixel text-lg" title={l.title}>
                        {l.order}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const mine = states.get(s.id) ?? new Map<string, LessonState>();
                    const now = currentLesson(course.lessons, mine);
                    return (
                      <tr key={s.id}>
                        <td className="sticky left-0 bg-paper pr-2">
                          <Link
                            to={`/coach/s/${s.id}`}
                            className="font-display text-base underline-offset-2 hover:underline"
                            data-testid={`student-${s.login}`}
                          >
                            {s.avatar} {s.nickname}
                          </Link>
                          <span className="ml-1 text-ink-soft">({s.login})</span>
                        </td>
                        <td className="whitespace-nowrap pr-2 text-ink-soft">
                          {now === undefined ? '—' : `Bài ${String(now.order)}`}
                        </td>
                        {course.lessons.map((l) => {
                          const c = cellOf(l, mine.get(l.id));
                          const bg = c.finished
                            ? 'bg-go text-white'
                            : c.done > 0
                              ? 'bg-sun'
                              : c.started
                                ? 'bg-brand-soft'
                                : 'bg-white';
                          return (
                            <td
                              key={l.id}
                              className={`h-8 w-8 rounded-[6px] border border-ink/20 text-center ${bg}`}
                              title={`Bài ${String(l.order)}: ${String(c.done)}/${String(c.total)} bài tập${c.finished ? ', xong bài' : ''}`}
                            >
                              {c.total > 0 && c.started
                                ? `${String(c.done)}/${String(c.total)}`
                                : ''}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-2 text-sm text-ink-soft">
                Ô xanh: xong bài · vàng: đã xong vài bài tập · xanh nhạt: đã mở bài. Số = bài tập
                xong / tổng.
              </p>
            </Panel>
          ))}
        <AddStudent onAdded={load} />
      </main>
    </div>
  );
}

function AddStudent({ onAdded }: { onAdded: () => void }) {
  const [login, setLogin] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0] ?? '🦊');
  const [pin, setPin] = useState(randomPin);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const add = async () => {
    setBusy(true);
    const err = await manage({ action: 'create', login, nickname, avatar, pin });
    setBusy(false);
    if (err !== null) {
      setMsg({ ok: false, text: err });
      return;
    }
    setMsg({
      ok: true,
      text: `Đã tạo! Đưa bé: tên đăng nhập "${login}", PIN ${pin}. Ghi lại ngay nhé.`,
    });
    setLogin('');
    setNickname('');
    setPin(randomPin());
    onAdded();
  };

  return (
    <Panel className="p-4" data-testid="add-student">
      <h2 className="mb-3 text-2xl">➕ Thêm bé</h2>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <label>
          <span className="mb-1 block text-sm text-ink-soft">Tên đăng nhập (không dấu)</span>
          <input
            value={login}
            onChange={(e) => {
              setLogin(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
            }}
            maxLength={20}
            className={`${input} w-40`}
            placeholder="minh"
            data-testid="new-login"
          />
        </label>
        <label>
          <span className="mb-1 block text-sm text-ink-soft">Biệt danh</span>
          <input
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
            }}
            maxLength={24}
            className={`${input} w-44`}
            placeholder="Minh Khoa"
            data-testid="new-nickname"
          />
        </label>
        <label>
          <span className="mb-1 block text-sm text-ink-soft">PIN</span>
          <span className="flex gap-1">
            <input
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
              }}
              inputMode="numeric"
              className={`${input} w-28 font-code tracking-widest`}
              data-testid="new-pin"
            />
            <Button
              title="PIN ngẫu nhiên"
              onClick={() => {
                setPin(randomPin());
              }}
            >
              🎲
            </Button>
          </span>
        </label>
        <div className="flex gap-1" role="radiogroup" aria-label="Hình đại diện">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={a === avatar}
              onClick={() => {
                setAvatar(a);
              }}
              className={`size-11 rounded-full border-2 text-2xl ${a === avatar ? 'border-brand bg-brand-soft' : 'border-transparent'}`}
            >
              {a}
            </button>
          ))}
        </div>
        <Button
          tone="go"
          type="submit"
          disabled={busy || login.length < 2 || nickname.trim() === '' || pin.length !== 6}
          data-testid="new-go"
        >
          {busy ? 'Đang tạo…' : 'Tạo tài khoản'}
        </Button>
      </form>
      {msg !== null && (
        <p
          className={`mt-3 rounded-[8px] px-3 py-2 ${msg.ok ? 'bg-go/15' : 'bg-oops-soft'}`}
          data-testid="new-result"
          role="status"
        >
          {msg.text}
        </p>
      )}
    </Panel>
  );
}
