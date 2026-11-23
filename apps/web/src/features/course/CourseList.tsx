import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useSession } from '../../app/session';
import { seesCourse } from '../../content/access';
import { catalog } from '../../content/catalog';
import { TopBar } from '../../ui/TopBar';
import { DraftTag } from '../../ui/DraftTag';
import { Panel } from '../../ui/Panel';
import { drawingsOf } from '../studio/drawings';

/** Every course on the platform. A new course is a new folder in content/courses/ (spec §2). */
export function CourseList() {
  const { profile, isCloud, store } = useSession();
  const [drawings, setDrawings] = useState<number | null>(null);
  useEffect(() => {
    if (profile !== null)
      void store.allLessonStates(profile.id).then((m) => {
        setDrawings(drawingsOf(m).length);
      });
  }, [store, profile]);
  return (
    <>
      <TopBar title="Các khóa học" />
      <main className="mx-auto grid max-w-5xl gap-4 px-4 py-6 sm:grid-cols-2">
        {isCloud && profile?.role === 'coach' && (
          <Link to="/coach" data-testid="to-coach">
            <Panel className="h-full border-dashed bg-brand-soft p-5 hover:bg-sun/30">
              <h2 className="text-3xl text-brand-deep">👥 Lớp của tôi</h2>
              <p className="mt-2 text-ink-soft">Tiến độ từng bé, xem code, thêm bé, đặt PIN mới.</p>
            </Panel>
          </Link>
        )}
        {catalog
          .courses()
          .filter((c) => seesCourse(c, profile?.role ?? 'student'))
          .map((c) => (
            <Link key={c.id} to={`/c/${c.id}`} data-testid={`course-${c.id}`}>
              <Panel className="h-full p-5 hover:bg-brand-soft">
                <h2 className="text-3xl text-brand-deep">{c.title}</h2>
                <p className="mt-2 text-ink-soft">{c.summary}</p>
                {c.draft === true && <DraftTag className="mt-2" />}
                <p className="mt-3 font-pixel text-2xl">{c.lessons.length} bài</p>
              </Panel>
            </Link>
          ))}
        {catalog.studio() !== undefined && (
          <Link to="/studio" data-testid="to-studio">
            <Panel className="h-full bg-sun/25 p-5 hover:bg-sun/50">
              <h2 className="text-3xl text-brand-deep">🎨 Xưởng vẽ</h2>
              <p className="mt-2 text-ink-soft">
                Vẽ tự do bằng code: hình tròn, đường thẳng, tam giác… Lưu nhiều tranh, tải về máy.
              </p>
              <p className="mt-3 font-pixel text-2xl" data-testid="studio-count">
                {drawings === null ? '' : `${String(drawings)} tranh`}
              </p>
            </Panel>
          </Link>
        )}
      </main>
    </>
  );
}
