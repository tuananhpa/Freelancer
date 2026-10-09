import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { AdminUser } from "../types/domain";
import { apiAuth } from "../services/apiRepository";
import { isMock } from "../services";
import { Loading } from "../components/common";
type AuthValue = {
  user: AdminUser | null;
  loading: boolean;
  login: (email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const u = isMock
          ? sessionStorage.getItem("hytales.demo.admin") === "active"
            ? { name: "Quản trị viên demo", role: "admin" as const }
            : null
          : await apiAuth.me();
        if (active && u?.role === "admin") setUser(u);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    void initialize();
    return () => {
      active = false;
    };
  }, []);
  async function login(email = "", password = "") {
    const u = isMock
      ? { name: "Quản trị viên demo", role: "admin" as const }
      : await apiAuth.login(email, password);
    if (u.role !== "admin")
      throw new Error("Tài khoản không có quyền quản trị.");
    if (isMock) sessionStorage.setItem("hytales.demo.admin", "active");
    setUser(u);
  }
  async function logout() {
    if (isMock) sessionStorage.removeItem("hytales.demo.admin");
    else await apiAuth.logout();
    setUser(null);
  }
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
export function ProtectedAdmin() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  return user ? (
    <Outlet />
  ) : (
    <Navigate replace to="/admin/login" state={{ from: location.pathname }} />
  );
}
