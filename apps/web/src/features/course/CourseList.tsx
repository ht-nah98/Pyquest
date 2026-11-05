import { Link } from 'react-router';
import { useSession } from '../../app/session';
import { catalog } from '../../content/catalog';
import { TopBar } from '../../ui/TopBar';
import { Panel } from '../../ui/Panel';

/** Every course on the platform. A new course is a new folder in content/courses/ (spec §2). */
export function CourseList() {
  const { profile, isCloud } = useSession();
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
        {catalog.courses().map((c) => (
          <Link key={c.id} to={`/c/${c.id}`} data-testid={`course-${c.id}`}>
            <Panel className="h-full p-5 hover:bg-brand-soft">
              <h2 className="text-3xl text-brand-deep">{c.title}</h2>
              <p className="mt-2 text-ink-soft">{c.summary}</p>
              <p className="mt-3 font-pixel text-2xl">{c.lessons.length} bài</p>
            </Panel>
          </Link>
        ))}
      </main>
    </>
  );
}
