import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'UNASSIGNED' | 'OFFICE' | 'TEACHING_ASSISTANT';
  avatarUrl: string | null;
  phone?: string;
  studentCode?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  authProvider?: 'LOCAL' | 'GOOGLE';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateRole: (newRole: string, newToken: string) => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isTeachingAssistant: boolean;
  isStudent: boolean;
  isUnassigned: boolean;
  isOffice: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  // Sync profile data with server upon application boot
  useEffect(() => {
    if (!token) return;
    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setUser((prev) => {
            if (!prev) return prev;
            const updated: User = {
              ...prev,
              fullName: data.fullName || prev.fullName,
              avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : prev.avatarUrl,
              phone: data.phone || prev.phone,
              studentCode: data.studentCode || prev.studentCode,
            };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
          });
        }
      })
      .catch(() => {});
  }, [token]);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const updateRole = useCallback((newRole: string, newToken: string) => {
    if (!user) return;
    const updatedUser = { ...user, role: newRole as User['role'] };
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setToken(newToken);
    setUser(updatedUser);
  }, [user]);

  const updateUser = useCallback((updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, [user]);

  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'ADMIN';
  const isTeachingAssistant = user?.role === 'TEACHING_ASSISTANT';
  // Quyền trợ giảng tạm thời giống giáo viên
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'TEACHING_ASSISTANT';
  const isStudent = user?.role === 'STUDENT';
  const isUnassigned = !user || user.role === 'UNASSIGNED';
  const isOffice = user?.role === 'OFFICE';

  const value = useMemo(() => ({
    user, token, login, logout, updateRole, updateUser, isAuthenticated, isAdmin, isTeacher, isTeachingAssistant, isStudent, isUnassigned, isOffice
  }), [user, token, login, logout, updateRole, updateUser, isAuthenticated, isAdmin, isTeacher, isTeachingAssistant, isStudent, isUnassigned, isOffice]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
