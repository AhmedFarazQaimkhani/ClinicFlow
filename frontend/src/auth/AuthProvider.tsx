import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import api from '../api/client';
import type { SessionUser } from '../types';

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('cf_access');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => {
        sessionStorage.removeItem('cf_access');
        sessionStorage.removeItem('cf_refresh');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await api.post('/auth/login', { identifier, password });
    sessionStorage.setItem('cf_access', res.data.data.accessToken);
    sessionStorage.setItem('cf_refresh', res.data.data.refreshToken);
    setUser(res.data.data.user);
    return res.data.data.user as SessionUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', {
        refreshToken: sessionStorage.getItem('cf_refresh'),
      });
    } catch {
      /* ignore */
    }
    sessionStorage.removeItem('cf_access');
    sessionStorage.removeItem('cf_refresh');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider missing');
  return ctx;
}

export function homePath(role: SessionUser['role']) {
  if (role === 'DOCTOR') return '/app/doctor';
  if (role === 'OWNER') return '/app/owner';
  if (role === 'DISPENSER') return '/app/dispensing';
  return '/app/reception';
}
