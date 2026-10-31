import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../common/UserAvatar';
import CreateMenu from '../common/CreateMenu';
import CreateFolderModal from '../common/CreateFolderModal';
import { folderApi, ContentFolder } from '../../services/folderApi';
import Button from '../ui/Button';
import DarkModeToggle from '../common/DarkModeToggle';
import ThemeAccentSync from '../common/ThemeAccentSync';
import GlobalSearch from '../common/GlobalSearch';
import { NotificationBadge } from './NotificationBadge';
import { supportApi } from '../../services/supportApi';
import { SUPPORT_READ_EVENT } from '../../utils/supportEvents';
import { createStompClient } from '../../services/socket';
import DiamondBadge from '../gamification/DiamondBadge';
import BrandLogo from '../common/BrandLogo';
import { useToast } from '../../context/ToastContext';
import { Plus, Users, GraduationCap, Settings, Database, Layers, Calendar, Library, Home, BookText, ClipboardList, GalleryVerticalEnd, Menu, Folder, Trash2, X, Newspaper, Headset, User, Palette, ShieldCheck, History, LogOut } from 'lucide-react';

type NavLink = {
  to: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  /** So hien trong huy hieu cam; 0 hoac undefined thi khong ve gi. */
  badge?: number;
};

/** Mỗi khu chức năng một màu nhận diện, dùng cho chip icon ở thanh menu */
const NAV_TONE: Record<string, string> = {
  '/dashboard': '#2F6BFF', '/classes': '#12B39A', '/exams': '#FF5A47', '/vocabulary': '#FFB020',
  '/flashcards': '#F0509A', '/library': '#16A9C4', '/admin/users': '#7C5CFF', '/admin/students': '#12B39A',
  '/admin/classes': '#2F6BFF', '/admin/activities': '#FFB020', '/admin/audit-logs': '#56618A', '/support/inbox': '#F0509A',
};

