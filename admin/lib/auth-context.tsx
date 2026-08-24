'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, getToken, setToken, ApiError } from './api';
import { decodeJwt } from './utils';
import type { Role } from './types';

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  exp?: number;
}

interface AdminAuthState {
  admin: { id: string; email: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AdminAuthState | undefined>(undefined);

function adminFromToken(token: string): AdminAuthState['admin'] {
  const payload = decodeJwt<JwtPayload>(token);
  if (!payload) return null;
  if (payload.exp && payload.exp * 1000 < Date.now()) return null;
  if (payload.role !== 'ADMIN') return null;
  return { id: payload.sub, email: payload.email };
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminAuthState['admin']>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      const parsed = adminFromToken(token);
      if (parsed) setAdmin(parsed);
      else setToken(null);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { access_token } = await api.login({ email, password });
    const parsed = adminFromToken(access_token);
    if (!parsed) {
      // Valid credentials but not an admin — do not grant access.
      throw new ApiError(403, 'This account does not have admin access.');
    }
    setToken(access_token);
    setAdmin(parsed);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAdmin(null);
  }, []);

  const value = useMemo<AdminAuthState>(
    () => ({
      admin,
      isLoading,
      isAuthenticated: !!admin,
      login,
      logout,
    }),
    [admin, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
