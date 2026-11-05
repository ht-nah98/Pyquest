import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { catalog } from '../../content/catalog';
import type { LessonState } from '../../storage/store';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';
import { TopBar } from '../../ui/TopBar';
import { lessonsOf, listStudents, manage, type Student } from './coachApi';
import { randomPin } from './CoachHome';
import { exercisesOf } from './summary';

const when = (ms: number) =>
  new Date(ms).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

/** One child: every lesson with its exercises (✓ done), new PIN, remove. */
export function CoachStudent() {
  const { userId = '' } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null | undefined>(undefined);
  const [states, setStates] = useState<Map<string, { state: LessonState; at: number }>>(new Map());
  const [pin, setPin] = useState(randomPin);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([listStudents(), lessonsOf(userId)])
      .then(([list, rows]) => {
        if (!alive) return;
        setStudent(list.find((s) => s.id === userId) ?? null);
        setStates(new Map(rows.map((r) => [r.lessonId, { state: r.state, at: r.at }])));
      })
      .catch(() => {
        if (alive) setMsg('Chưa tải được. Kiểm tra mạng.');
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  if (student === undefined) return <TopBar title="Đang tải…" back="/coach" />;
  if (student === null) return <TopBar title="Không tìm thấy bé này" back="/coach" />;

  const setNewPin = async () => {
    const err = await manage({ action: 'setPin', userId, pin });
    setMsg(err ?? `PIN mới của ${student.nickname}: ${pin}. Ghi lại đưa bé.`);
    if (err === null) setPin(randomPin());
  };

  const remove = async () => {
    if (
      !window.confirm(
        `Xóa tài khoản ${student.nickname}? Mọi bài của bé sẽ mất, không lấy lại được.`,
      )
    )
      return;
    const err = await manage({ action: 'remove', userId });
    if (err === null) void navigate('/coach');
    else setMsg(err);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar title={`${student.avatar} ${student.nickname} (${student.login})`} back="/coach" />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
        {msg !== null && (
          <p className="rounded-[8px] bg-sun/40 px-3 py-2" role="status" data-testid="student-msg">
            {msg}
          </p>
        )}
        {catalog.courses().map((course) => (
          <Panel key={course.id} className="p-4">
            <h2 className="mb-2 text-2xl">{course.title}</h2>
            <ul className="flex flex-col divide-y divide-ink/10">
              {course.lessons.map((l) => {
                const row = states.get(l.id);
                const done = row?.state.exercisesDone ?? [];
                return (
                  <li key={l.id} className="flex flex-wrap items-center gap-2 py-2">
                    <span className="w-64 shrink-0">
                      <b>Bài {l.order}</b> · {l.title} {row?.state.done === true && '✅'}
                    </span>
                    {exercisesOf(l).map((e, i) => (
                      <Link
                        key={e.id}
                        to={`/coach/s/${userId}/l/${l.id}?ex=${e.id}`}
                        className={`rounded-full border-2 px-3 py-1 text-sm ${done.includes(e.id) ? 'border-go bg-go/15' : row?.state.exercises?.[e.id] !== undefined ? 'border-sun-deep bg-sun/30' : 'border-ink/20 bg-white text-ink-soft'}`}
                        title={e.title}
                        data-testid={`see-${e.id}`}
                      >
                        {done.includes(e.id) ? '✓' : '○'} {i + 1}
                      </Link>
                    ))}
                    {row !== undefined && (
                      <span className="ml-auto text-sm text-ink-soft">{when(row.at)}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>
        ))}
        <Panel className="flex flex-wrap items-center gap-3 p-4">
          <span className="font-display text-lg">🔑 PIN mới</span>
          <input
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
            }}
            inputMode="numeric"
            className="min-h-11 w-28 rounded-[10px] border-2 border-ink bg-white px-3 font-code tracking-widest"
          />
          <Button
            tone="brand"
            disabled={pin.length !== 6}
            onClick={() => void setNewPin()}
            data-testid="set-pin"
          >
            Đặt PIN mới
          </Button>
          <span className="flex-1" />
          <Button tone="oops" onClick={() => void remove()} data-testid="remove-student">
            Xóa tài khoản
          </Button>
        </Panel>
      </main>
    </div>
  );
}