const Layout: React.FC<{ children: React.ReactNode; isViewportConstrained?: boolean }> = ({ children, isViewportConstrained }) => {
  const { user, token, logout, isTeacher, isAdmin, isOffice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Huy hieu tren muc "Ho tro": so hoi thoai dang cho tra loi.
  const [supportUnread, setSupportUnread] = useState(0);
  const isAgent = isAdmin || isOffice;

  const refreshSupportUnread = useCallback(() => {
    if (!isAgent) return;
    supportApi.unreadCount().then(setSupportUnread).catch(() => {
      // Hong mang thi giu nguyen con so cu, khong lam sap thanh ben.
    });
  }, [isAgent]);

  // Tai lai moi khi doi trang: du phong cho truong hop WebSocket rot.
  useEffect(() => { refreshSupportUnread(); }, [refreshSupportUnread, location.pathname]);

  useEffect(() => {
    if (!isAgent) return;
    // Hoc vien nhan tin -> backend day ban cap nhat hoi thoai xuong topic nay.
    const client = createStompClient({ token }, [
      { destination: '/topic/support.agents', handler: () => refreshSupportUnread() },
    ]);
    const onRead = () => refreshSupportUnread();
    window.addEventListener(SUPPORT_READ_EVENT, onRead);
    return () => {
      client?.deactivate();
      window.removeEventListener(SUPPORT_READ_EVENT, onRead);
    };
  }, [isAgent, token, refreshSupportUnread]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setDropdownOpen(false);
    
    // Auto collapse sidebar on create/edit pages for wider workspace
    if (location.pathname.includes('/create') || location.pathname.includes('/edit')) {
      setIsSidebarExpanded(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isTeacher) return;
    folderApi.getMyFolders().then((res) => setFolders(res.data.content)).catch(() => {});
  }, [isTeacher, location.pathname]);

  const handleDeleteFolder = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = await toast.confirm(
      `Xóa folder "${name}"? Nội dung bên trong sẽ không bị xóa, chỉ gỡ khỏi folder.`,
      { title: 'Xóa folder', confirmLabel: 'Xóa' }
    );
    if (!confirmed) return;
    try {
      await folderApi.deleteFolder(id);
      setFolders((prev) => prev.filter((f) => f.id !== id));
      toast.success('Đã xóa folder');
      if (location.pathname === `/library/folders/${id}`) {
        navigate('/library');
      }
    } catch {
      toast.error('Không thể xóa folder');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const studentTeacherNavLinks: NavLink[] = [
    { to: '/dashboard', label: 'Trang Chủ', icon: <Home size={20} /> },
    { to: '/classes', label: 'Lớp học', icon: <Layers size={20} /> },
    { to: '/exams', label: 'Đề Thi', icon: <ClipboardList size={20} /> },
    { to: '/vocabulary', label: 'Từ Vựng', icon: <BookText size={20} /> },
    { to: '/flashcards', label: 'Thẻ Ghi Nhớ', icon: <GalleryVerticalEnd size={20} /> },
    { to: '/library', label: 'Kho Học Liệu', icon: <Library size={20} /> },
  ];

  const adminNavLinks: NavLink[] = [
    { to: '/dashboard', label: 'Tổng quan', icon: <Home size={20} /> },
    { to: '/admin/users', label: 'Người dùng', icon: <Users size={20} /> },
    { to: '/admin/students', label: 'Học sinh', icon: <Database size={20} /> },
    { to: '/admin/classes', label: 'Lớp học', icon: <Layers size={20} /> },
    { to: '/exams', label: 'Đề thi', icon: <ClipboardList size={20} /> },
    { to: '/flashcards', label: 'Thẻ Flashcard', icon: <GalleryVerticalEnd size={20} /> },
    { to: '/library', label: 'Kho Học Liệu', icon: <Library size={20} /> },
    { to: '/admin/activities', label: 'Hoạt động', icon: <Newspaper size={20} /> },
    { to: '/admin/audit-logs', label: 'Nhật ký hệ thống', icon: <Settings size={20} /> },
    { to: '/support/inbox', label: 'Hỗ trợ', icon: <Headset size={20} />, badge: supportUnread },
  ];

  const officeNavLinks: NavLink[] = [
    { to: '/dashboard', label: 'Tổng quan', icon: <Home size={20} /> },
    { to: '/admin/students', label: 'Học sinh', icon: <Database size={20} /> },
    { to: '/admin/classes', label: 'Lớp học', icon: <Layers size={20} /> },
    { to: '/support/inbox', label: 'Hỗ trợ', icon: <Headset size={20} />, badge: supportUnread },
  ];

  const navLinks = isAdmin ? adminNavLinks : (isOffice ? officeNavLinks : studentTeacherNavLinks);

  const renderNavLinks = (expanded: boolean, onNavigate?: () => void) => (
    <>
      <p className="text-[10px] sm:text-xs font-bold text-white/60 uppercase tracking-[0.14em] px-2 mb-2 transition-all duration-300 whitespace-nowrap overflow-hidden">
        {isAdmin ? (expanded ? 'Quản trị hệ thống' : 'Admin') : (isOffice ? (expanded ? 'Văn phòng' : 'Office') : 'Menu')}
      </p>

      {navLinks.map((link) => {
        if (link.disabled) {
          return (
            <div
              key={link.label}
              title="Tính năng đang phát triển"
              className={`flex items-center rounded-xl text-sm font-semibold text-white/60 opacity-60 cursor-not-allowed transition-all duration-300 overflow-hidden h-10 px-2 ${
                expanded ? 'w-full gap-3' : 'w-10 gap-0 shrink-0'
              }`}
            >
              <span className="shrink-0 flex items-center justify-center w-6 h-6 text-white/50">{link.icon}</span>
              <span className={`whitespace-nowrap transition-all duration-300 flex items-center flex-1 ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
                {link.label}
                <span className="ml-auto text-[10px] bg-gray-100 dark:bg-white/10 text-gray-400 px-1.5 py-0.5 rounded-full font-normal">Sắp ra mắt</span>
              </span>
            </div>
          );
        }
        return (
          <Link
            key={link.to}
            to={link.to}
            title={!expanded ? link.label : undefined}
            onClick={onNavigate}
            style={{ '--tone': NAV_TONE[link.to] || '#2F6BFF' } as React.CSSProperties}
            className={`ds-nav flex items-center rounded-2xl text-sm font-semibold transition-all duration-300 overflow-hidden h-11 px-1.5 ${
              isActive(link.to) ? 'is-active' : ''
            } ${expanded ? 'w-full gap-3' : 'w-11 gap-0 shrink-0'}`}
          >
            <span className="ds-nav-ico relative shrink-0 flex items-center justify-center w-8 h-8 rounded-xl">
              {link.icon}
              {/* Thanh ben thu gon chi con icon - huy hieu bam vao goc icon. */}
              {!!link.badge && !expanded && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] rounded-full bg-cam px-1 text-center text-[10px] font-bold leading-4 text-white">
                  {link.badge > 9 ? '9+' : link.badge}
                </span>
              )}
            </span>
            <span className={`whitespace-nowrap transition-all duration-300 ${expanded ? 'flex flex-1 items-center opacity-100 w-auto' : 'opacity-0 w-0'}`}>
              {link.label}
              {!!link.badge && expanded && (
                <span className="ml-auto min-w-[18px] rounded-full bg-cam px-1.5 text-center text-[11px] font-bold leading-[18px] text-white">
                  {link.badge > 99 ? '99+' : link.badge}
                </span>
              )}
            </span>
          </Link>
        );
      })}

    </>
  );

  return (
    <>
      <ThemeAccentSync />
      <div className={`${isViewportConstrained ? 'h-screen overflow-hidden' : 'min-h-screen'} ds-page flex transition-colors duration-200 overflow-x-clip font-body app-shell`}>
        {/* Desktop Sidebar */}
        <aside
          className={`ds-sidebar hidden sm:flex flex-col shrink-0 transition-all duration-300 z-50 sticky top-0 h-screen overflow-clip ${
            isSidebarExpanded ? 'w-56 xl:w-64' : 'w-[84px]'
          }`}
        >
          <div className="h-16 flex items-center shrink-0 pl-4 gap-2">
            <button
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-white/90 hover:bg-white/15 transition-colors shrink-0 p-0"
              aria-label={isSidebarExpanded ? 'Thu gọn menu' : 'Mở rộng menu'}
            >
              <Menu size={24} />
            </button>
            <Link to="/dashboard" className="flex items-center gap-2 shrink-0 overflow-hidden">
              <BrandLogo size={34} inverted />
              <span className={`font-heading text-xl font-extrabold text-white tracking-tight transition-all duration-300 whitespace-nowrap ${isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>Điểm Sáng</span>
            </Link>
          </div>

          <div className="flex-1 flex flex-col py-4 gap-1 overflow-y-auto px-3">
            {renderNavLinks(isSidebarExpanded)}
          </div>
          {isSidebarExpanded && (
            <div className="ds-sidebar-card m-3 rounded-2xl p-4 text-white">
              <p className="font-heading text-sm font-bold">✨ Chấm bài bằng AI</p>
              <p className="mt-1 text-xs text-white/80 leading-relaxed">Gắn khóa Gemini hoặc ChatGPT để AI gợi ý điểm bài tự luận theo đáp án của bạn.</p>
              <Link to="/profile/ai" className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-bold text-camDam hover:-translate-y-0.5 transition-transform">Cài đặt AI</Link>
            </div>
          )}
        </aside>

        {/* Mobile drawer overlay */}
        {isMobileMenuOpen && (
          <button
            type="button"
            className="sm:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-[1px]"
            aria-label="Đóng menu"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile drawer */}
        <aside
          className={`ds-sidebar sm:hidden fixed inset-y-0 left-0 z-[70] w-[min(20rem,86vw)] flex flex-col shadow-2xl transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-hidden={!isMobileMenuOpen}
        >
          <div className="h-14 flex items-center justify-between shrink-0 border-b border-white/15 px-3">
            <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <BrandLogo size={32} inverted />
              <span className="font-heading text-xl font-extrabold text-white tracking-tight">Điểm Sáng</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-xl text-white hover:bg-white/15"
              aria-label="Đóng menu"
            >
              <X size={22} />
            </button>
          </div>
          <div className="flex-1 flex flex-col py-4 gap-1 overflow-y-auto px-3">
            {renderNavLinks(true, () => setIsMobileMenuOpen(false))}
          </div>
        </aside>

        <div className={`flex-1 flex flex-col min-w-0 relative ${isViewportConstrained ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
          <header className="shrink-0 sticky top-0 z-40 bg-white/75 dark:bg-night-surface/80 backdrop-blur-md border-b border-white/70 dark:border-night-border w-full">
            <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex sm:hidden items-center gap-1.5 shrink-0 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 rounded-xl text-vutru hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0"
                  aria-label="Mở menu"
                >
                  <Menu size={24} />
                </button>
                <Link to="/dashboard" className="flex items-center gap-2 shrink-0 min-w-0">
                  <BrandLogo size={32} />
                  <span className="font-heading text-xl font-extrabold theme-logo tracking-tight truncate">Điểm Sáng</span>
                </Link>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-3 ml-auto min-w-0">
                <div className="hidden md:block">
                  <GlobalSearch />
                </div>
                <Link
                  to="/profile/appearance"
                  className="px-3 py-1.5 rounded-full text-xs font-bold text-vutruNhat theme-link-hover hover:bg-gray-100 dark:hover:bg-white/10 transition-colors hidden lg:block"
                  title="Giao diện & Theme"
                >
                  Theme
                </Link>
                <DarkModeToggle className="!px-2 sm:!px-3" />
                <NotificationBadge />
                <div className="hidden xs:block sm:block">
                  <CreateMenu />
                </div>

                {/* Diamond indicator badge next to user profile */}
                <DiamondBadge className="shrink-0" />

                <div className="relative font-body" ref={dropdownRef}>
                  <button
                    id="profile-dropdown-toggle"
                    onClick={() => setDropdownOpen(prev => !prev)}
                    className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-cam outline-none group"
                    aria-label="Tài khoản cá nhân"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="menu"
                  >
                    <UserAvatar
                      fullName={user?.fullName || 'Người dùng'}
                      avatarUrl={user?.avatarUrl}
                      size="sm"
                    />
                    <span className="hidden md:inline text-xs font-bold text-vutru dark:text-night-text max-w-[120px] truncate group-hover:text-cam transition-colors">
                      {user?.fullName}
                    </span>
                    <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-cam' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-[min(17rem,calc(100vw-1.5rem))] bg-white dark:bg-night-surface rounded-2xl shadow-soft border border-gray-100 dark:border-night-border overflow-hidden z-50 animate-fade-in"
                    >
                      <div className="px-4 py-3.5 border-b border-gray-100 dark:border-night-border bg-kem/40 dark:bg-night-elevated/40 flex items-center gap-3">
                        <UserAvatar
                          fullName={user?.fullName || 'Người dùng'}
                          avatarUrl={user?.avatarUrl}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5 mb-0.5">
                            <p className="text-sm font-bold text-vutru dark:text-night-text truncate">{user?.fullName}</p>
                          </div>
                          <p className="text-xs text-vutruNhat dark:text-night-muted truncate">{user?.email}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400' :
                              user?.role === 'TEACHER' ? 'theme-badge-primary' :
                              user?.role === 'TEACHING_ASSISTANT' ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400' :
                              user?.role === 'OFFICE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' :
                              'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'
                            }`}>
                              {user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'TEACHER' ? 'Giáo viên' : user?.role === 'TEACHING_ASSISTANT' ? 'Trợ giảng' : user?.role === 'OFFICE' ? 'Văn phòng' : 'Học viên'}
                            </span>
                            <DiamondBadge className="!px-2 !py-0.2 text-[10px]" />
                          </div>
                        </div>
                      </div>

                      <div className="p-1.5 space-y-0.5">
                        <Link
                          id="dropdown-profile"
                          to="/profile"
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-vutru dark:text-night-text hover:bg-kem dark:hover:bg-night-elevated theme-link-hover transition-colors group"
                        >
                          <User size={15} className="text-vutruNhat dark:text-night-muted group-hover:text-cam transition-colors" />
                          <span>Chỉnh sửa hồ sơ</span>
                        </Link>
                        <Link
                          id="dropdown-appearance"
                          to="/profile/appearance"
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-vutru dark:text-night-text hover:bg-kem dark:hover:bg-night-elevated theme-link-hover transition-colors group"
                        >
                          <Palette size={15} className="text-vutruNhat dark:text-night-muted group-hover:text-cam transition-colors" />
                          <span>Giao diện & Theme</span>
                        </Link>
                        <Link
                          id="dropdown-security"
                          to="/profile/security"
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-vutru dark:text-night-text hover:bg-kem dark:hover:bg-night-elevated theme-link-hover transition-colors group"
                        >
                          <ShieldCheck size={15} className="text-vutruNhat dark:text-night-muted group-hover:text-cam transition-colors" />
                          <span>Bảo mật tài khoản</span>
                        </Link>
                        <Link
                          id="dropdown-history"
                          to="/profile/history"
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-vutru dark:text-night-text hover:bg-kem dark:hover:bg-night-elevated theme-link-hover transition-colors group"
                        >
                          <History size={15} className="text-vutruNhat dark:text-night-muted group-hover:text-cam transition-colors" />
                          <span>Lịch sử hoạt động</span>
                        </Link>

                        <div className="my-1 border-t border-gray-100 dark:border-night-border" />

                        <button
                          id="dropdown-logout"
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors group"
                        >
                          <LogOut size={15} className="group-hover:text-rose-600 transition-colors" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className={`w-full max-w-[1920px] mx-auto px-3 sm:px-6 py-4 sm:py-6 min-w-0 ${isViewportConstrained ? 'flex-1 flex flex-col min-h-0 overflow-y-auto' : 'flex-1'}`}>
            {children}
          </main>

          <CreateFolderModal
            isOpen={folderModalOpen}
            onClose={() => setFolderModalOpen(false)}
            onCreated={() => folderApi.getMyFolders().then((res) => setFolders(res.data?.content || []))}
          />

          <footer className="shrink-0 w-full border-t border-white/70 dark:border-night-border bg-white/50 dark:bg-night-surface/60 py-4 text-center text-xs text-vutruNhat dark:text-night-muted transition-colors mt-auto">
            <div className="max-w-[1920px] mx-auto px-4">
              © 2026 Điểm Sáng — Mọi quyền được bảo lưu.
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Layout;
