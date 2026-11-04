import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { catalog } from '../../content/catalog';
import { flatten, STEP_LABEL } from './flatten';
import { presentChannel } from './presentChannel';

/** Coach-only notes for the slide being presented, in a second window (key N). */
export function CoachNotesWindow() {
  const { lessonId = '' } = useParams();
  const lesson = catalog.openLesson(lessonId);
  const flat = useMemo(() => (lesson === undefined ? [] : flatten(lesson)), [lesson]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const off = presentChannel.onSlide((id, i) => {
      if (id === lessonId) setIndex(i);
    });
    presentChannel.hello();
    return off;
  }, [lessonId]);

  const cur = flat[index];
  const next = flat[index + 1];
  if (cur === undefined) return <p className="p-6">Không có ghi chú.</p>;
  return (
    <main className="flex min-h-dvh flex-col gap-4 bg-paper p-6" data-testid="coach-notes">
      <p className="text-ink-soft">
        {STEP_LABEL[cur.kind]} · slide {index + 1}/{flat.length}
      </p>
      <h1 className="text-3xl">
        {cur.slide.title ?? cur.slide.quiz?.question ?? '(không tiêu đề)'}
      </h1>
      <p className="whitespace-pre-line text-xl" data-testid="coach-notes-text">
        {cur.slide.coachNotes ?? 'Slide này không có ghi chú.'}
      </p>
      {cur.slide.quiz !== undefined && (
        <p className="text-lg">Đáp án: {cur.slide.quiz.choices[cur.slide.quiz.answer]}</p>
      )}
      {next !== undefined && (
        <p className="mt-auto text-ink-soft">
          Tiếp theo: {next.slide.title ?? next.slide.quiz?.question}
        </p>
      )}
    </main>
  );
}
