import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useSession } from '../../app/session';
import { signInCoach, signInStudent, type SignInError } from '../../cloud/auth';
import { cloud } from '../../cloud/client';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';

const SAY: Record<SignInError, string> = {
  wrong: 'Tên đăng nhập hoặc PIN chưa đúng. Hỏi thầy nếu em quên.',
  offline: 'Chưa có mạng. Kết nối Wi-Fi rồi thử lại nhé.',
  'no-profile': 'Tài khoản này chưa được cấp quyền vào lớp.',
};

const input = 'min-h-11 w-full rounded-[10px] border-2 border-ink bg-white px-3 text-lg';

/** Cloud mode: the child signs in with the name and 6-digit PIN the coach gave; the coach with e-mail. */
export function LoginScreen() {
  const { setProfile } = useSession();
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [coachOpen, setCoachOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async (attempt: () => Promise<Awaited<ReturnType<typeof signInStudent>>>) => {
    setBusy(true);
    setError(null);
    const r = await attempt();
    setBusy(false);
    if (typeof r === 'string') {
      setError(SAY[r]);
      return;
    }
    setProfile(r);
    void navigate('/courses');
  };

  if (cloud === null) return null;
  const db = cloud;
  const pinOk = /^\d{6}$/.test(pin);

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-4 py-10">
      <header className="text-center">
        <h1 className="text-5xl text-brand-deep">
          Py<span className="text-sun-deep">Quest</span>
        </h1>
        <p className="mt-2 text-ink-soft">Học Python bằng cách tự làm ra sản phẩm.</p>
      </header>

      <Panel className="p-5">
        <h2 className="mb-4 text-2xl">Đăng nhập</h2>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void go(() => signInStudent(db, login, pin));
          }}
        >
          <label>
            <span className="mb-1 block text-ink-soft">Tên đăng nhập</span>
            <input
              value={login}
              onChange={(e) => {
                setLogin(e.target.value.replace(/\s/g, '').toLowerCase());
              }}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              className={input}
              placeholder="Ví dụ: minh"
              data-testid="login-name"
            />
          </label>
          <label>
            <span className="mb-1 block text-ink-soft">Mã PIN (6 số)</span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
              }}
              className={`${input} tracking-[0.4em]`}
              placeholder="••••••"
              data-testid="login-pin"
            />
          </label>
          <Button
            tone="go"
            type="submit"
            disabled={busy || login.length < 2 || !pinOk}
            className="text-xl"
            data-testid="login-go"
          >
            {busy ? 'Đang vào…' : 'Vào học →'}
          </Button>
        </form>
        {error !== null && (
          <p
            className="mt-3 rounded-[8px] bg-oops-soft px-3 py-2"
            data-testid="login-error"
            role="alert"
          >
            {error}
          </p>
        )}
      </Panel>

      <Panel className="border-dashed bg-brand-soft p-4">
        {!coachOpen ? (
          <button
            type="button"
            className="min-h-11 font-display text-lg"
            onClick={() => {
              setCoachOpen(true);
            }}
            data-testid="coach-open"
          >
            🧑‍🏫 Huấn luyện viên đăng nhập
          </button>
        ) : (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void go(() => signInCoach(db, email, password));
            }}
          >
            <span className="font-display text-lg">🧑‍🏫 Huấn luyện viên</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              className={input}
              placeholder="Email"
              data-testid="coach-email"
            />
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              className={input}
              placeholder="Mật khẩu"
              data-testid="coach-password"
            />
            <Button tone="brand" type="submit" disabled={busy} data-testid="coach-go">
              Vào
            </Button>
          </form>
        )}
      </Panel>
    </main>
  );
}
