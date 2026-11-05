import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useSession } from '../app/session';
import type { SyncStatus } from '../storage/syncStore';

const SYNC: Record<SyncStatus, [string, string]> = {
  synced: ['☁️', 'Đã lưu lên mạng'],
  pending: ['⏳', 'Đang lưu lên mạng…'],
  offline: ['📴', 'Chưa có mạng: bài vẫn lưu trên máy, có mạng sẽ tự gửi'],
  error: ['⚠️', 'Chưa lưu lên mạng được: bài vẫn ở trên máy này'],
};

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
  const { profile, setProfile, isCloud, sync } = useSession();
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
      {sync !== null && (
        <span
          className="flex min-h-9 items-center gap-1 rounded-full bg-white/15 px-3 text-sm"
          title={SYNC[sync][1]}
          data-testid="sync-status"
          data-sync={sync}
        >
          {SYNC[sync][0]}
          <span className="max-[1279px]:hidden">
            {sync === 'synced' ? 'Đã lưu' : sync === 'pending' ? 'Đang lưu' : 'Trên máy'}
          </span>
        </span>
      )}
      {profile !== null && (
        <button
          type="button"
          className="min-h-9 rounded-full bg-white/15 px-3 py-1"
          onClick={() => {
            if (
              isCloud &&
              !window.confirm(
                `Đăng xuất ${profile.nickname}? Lần sau cần gõ lại tên đăng nhập và PIN.`,
              )
            )
              return;
            setProfile(null);
            void navigate('/');
          }}
          title={isCloud ? 'Đăng xuất' : 'Đổi người học'}
          data-testid="profile-button"
        >
          {profile.avatar} {profile.nickname}
        </button>
      )}
    </header>
  );
}
