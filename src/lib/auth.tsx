import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';
import type { UserProfile } from './types';

type AuthCtx = { user: UserProfile | null; ready: boolean; refresh: () => Promise<void> };
const Ctx = createContext<AuthCtx>({ user: null, ready: false, refresh: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const off = api.onAuth((u) => {
      setUser(u);
      setReady(true);
    });
    return () => {
      off();
    };
  }, []);
  const refresh = useCallback(async () => {
    if (!user) return;
    setUser(await api.getProfile(user.id));
  }, [user]);
  return <Ctx.Provider value={{ user, ready, refresh }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
