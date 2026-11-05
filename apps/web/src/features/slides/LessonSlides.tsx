import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useSession } from '../../app/session';
import { catalog } from '../../content/catalog';
import { Button } from '../../ui/Button';
import { TopBar } from '../../ui/TopBar';
import { useLessonState } from '../lesson/useLessonState';
import { flatten, STEP_ICON, STEP_LABEL, type FlatSlide } from './flatten';
import { presentChannel } from './presentChannel';
import { SlideView } from './SlideView';
import { SlideProgress, StepBar } from './StepBar';

/**
 * A lesson's slides in one of two modes (pedagogy/lesson-rhythm.md):
 * - present (coach, in class): big type, ←/→/Space, N opens the notes window, no quiz gate;
 * - self (child, at home): Tiếp waits for a right quiz answer and for the code goals.
 * The coach also gets ☰ Các màn: every slide of the lesson, one click away.
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
  const [menuOpen, setMenuOpen] = useState(false);

  const isCoach = profile?.role === 'coach';
  const present = isCoach && params.get('mode') !== 'self';
  const index = Math.min(state?.slideIndex ?? 0, Math.max(0, flat.length - 1));
  const current = flat[index];
  const furthest = Math.max(state?.furthestSlide ?? 0, index);

  const go = useCallback(
    (to: number) => {
      const target = flat[Math.max(0, Math.min(flat.length - 1, to))];
      if (target === undefined) return;
      update((s) => ({
        slideIndex: target.index,
        stepIndex: target.stepIndex,
        furthestSlide: Math.max(s.furthestSlide ?? 0, target.index),
      }));
    },
    [flat, update],
  );

  // Self mode: a quiz needs the right answer; the code step needs its goals; otherwise free.
  const quiz = current?.slide.quiz;
  const quizOk = quiz === undefined || state?.quizAnswers[current?.slide.id ?? ''] === quiz.answer;
  const lastOfCode =
    current?.kind === 'code' && flat[index + 1]?.kind !== 'code' && lesson?.exercises !== undefined;
  const codeOk = !lastOfCode || state?.doneSteps.includes('code') === true;
  const canNext = present || isCoach || (quizOk && codeOk);
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
        window.open(
          `${import.meta.env.BASE_URL}l/${lessonId}/notes`,
          'pq-notes',
          'width=720,height=640',
        );
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
    update({ done: true, doneSteps: lesson.steps.map((s) => s.kind) });
    void navigate(`/c/${course.id}`);
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopBar
        title={`Bài ${String(lesson.order)} · ${lesson.title}`}
        back={`/c/${course.id}`}
        right={
          isCoach ? (
            <>
              {lesson.draft === true && (
                <span className="rounded-full bg-sun px-3 py-1 text-ink">Bản nháp</span>
              )}
              <Link
                to={`/l/${lessonId}?mode=${present ? 'self' : 'present'}`}
                className="rounded-full bg-white/15 px-3 py-1"
                data-testid="toggle-mode"
              >
                {present ? '👀 Xem như bé' : '📽️ Trình chiếu'}
              </Link>
            </>
          ) : undefined
        }
      />

      <div
        className={`flex items-center justify-between gap-4 ${present ? 'px-10 pt-5' : 'px-6 pt-4'}`}
      >
        <StepBar lesson={lesson} current={current.stepIndex} done={state.doneSteps} big={present} />
        {isCoach && (
          <Button
            onClick={() => {
              setMenuOpen((o) => !o);
            }}
            data-testid="slide-menu-toggle"
          >
            ☰ Các màn
          </Button>
        )}
      </div>

      <main
        className={`relative min-h-0 flex-1 ${present ? 'px-10 py-6' : 'px-6 py-5'}`}
        data-mode={present ? 'present' : 'self'}
      >
        <div className="mx-auto h-full max-w-[1500px]">
          <SlideView
            key={current.slide.id}
            slide={current.slide}
            big={present}
            ctx={{ course, state, update }}
            answer={state.quizAnswers[current.slide.id]}
            onAnswer={(i) => {
              update((s) => ({ quizAnswers: { ...s.quizAnswers, [current.slide.id]: i } }));
            }}
          />
        </div>
        {menuOpen && (
          <SlideMenu
            flat={flat}
            index={index}
            onJump={(i) => {
              go(i);
              setMenuOpen(false);
            }}
            codeHref={lesson.exercises === undefined ? undefined : `/l/${lessonId}/code`}
          />
        )}
      </main>

      <footer className="flex items-center justify-center gap-4 border-t-2 border-ink/15 bg-paper px-6 py-3">
        <Button
          onClick={() => {
            go(index - 1);
          }}
          disabled={index === 0}
          data-testid="slide-prev"
        >
          ← Trước
        </Button>
        <div className="flex flex-col items-center gap-1">
          <SlideProgress
            flat={flat}
            index={index}
            reachable={(i) => isCoach || i <= furthest}
            onJump={go}
          />
          <span className="font-pixel text-xl text-ink-soft" data-testid="slide-count">
            {index + 1}/{flat.length}
          </span>
        </div>
        {current.kind === 'code' && lesson.exercises !== undefined && (
          <Link to={`/l/${lessonId}/code`} data-testid="to-code">
            <Button tone="sun" className="text-xl">
              🐍 Sang màn code
            </Button>
          </Link>
        )}
        {isLast ? (
          <Button
            tone="go"
            onClick={finish}
            disabled={!canNext}
            data-testid="slide-finish"
            className="min-w-40 text-xl"
          >
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
            className="min-w-40 text-xl"
          >
            Tiếp →
          </Button>
        )}
        {!codeOk && !isCoach && (
          <span className="text-ink-soft">Làm xong phần code để đi tiếp.</span>
        )}
        {present && (
          <span className="absolute bottom-1 right-3 text-xs text-ink-soft">
            ←/→ chuyển · N ghi chú
          </span>
        )}
      </footer>
    </div>
  );
}

/** Coach-only list of every slide of the lesson, grouped by step. */
function SlideMenu({
  flat,
  index,
  onJump,
  codeHref,
}: {
  flat: readonly FlatSlide[];
  index: number;
  onJump: (i: number) => void;
  codeHref: string | undefined;
}) {
  return (
    <nav
      className="absolute right-4 top-2 z-[90] max-h-[calc(100%-1rem)] w-[380px] overflow-y-auto rounded-[var(--radius-card)] border-2 border-ink bg-white p-3 shadow-hard"
      data-testid="slide-menu"
    >
      {flat.map((f, i) => (
        <div key={f.slide.id}>
          {(i === 0 || flat[i - 1]?.kind !== f.kind) && (
            <p className="mt-2 px-2 font-display text-sm font-extrabold uppercase text-ink-soft">
              {STEP_ICON[f.kind]} {STEP_LABEL[f.kind]}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              onJump(f.index);
            }}
            className={`flex w-full items-baseline gap-2 rounded-[8px] px-2 py-1 text-left hover:bg-brand-soft ${f.index === index ? 'bg-sun' : ''}`}
          >
            <span className="font-pixel text-lg text-brand">{f.index + 1}</span>
            <span className="truncate">
              {f.slide.title ??
                (f.slide.quiz !== undefined ? `❓ ${f.slide.quiz.question}` : (f.slide.text ?? ''))}
            </span>
          </button>
        </div>
      ))}
      {codeHref !== undefined && (
        <Link
          to={codeHref}
          className="mt-2 block rounded-[8px] bg-brand-soft px-2 py-2 font-display font-bold"
        >
          🐍 Mở màn code
        </Link>
      )}
    </nav>
  );
}
