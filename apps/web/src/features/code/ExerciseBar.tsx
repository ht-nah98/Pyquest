import type { Exercise } from '@pyquest/content-schema';
import { Link } from 'react-router';
import { isUnlocked } from './exercises';

/**
 * "Bài tập 1 · 2 · 3": the exercises of this lesson, easiest first. Done ones show ✓, the next ones stay
 * locked until the one before is done (the coach may open any).
 */
export function ExerciseBar({
  lessonId,
  all,
  current,
  done,
  isCoach,
}: {
  lessonId: string;
  all: readonly Exercise[];
  current: Exercise;
  done: readonly string[];
  isCoach: boolean;
}) {
  return (
    <nav
      className="flex items-center gap-2 overflow-x-auto border-b-2 border-ink/10 bg-paper px-3 py-0.5"
      data-testid="exercise-bar"
    >
      <span className="shrink-0 font-display text-sm font-bold">Bài tập</span>
      {all.map((e, i) => {
        const open = isCoach || isUnlocked(all, done, i);
        const isDone = done.includes(e.id);
        const here = e.id === current.id;
        const label = `${isDone ? '✓ ' : open ? '' : '🔒 '}${String(i + 1)}. ${e.title}`;
        const cls = `shrink-0 rounded-full border-2 px-3 py-0 text-sm ${here ? 'border-ink bg-sun font-bold' : isDone ? 'border-go bg-go/15' : 'border-ink/30 bg-white'}`;
        return open ? (
          <Link
            key={e.id}
            to={`/l/${lessonId}/code?ex=${e.id}`}
            className={cls}
            aria-current={here ? 'step' : undefined}
            data-testid={`exercise-${e.id}`}
            data-done={isDone}
          >
            {label}
            {e.input === 'typing' && ' ✍️'}
          </Link>
        ) : (
          <span
            key={e.id}
            className={`${cls} opacity-60`}
            title="Làm xong bài tập trước để mở"
            data-testid={`exercise-${e.id}`}
            data-done={false}
          >
            {label}
          </span>
        );
      })}
    </nav>
  );
}
