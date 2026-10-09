import { NavLink, Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ScanLine,
  Inbox,
  Settings,
  ExternalLink,
  LogOut,
  MessagesSquare,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Brand } from "../../components/common";
import { useAuth } from "../../app/auth";
import { useNotice } from "../../app/providers";
import { isMock } from "../../services";
import { ThemeToggle } from "../../components/ThemeToggle";
const links = [
  { to: "/admin", text: "Tổng quan", icon: LayoutDashboard },
  { to: "/admin/products", text: "Sản phẩm & câu chuyện", icon: Package },
  { to: "/admin/qr", text: "Mã QR & tem nhãn", icon: ScanLine },
  { to: "/admin/inbox", text: "Hộp thư & kết nối", icon: Inbox },
  { to: "/admin/quick-replies", text: "Hỏi đáp nhanh", icon: MessagesSquare },
  { to: "/admin/settings", text: "Thiết lập", icon: Settings },
];
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const notify = useNotice();
  const [open, setOpen] = useState(false);
  return (
    <div className="admin-layout">
      <aside className={open ? "admin-sidebar open" : "admin-sidebar"}>
        <Brand />
        <div className="workspace-label">Không gian người kể chuyện</div>
        <nav aria-label="Điều hướng quản trị">
          {links.map(({ to, text, icon: Icon }) => (
            <NavLink
              key={to}
              end={to === "/admin"}
              to={to}
              onClick={() => setOpen(false)}
            >
              <Icon size={19} />
              {text}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <MessagesSquare size={23} />
          <h3>
            Mỗi cập nhật,
            <br />
            một chuyện quê được kể.
          </h3>
          <p>
            {isMock
              ? "Dữ liệu demo lưu trong trình duyệt hiện tại."
              : "Dữ liệu được kết nối với backend."}
          </p>
        </div>
        <Link className="admin-public-link" to="/" target="_blank">
          <ExternalLink size={16} />
          Xem trang trải nghiệm
        </Link>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <button
              className="icon-button admin-menu"
              onClick={() => setOpen(!open)}
              aria-label="Mở menu"
              aria-expanded={open}
            >
              {open ? <X /> : <Menu />}
            </button>
            <span>{isMock ? "Không gian demo" : "Không gian quản trị"}</span>
            <span className="status-badge">
              {isMock ? "Frontend demo" : "API"}
            </span>
          </div>
          <div>
            <span className="admin-avatar">HY</span>
            <ThemeToggle />
            <span>{user?.name}</span>
            <button
              className="icon-button"
              aria-label="Đăng xuất"
              onClick={() => void logout().catch((e) => notify(e.message))}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
