import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { catalog } from '../../content/catalog';
import { brokenRun, problemOf } from '../../runtime/broken';
import { python } from '../../runtime/client';
import type { StageHandle } from '../../stage/Stage';
import { useGameKeys } from '../../stage/useGameKeys';
import { useGameLoop } from '../../stage/useGameLoop';
import { useLessonState } from '../lesson/useLessonState';
import { visibleExercises, workOf } from './exercises';
import { PlayFrame } from './PlayFrame';
import { useSession } from '../../app/session';

/** ⛶ Fullscreen play of the child's own program. Esc or "Về code" goes back with the code untouched. */
export function PlayScreen() {
  const { lessonId = '' } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const exId = params.get('ex');
  const { profile } = useSession();
  const all = visibleExercises(
    catalog.openLesson(lessonId)?.exercises ?? [],
    profile?.role === 'coach',
  );
  const code = all.find((e) => e.id === exId) ?? all[0];
  const { state } = useLessonState(lessonId);
  const stage = useRef<StageHandle>(null);
  const size = catalog.lessonStage(lessonId);
  const howToPlay =
    catalog.courseOf(lessonId)?.howToPlay ?? 'Bấm Space hoặc chạm màn hình để vỗ cánh';
  const [round, setRound] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const loop = useGameLoop(stage, (r) => {
    const problem = problemOf(r);
    if (problem !== null) setError(problem);
  });
  useGameKeys(code?.mode === 'game', loop.press);

  useEffect(() => {
    if (state === null || code === undefined) return;
    const files = workOf(state, all, code).files;
    if (code.mode === 'game') void loop.start(files, code.main, size);
    else
      void python
        .run(files, code.main, { stage: size })
        .catch(brokenRun)
        .then((r) => {
          setError(problemOf(r));
          return stage.current?.replay(r.events);
        });
    // Restart only on load and on ↻.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state === null, round]);

  return (
    <PlayFrame
      stage={stage}
      size={size}
      pointer={loop.pointer}
      error={error}
      {...(code?.mode === 'game' ? { hint: `${howToPlay} · Esc để về code` } : {})}
      backLabel="Về code"
      onAgain={() => {
        setError(null);
        setRound((n) => n + 1);
      }}
      onBack={() => {
        loop.stop();
        void navigate(`/l/${lessonId}/code${code === undefined ? '' : `?ex=${code.id}`}`);
      }}
    />
  );
}
