import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '@/services/api';
import { onUnauthorized } from '@/services/http/client';
import { tokenStorage } from '@/services/http/tokenStorage';

const AuthContext = createContext(null);

/** Chỉ khu vực /admin dùng đăng nhập. Khách xem trang sản phẩm không cần tài khoản. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(tokenStorage.get() ? 'checking' : 'guest');

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* bỏ qua */ }
    tokenStorage.clear();
    setUser(null);
    setStatus('guest');
  }, []);

  useEffect(() => {
    if (status !== 'checking') return;
    authService.me()
      .then((u) => { setUser(u); setStatus('authenticated'); })
      .catch(() => { tokenStorage.clear(); setStatus('guest'); });
  }, [status]);

  useEffect(() => onUnauthorized(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus('guest');
  }), []);

  const login = useCallback(async (email, password) => {
    const { token, user: u } = await authService.login(email, password);
    tokenStorage.set(token);
    setUser(u);
    setStatus('authenticated');
    return u;
  }, []);

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng bên trong AuthProvider');
  return ctx;
};
