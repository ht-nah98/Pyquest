import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useSession } from '../../app/session';
import type { Profile } from '../../storage/store';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';

const AVATARS = ['🦊', '🐼', '🐯', '🦉', '🐸', '🐙', '🦄', '🐲'];
const COACH_PIN = import.meta.env['VITE_COACH_PIN'] as string | undefined;

/** Pick or create a profile on this device. Only a nickname and an emoji are stored (AGENTS.md §3 rule 8). */
export function ProfilePicker() {
  const { store, setProfile } = useSession();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0] ?? '🦊');
  const [pin, setPin] = useState('');
  const [pinWrong, setPinWrong] = useState(false);

  useEffect(() => {
    void store.listProfiles().then((list) => {
      setProfiles(list.filter((p) => p.role === 'student'));
    });
  }, [store]);

  const enter = (p: Profile) => {
    setProfile(p);
    void navigate('/courses');
  };

  const create = async () => {
    if (nickname.trim() === '') return;
    enter(await store.createProfile(nickname.slice(0, 20), avatar, 'student'));
  };

  const coach = async () => {
    if (COACH_PIN === undefined || COACH_PIN === '' || pin !== COACH_PIN) {
      setPinWrong(true);
      return;
    }
    enter(await store.coachProfile());
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="text-center">
        <h1 className="text-5xl text-brand-deep">
          Py<span className="text-sun-deep">Quest</span>
        </h1>
        <p className="mt-2 text-ink-soft">Học Python bằng cách tự làm ra sản phẩm.</p>
      </header>

      {profiles.length > 0 && (
        <Panel className="p-5">
          <h2 className="mb-3 text-2xl">Em là ai?</h2>
          <div className="flex flex-wrap gap-3">
            {profiles.map((p) => (
              <Button
                key={p.id}
                onClick={() => {
                  enter(p);
                }}
                data-testid={`profile-${p.nickname}`}
              >
                <span className="text-2xl">{p.avatar}</span> {p.nickname}
              </Button>
            ))}
          </div>
        </Panel>
      )}

      <Panel className="p-5">
        <h2 className="mb-3 text-2xl">Tạo hồ sơ mới</h2>
        <label className="mb-3 block">
          <span className="mb-1 block text-ink-soft">Biệt danh</span>
          <input
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
            }}
            maxLength={20}
            className="min-h-11 w-full rounded-[10px] border-2 border-ink bg-white px-3 text-lg"
            placeholder="Ví dụ: Minh Khoa"
            data-testid="nickname"
          />
        </label>
        <div className="mb-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Hình đại diện">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={a === avatar}
              onClick={() => {
                setAvatar(a);
              }}
              className={`size-12 rounded-full border-2 text-2xl ${a === avatar ? 'border-brand bg-brand-soft' : 'border-transparent'}`}
            >
              {a}
            </button>
          ))}
        </div>
        <Button
          tone="go"
          onClick={() => void create()}
          disabled={nickname.trim() === ''}
          data-testid="create"
        >
          Vào học
        </Button>
      </Panel>

      <details className="rounded-[var(--radius-card)] border-2 border-dashed border-ink-soft p-4">
        <summary className="cursor-pointer text-ink-soft">HLV</summary>
        <div className="mt-3 flex gap-2">
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setPinWrong(false);
            }}
            className="min-h-11 w-40 rounded-[10px] border-2 border-ink bg-white px-3"
            placeholder="Mã PIN"
            data-testid="coach-pin"
          />
          <Button tone="brand" onClick={() => void coach()} data-testid="coach-enter">
            Vào
          </Button>
        </div>
        {pinWrong && <p className="mt-2 text-oops">PIN chưa đúng.</p>}
      </details>
    </main>
  );
}
