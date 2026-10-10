import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loading } from '@/components/common/StateView';

/** Chặn mọi route /admin/* nếu chưa đăng nhập. */
export default function RequireAdmin() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'checking') return <Loading label="Đang kiểm tra phiên đăng nhập…" />;
  if (status !== 'authenticated') return <Navigate to="/admin/login" replace state={{ from: location }} />;
  return <Outlet />;
}
