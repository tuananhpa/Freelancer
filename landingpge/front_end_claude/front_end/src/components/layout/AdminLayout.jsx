import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Brand from './Brand';
import Icon from '@/components/common/Icon';
import { useAuth } from '@/context/AuthContext';

const NAV = [
  { to: '/admin', label: 'Tổng quan', icon: 'home', end: true },
  { to: '/admin/products', label: 'Sản phẩm & lô hàng', icon: 'box' },
  { to: '/admin/qr', label: 'Mã QR động', icon: 'qr' },
  { to: '/admin/analytics', label: 'Thống kê lượt quét', icon: 'chart' },
  { to: '/admin/inbox', label: 'Hộp thư chat', icon: 'inbox' },
  { to: '/admin/orders', label: 'Đơn đặt mua', icon: 'cart' },
  { to: '/admin/reviews', label: 'Đánh giá', icon: 'star' },
  { to: '/admin/leads', label: 'Đăng ký HTX', icon: 'users' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="admin">
      <div className="admin-top">
        <button type="button" className="icon-btn" onClick={() => setOpen(true)} aria-label="Mở menu"><Icon name="menu" /></button>
        <Brand to="/admin" suffix="CMS" />
      </div>
      <aside className={`admin-side ${open ? 'is-open' : ''}`} aria-label="Menu quản trị">
        <Brand to="/admin" suffix="CMS" />
        <nav className="admin-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              <span className="admin-nav__left"><Icon name={n.icon} size={18} />{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-side__foot">
          <span>{user?.name}<br /><small>{user?.email}</small></span>
          <NavLink to="/" style={{ color: 'var(--gold)' }}>Xem trang công khai</NavLink>
          <button type="button" className="btn btn--ghost-dark btn--sm" onClick={logout}><Icon name="logout" size={16} /> Đăng xuất</button>
        </div>
      </aside>
      {open && <div className="sheet-backdrop" style={{ zIndex: 85 }} onClick={() => setOpen(false)} />}
      <main className="admin-main">
        <div className="admin-content"><Outlet /></div>
      </main>
    </div>
  );
}
