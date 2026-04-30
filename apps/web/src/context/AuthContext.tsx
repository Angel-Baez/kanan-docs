import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { api } from '../api/client.ts';

export type UserRole = 'admin' | 'jefe_obra' | 'vendedor';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthCtx {
  user: AuthUser | null;
  /** undefined = still loading; null = not logged in; AuthUser = logged in */
  status: 'loading' | 'unauthenticated' | 'authenticated';
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  status: 'loading',
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthCtx['status']>('loading');

  // On mount: verify existing session via cookie
  useEffect(() => {
    api.auth.me()
      .then(u => { setUser(u as AuthUser); setStatus('authenticated'); })
      .catch(() => { setUser(null); setStatus('unauthenticated'); });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.auth.login(email, password) as { user: AuthUser };
    setUser(data.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout().catch(() => {});
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
