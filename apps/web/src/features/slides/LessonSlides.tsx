import { useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useSession } from '../../app/session';
import { catalog } from '../../content/catalog';
import { Button } from '../../ui/Button';
import { TopBar } from '../../ui/TopBar';
import { useLessonState } from '../lesson/useLessonState';
import { flatten } from './flatten';
import { presentChannel } from './presentChannel';
import { SlideView } from './SlideView';
import { StepBar } from './StepBar';

/**
 * A lesson's slides in one of two modes (pedagogy/lesson-rhythm.md):
 * - present (coach, in class): big type, ←/→/Space, N opens the notes window, no quiz gate;
 * - self (child, at home): Tiếp waits for a right quiz answer and for the code goals.
 */
export function LessonSlides() {
  const { lessonId = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useSession();
  const lesson = catalog.openLesson(lessonId);
  const course = catalog.courseOf(lessonId);
  const { state, update } = useLessonState(lessonId);
  const flat = useMemo(() => (lesson === undefined ? [] : flatten(lesson)), [lesson]);

  const isCoach = profile?.role === 'coach';
  const present = isCoach && params.get('mode') !== 'self';
  const index = Math.min(state?.slideIndex ?? 0, Math.max(0, flat.length - 1));
  const current = flat[index];

  const go = useCallback(
    (to: number) => {
      const target = flat[Math.max(0, Math.min(flat.length - 1, to))];
      if (target === undefined) return;
      update({ slideIndex: target.index, stepIndex: target.stepIndex });
    },
    [flat, update],
  );

  // Self mode: a quiz needs the right answer; the code step needs its goals; otherwise free.
  const quiz = current?.slide.quiz;
  const quizOk = quiz === undefined || state?.quizAnswers[current?.slide.id ?? ''] === quiz.answer;
  const lastOfCode =
    current?.kind === 'code' && flat[index + 1]?.kind !== 'code' && lesson?.code !== undefined;
  const codeOk = !lastOfCode || state?.doneSteps.includes('code') === true;
  const canNext = present || (quizOk && codeOk);
  const isLast = index === flat.length - 1;

  useEffect(() => {
    if (present && current !== undefined) presentChannel.announce(lessonId, current.index);
  }, [present, lessonId, current]);

  useEffect(() => {
    if (!present) return;
    const off = presentChannel.onHello(() => {
      if (current !== undefined) presentChannel.announce(lessonId, current.index);
    });
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(index - 1);
      else if (e.key === 'n' || e.key === 'N')
        window.open(`/l/${lessonId}/notes`, 'pq-notes', 'width=720,height=640');
    };
    window.addEventListener('keydown', key);
    return () => {
      off();
      window.removeEventListener('keydown', key);
    };
  }, [present, go, index, lessonId, current]);

  if (lesson === undefined || course === undefined) {
    return <p className="p-8">Bài này chưa mở.</p>;
  }
  if (state === null || current === undefined) return null;

  const finish = () => {
    const doneSteps = lesson.steps.map((s) => s.kind);
    update({ done: true, doneSteps });
    void navigate(`/c/${course.id}`);
  };

  const ctx = { course, state, update };

  return (
    <div className="flex h-dvh flex-col">
      <TopBar
        title={`Bài ${String(lesson.order)}: ${lesson.title}`}
        back={`/c/${course.id}`}
        right={
          isCoach ? (
            <Link
              to={`/l/${lessonId}?mode=${present ? 'self' : 'present'}`}
              className="rounded-full bg-white/15 px-3 py-1"
              data-testid="toggle-mode"
            >
              {present ? '👀 Xem như bé' : '📽️ Trình chiếu'}
            </Link>
          ) : undefined
        }
      />
      <div
        className={`flex min-h-0 flex-1 flex-col gap-4 ${present ? 'px-10 py-6' : 'px-6 py-4'}`}
        data-mode={present ? 'present' : 'self'}
      >
        <StepBar lesson={lesson} current={current.stepIndex} done={state.doneSteps} big={present} />
        <SlideView
          key={current.slide.id}
          slide={current.slide}
          big={present}
          ctx={ctx}
          answer={state.quizAnswers[current.slide.id]}
          onAnswer={(i) => {
            update((s) => ({ quizAnswers: { ...s.quizAnswers, [current.slide.id]: i } }));
          }}
        />
        <footer className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => {
              go(index - 1);
            }}
            disabled={index === 0}
            data-testid="slide-prev"
          >
            ← Trước
          </Button>
          <span className="font-pixel text-2xl text-ink-soft" data-testid="slide-count">
            {index + 1}/{flat.length}
          </span>
          {current.kind === 'code' && lesson.code !== undefined && (
            <Link to={`/l/${lessonId}/code`} data-testid="to-code">
              <Button tone="sun">🐍 Sang màn code</Button>
            </Link>
          )}
          {!codeOk && <span className="text-ink-soft">Làm xong phần code để đi tiếp.</span>}
          <span className="flex-1" />
          {isLast ? (
            <Button tone="go" onClick={finish} disabled={!canNext} data-testid="slide-finish">
              Xong bài ✓
            </Button>
          ) : (
            <Button
              tone="brand"
              onClick={() => {
                go(index + 1);
              }}
              disabled={!canNext}
              data-testid="slide-next"
            >
              Tiếp →
            </Button>
          )}
        </footer>
        {present && (
          <p className="text-sm text-ink-soft">Phím ←/→ để chuyển · N mở ghi chú giảng</p>
        )}
      </div>
    </div>
  );
}
