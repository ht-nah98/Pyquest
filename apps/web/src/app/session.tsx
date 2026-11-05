import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { restoreProfile, signOut } from '../cloud/auth';
import { cloud } from '../cloud/client';
import { supabaseRemote } from '../cloud/remote';
import { DexieStore } from '../storage/dexieStore';
import type { Profile, ProgressStore } from '../storage/store';
import { SyncStore, type SyncStatus } from '../storage/syncStore';

const KEY = 'pq-profile';

type Session = {
  store: ProgressStore;
  profile: Profile | null;
  /** Local mode: pick a profile. Cloud mode: the profile after signing in; null signs out. */
  setProfile: (p: Profile | null) => void;
  ready: boolean;
  /** True when accounts live in Supabase (spec 2026-11-05). */
  isCloud: boolean;
  /** Cloud mode only: is this device's work in the cloud yet. */
  sync: SyncStatus | null;
};

const SessionContext = createContext<Session | null>(null);

function readSaved(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** The first pull on a new device waits at most this long; after that the child starts and sync goes on behind. */
const FIRST_PULL_MS = 5000;

export function SessionProvider({
  store,
  children,
}: {
  store?: ProgressStore;
  children: ReactNode;
}) {
  const [local] = useState(() => new DexieStore());
  const [db, setDb] = useState<ProgressStore>(() => store ?? local);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<SyncStatus | null>(null);
  const syncing = useRef<SyncStore | null>(null);
  const isCloud = cloud !== null && store === undefined;

  /** Cloud mode: everything this child saves goes through a SyncStore. */
  const attach = async (p: Profile) => {
    if (cloud === null) return;
    const s = new SyncStore(local, supabaseRemote(cloud), p);
    syncing.current = s;
    s.onStatus(setSync);
    await Promise.race([s.start(), new Promise((r) => setTimeout(r, FIRST_PULL_MS))]);
    setDb(s);
  };

  useEffect(() => {
    if (isCloud && cloud !== null) {
      void restoreProfile(cloud).then(async (p) => {
        if (p !== null) await attach(p);
        setProfileState(p);
        setReady(true);
      });
      return;
    }
    const saved = readSaved();
    void db.listProfiles().then((list) => {
      setProfileState(list.find((p) => p.id === saved) ?? null);
      setReady(true);
    });
    // Runs once: the store is chosen at start (local) or by attach (cloud).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cloud mode: send the queue when the network comes back, when the tab hides, and every 30 s while waiting.
  useEffect(() => {
    if (!isCloud) return;
    const kick = () => void syncing.current?.flush();
    const hide = () => {
      if (document.visibilityState === 'hidden') kick();
    };
    window.addEventListener('online', kick);
    document.addEventListener('visibilitychange', hide);
    const every = setInterval(() => {
      if (syncing.current !== null && syncing.current.status() !== 'synced') kick();
    }, 30_000);
    return () => {
      window.removeEventListener('online', kick);
      document.removeEventListener('visibilitychange', hide);
      clearInterval(every);
    };
  }, [isCloud]);

  const setProfile = (p: Profile | null) => {
    if (isCloud && cloud !== null) {
      if (p === null) {
        const leaving = syncing.current;
        syncing.current = null;
        void leaving?.flush().finally(() => {
          if (cloud !== null) void signOut(cloud);
        });
        setDb(local);
        setSync(null);
        setProfileState(null);
        return;
      }
      setReady(false);
      void attach(p).then(() => {
        setProfileState(p);
        setReady(true);
      });
      return;
    }
    setProfileState(p);
    try {
      if (p === null) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, p.id);
    } catch {
      /* private window: the choice lasts for this tab only */
    }
  };

  return (
    <SessionContext.Provider value={{ store: db, profile, setProfile, ready, isCloud, sync }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): Session {
  const s = useContext(SessionContext);
  if (s === null) throw new Error('useSession outside SessionProvider');
  return s;
}
