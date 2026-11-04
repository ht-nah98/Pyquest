import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DexieStore } from '../storage/dexieStore';
import type { Profile, ProgressStore } from '../storage/store';

const KEY = 'pq-profile';

type Session = {
  store: ProgressStore;
  profile: Profile | null;
  setProfile: (p: Profile | null) => void;
  ready: boolean;
};

const SessionContext = createContext<Session | null>(null);

function readSaved(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function SessionProvider({
  store,
  children,
}: {
  store?: ProgressStore;
  children: ReactNode;
}) {
  const [db] = useState<ProgressStore>(() => store ?? new DexieStore());
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = readSaved();
    void db.listProfiles().then((list) => {
      setProfileState(list.find((p) => p.id === saved) ?? null);
      setReady(true);
    });
  }, [db]);

  const setProfile = (p: Profile | null) => {
    setProfileState(p);
    try {
      if (p === null) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, p.id);
    } catch {
      /* private window: the choice lasts for this tab only */
    }
  };

  return (
    <SessionContext.Provider value={{ store: db, profile, setProfile, ready }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): Session {
  const s = useContext(SessionContext);
  if (s === null) throw new Error('useSession outside SessionProvider');
  return s;
}
