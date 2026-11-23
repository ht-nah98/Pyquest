import { useEffect, useRef, useState, type ReactNode } from 'react';
import { catalog } from '../content/catalog';
import { Button } from '../ui/Button';
import { TopBar } from '../ui/TopBar';
import { reloadPage, siteAnswers } from './reload';

/** The course's lessons come in one download when somebody enters it (ADR 0012): the page waits for them. */
export function NeedCourse({ courseId, children }: { courseId: string; children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>(
    catalog.isLoaded(courseId) ? 'ready' : 'loading',
  );
  /** Somebody who left this page must not have the next one reloaded under their hands. */
  const here = useRef(true);
  useEffect(() => {
    let alive = true;
    here.current = true;
    catalog.load(courseId).then(
      () => {
        if (alive) setState('ready');
      },
      () => {
        if (alive) setState('failed');
      },
    );
    return () => {
      alive = false;
      here.current = false;
    };
  }, [courseId]);

  // A whole reload finds the new files after the site was updated while this page stayed open. When the site
  // does not answer it would only lose the page, so then we stay.
  const retry = async () => {
    setState('loading');
    try {
      await catalog.load(courseId);
      if (here.current) setState('ready');
    } catch {
      const answers = await siteAnswers();
      if (!here.current) return;
      if (answers) reloadPage();
      else setState('failed');
    }
  };

  if (state === 'ready') return children;
  return (
    <>
      <TopBar title="Khóa học" back="/courses" />
      {state === 'loading' ? (
        <p className="p-8 text-xl">Đang tải khóa học…</p>
      ) : (
        <div
          className="flex flex-col items-start gap-4 p-8"
          role="alert"
          data-testid="course-failed"
        >
          <p className="text-xl">Chưa tải được khóa học. Em kiểm tra mạng rồi thử lại nhé.</p>
          <Button tone="go" onClick={() => void retry()}>
            ↻ Thử lại
          </Button>
        </div>
      )}
    </>
  );
}
