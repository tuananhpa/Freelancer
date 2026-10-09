import { Outlet } from 'react-router-dom';

/** Layout cho người dùng — KHÔNG yêu cầu đăng nhập. */
export default function PublicLayout() {
  return <Outlet />;
}
