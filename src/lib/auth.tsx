import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';
import type { UserProfile } from './types';

type AuthCtx = { user: UserProfile | null; ready: boolean; problem: string | null; refresh: () => Promise<void> };
const Ctx = createContext<AuthCtx>({ user: null, ready: false, problem: null, refresh: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => {
    const off = api.onAuth((u, p) => {
      setUser(u);
      setProblem(p ?? null);
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
  return <Ctx.Provider value={{ user, ready, problem, refresh }}>
      {problem && (
        <div className="error" role="alert" style={{ borderRadius: 0, textAlign: 'center' }}>
          {problem}
        </div>
      )}
      {children}
    </Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
