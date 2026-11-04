import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useSession } from '../../app/session';
import { catalog } from '../../content/catalog';
import type { LessonState } from '../../storage/store';
import { Panel } from '../../ui/Panel';
import { TopBar } from '../../ui/TopBar';
import { lessonStatus, litRoadmap, type LessonStatus } from './progress';

const BADGE: Record<LessonStatus, string> = { done: '✅', open: '▶', locked: '🔒', hidden: '🚧' };

/** The course roadmap: the game's parts light up as lessons finish, then the lesson list (spec §6). */
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

  return (
    <>
      <TopBar title={course.title} back="/courses" />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Panel className="mb-6 p-4">
          <h2 className="mb-3 text-xl">Lộ trình game của em</h2>
          <ol className="flex flex-wrap gap-2" data-testid="roadmap">
            {course.roadmap.map((part) => (
              <li
                key={part.id}
                data-lit={lit.has(part.id)}
                className={`rounded-full border-2 px-3 py-1 ${lit.has(part.id) ? 'border-ink bg-sun' : 'border-dashed border-ink-soft text-ink-soft'}`}
              >
                {part.icon} {part.label}
              </li>
            ))}
          </ol>
        </Panel>

        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="lessons">
          {course.lessons.map((l) => {
            const status = lessonStatus(course.lessons, l.id, states, role);
            const card = (
              <Panel
                className={`flex h-full items-center gap-3 p-4 ${status === 'open' ? 'bg-white' : ''} ${status === 'hidden' || status === 'locked' ? 'opacity-60' : ''}`}
              >
                <span className="font-pixel text-3xl text-brand">
                  {String(l.order).padStart(2, '0')}
                </span>
                <span className="flex-1 font-display text-lg">{l.title}</span>
                <span aria-label={status}>{BADGE[status]}</span>
              </Panel>
            );
            const canOpen = status === 'open' || status === 'done';
            return (
              <li key={l.id} data-testid={`lesson-${l.id}`} data-status={status}>
                {canOpen ? <Link to={`/l/${l.id}`}>{card}</Link> : card}
              </li>
            );
          })}
        </ol>
      </main>
    </>
  );
}
