import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useSession } from '../app/session';

/** Thin top bar: back link, title, who is signed in. */
export function TopBar({
  title,
  back,
  right,
}: {
  title: string;
  back?: string;
  right?: ReactNode;
}) {
  const { profile, setProfile } = useSession();
  const navigate = useNavigate();
  return (
    <header className="flex min-h-14 items-center gap-3 border-b-2 border-ink bg-brand-deep px-4 text-white">
      {back !== undefined && (
        <Link to={back} className="font-display text-xl" aria-label="Quay lại" data-testid="back">
          ←
        </Link>
      )}
      <h1 className="min-w-0 flex-1 truncate text-xl">{title}</h1>
      {right}
      {profile !== null && (
        <button
          type="button"
          className="rounded-full bg-white/15 px-3 py-1"
          onClick={() => {
            setProfile(null);
            void navigate('/');
          }}
          title="Đổi người học"
        >
          {profile.avatar} {profile.nickname}
        </button>
      )}
    </header>
  );
}
