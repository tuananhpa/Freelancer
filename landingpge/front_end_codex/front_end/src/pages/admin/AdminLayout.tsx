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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
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
  const [width, setWidth] = useState(() => {
    try {
      const value = Number(localStorage.getItem("hytales.sidebar.width"));
      return value >= 220 && value <= 420 ? value : 270;
    } catch {
      return 270;
    }
  });
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("hytales.sidebar.collapsed") === "true";
    } catch {
      return false;
    }
  });
  const dragging = useRef<{ x: number; width: number } | null>(null);
  useEffect(() => {
    try {
      localStorage.setItem("hytales.sidebar.width", String(width));
      localStorage.setItem("hytales.sidebar.collapsed", String(collapsed));
    } catch {}
  }, [width, collapsed]);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  const resize = (next: number) => setWidth(Math.min(420, Math.max(220, next)));
  return (
    <div
      className={`admin-layout${collapsed ? " sidebar-collapsed" : ""}`}
      style={
        {
          "--admin-sidebar-width": `${collapsed ? 80 : width}px`,
        } as CSSProperties
      }
    >
      {open && (
        <button
          className="admin-drawer-backdrop"
          aria-label="Đóng menu quản trị"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        id="admin-sidebar"
        className={open ? "admin-sidebar open" : "admin-sidebar"}
      >
        <button
          type="button"
          className="icon-button sidebar-collapse"
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <PanelLeftOpen size={21} />
          ) : (
            <PanelLeftClose size={21} />
          )}
        </button>
        <Brand />
        <div className="workspace-label">Không gian người kể chuyện</div>
        <nav aria-label="Điều hướng quản trị">
          {links.map(({ to, text, icon: Icon }) => (
            <NavLink
              key={to}
              end={to === "/admin"}
              to={to}
              title={text}
              aria-label={text}
              onClick={() => setOpen(false)}
            >
              <Icon size={19} />
              <span>{text}</span>
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
              ? "Dữ liệu lưu trong trình duyệt hiện tại."
              : "Dữ liệu được kết nối với backend."}
          </p>
        </div>
        <Link className="admin-public-link" to="/" target="_blank">
          <ExternalLink size={16} />
          <span>Xem trang trải nghiệm</span>
        </Link>
      </aside>
      {!collapsed && (
        <div
          className="sidebar-resizer"
          role="separator"
          tabIndex={0}
          aria-label="Điều chỉnh độ rộng sidebar"
          aria-orientation="vertical"
          aria-controls="admin-sidebar"
          aria-valuemin={220}
          aria-valuemax={420}
          aria-valuenow={width}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            dragging.current = { x: e.clientX, width };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (dragging.current)
              resize(dragging.current.width + e.clientX - dragging.current.x);
          }}
          onPointerUp={(e) => {
            dragging.current = null;
            if (e.currentTarget.hasPointerCapture(e.pointerId))
              e.currentTarget.releasePointerCapture(e.pointerId);
          }}
          onPointerCancel={() => {
            dragging.current = null;
          }}
          onLostPointerCapture={() => {
            dragging.current = null;
          }}
          onKeyDown={(e) => {
            if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
              e.preventDefault();
              resize(
                e.key === "Home"
                  ? 220
                  : e.key === "End"
                    ? 420
                    : width + (e.key === "ArrowLeft" ? -16 : 16),
              );
            }
          }}
        />
      )}
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
            <span>Không gian quản trị</span>
            <span className="status-badge">
              {isMock ? "Lưu cục bộ" : "API"}
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
