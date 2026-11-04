import { isOpenLesson, type Lesson } from '@pyquest/content-schema';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useSession } from '../../app/session';
import { catalog } from '../../content/catalog';
import type { LessonState } from '../../storage/store';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';
import { TopBar } from '../../ui/TopBar';
import { lessonStatus, litRoadmap, type LessonStatus } from './progress';

const BADGE: Record<LessonStatus, string> = { done: '✅', open: '▶', locked: '🔒', hidden: '🚧' };

/**
 * The course map: the game's parts light up as lessons finish; "Học tiếp" goes straight to the next
 * lesson; lessons are grouped by course part (A–E).
 */
export function CourseMap() {
  const { courseId = '' } = useParams();
  const course = catalog.course(courseId);
  const { store, profile } = useSession();
  const [states, setStates] = useState<Map<string, LessonState>>(new Map());

  useEffect(() => {
    if (profile !== null) void store.allLessonStates(profile.id).then(setStates);
  }, [store, profile]);

  if (course === undefined) return <p className="p-8">Không tìm thấy khóa này.</p>;
  const role = profile?.role ?? 'student';
  const lit = litRoadmap(course.lessons, states);
  const status = (l: Lesson) => lessonStatus(course.lessons, l.id, states, role);
  const next = course.lessons.find((l) => status(l) === 'open');
  const done = course.lessons.filter((l) => status(l) === 'done').length;
  const parts = course.parts ?? [{ title: 'Các bài', lessonIds: course.lessonIds }];
  const byId = new Map(course.lessons.map((l) => [l.id, l]));

  return (
    <div className="flex h-dvh flex-col">
      <TopBar title={course.title} back="/courses" />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6">
          <Panel className="grid grid-cols-[1fr_auto] items-center gap-6 p-5 max-[900px]:grid-cols-1">
            <div>
              <h2 className="text-3xl text-brand-deep">{course.title}</h2>
              <p className="mt-1 text-lg text-ink-soft">{course.summary}</p>
              <p className="mt-3 font-display text-lg">
                Lộ trình game của em · {done}/{course.lessons.length} bài
              </p>
              <ol className="mt-2 flex flex-wrap gap-2" data-testid="roadmap">
                {course.roadmap.map((part) => (
                  <li
                    key={part.id}
                    data-lit={lit.has(part.id)}
                    className={`rounded-full border-2 px-3 py-1 ${lit.has(part.id) ? 'border-ink bg-sun font-bold' : 'border-dashed border-ink-soft/60 text-ink-soft'}`}
                  >
                    {part.icon} {part.label}
                  </li>
                ))}
              </ol>
            </div>
            {next !== undefined && (
              <Link to={`/l/${next.id}`} data-testid="continue">
                <Button tone="go" className="min-h-16 px-8 text-2xl">
                  ▶ {done === 0 ? 'Bắt đầu' : 'Học tiếp'}: Bài {next.order}
                </Button>
              </Link>
            )}
          </Panel>

          {parts.map((part) => (
            <section key={part.title}>
              <h3 className="mb-2 text-xl text-ink-soft">{part.title}</h3>
              <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="lessons">
                {part.lessonIds.map((id) => {
                  const l = byId.get(id);
                  if (l === undefined) return null;
                  const st = status(l);
                  const canOpen = st === 'open' || st === 'done';
                  const draft = isOpenLesson(l) && l.draft === true;
                  const summary = isOpenLesson(l) ? l.summary : undefined;
                  const card = (
                    <Panel
                      className={`flex h-full items-start gap-3 p-4 ${st === 'open' ? 'bg-white' : ''} ${canOpen ? 'hover:bg-brand-soft' : 'opacity-55'}`}
                    >
                      <span className="font-pixel text-4xl leading-none text-brand">
                        {String(l.order).padStart(2, '0')}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="font-display text-lg font-extrabold">{l.title}</span>
                        {summary !== undefined && (
                          <span className="text-sm text-ink-soft">{summary}</span>
                        )}
                        {draft && (
                          <span className="mt-1 self-start rounded-full bg-sun px-2 text-xs font-bold">
                            Bản nháp · chỉ HLV thấy
                          </span>
                        )}
                        {st === 'hidden' && !draft && (
                          <span className="text-sm text-ink-soft">Đang soạn</span>
                        )}
                      </span>
                      <span aria-label={st} className="text-xl">
                        {BADGE[st]}
                      </span>
                    </Panel>
                  );
                  return (
                    <li key={l.id} data-testid={`lesson-${l.id}`} data-status={st}>
                      {canOpen ? <Link to={`/l/${l.id}`}>{card}</Link> : card}
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
