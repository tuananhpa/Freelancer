import React, { useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  Home,
  NotebookPen,
  ChartNoAxesCombined,
  CalendarRange,
  FlaskConical,
  ChefHat,
  UserRound,
  Camera,
  Menu,
  Bell,
  Flame,
  Sparkles,
  MessageCircle,
  LogOut,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import Auth from "./Auth";
import Dashboard, { Diary, Statistics } from "./Dashboard";
import Explore, { WorldCuisine } from "./Explore";
import Plan from "./Plan";
import Profile from "./Profile";
import Chat from "./Chat";
import Admin from "./Admin";
import MealEditor from "./MealEditor";
import { Brand, Toast, Busy, Note } from "./components";
import { api, ApiError } from "./api";
import type { AppState, Meal } from "./types";
import "./styles.css";
import "./responsive.css";
import "./polish.css";
const nav = [
  ["dashboard", "Tổng quan", Home],
  ["diary", "Nhật ký", NotebookPen],
  ["stats", "Thống kê", ChartNoAxesCombined],
  ["plan", "Lộ trình", CalendarRange],
  ["science", "Khoa học", FlaskConical],
  ["world", "Ẩm thực", ChefHat],
  ["profile", "Hồ sơ", UserRound],
] as const;
function App() {
  const [data, setData] = useState<AppState | null>(null),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(""),
    [page, setPage] = useState(location.hash.slice(1) || "dashboard"),
    [meal, setMeal] = useState<Partial<Meal> | null>(null),
    [chat, setChat] = useState(false),
    [menu, setMenu] = useState(false),
    [toast, setToast] = useState("");
  const adminPage = location.pathname === "/admin";
  const notify = useCallback((s: string) => setToast(s), []);
  const closeToast = useCallback(() => setToast(""), []);
  const refresh = useCallback(async () => {
    try {
      const result = await api<AppState>("/state");
      setData(result);
      setLoadError("");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setData(null);
      else throw e;
    }
  }, []);
  useEffect(() => {
    refresh()
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    const hash = () => setPage(location.hash.slice(1) || "dashboard");
    window.addEventListener("hashchange", hash);
    return () => window.removeEventListener("hashchange", hash);
  }, [refresh]);
  function go(next: string) {
    setPage(next);
    location.hash = next;
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function logout() {
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (sub) {
          await api("/push/unsubscribe", "POST", { endpoint: sub.endpoint });
          await sub.unsubscribe();
        }
      }
      await api("/auth/logout", "POST", {});
    } catch {}
    setData(null);
    setChat(false);
    setMeal(null);
    go("dashboard");
  }
  const props = data
    ? {
        data,
        refresh,
        notify,
        openMeal: (initial?: Partial<Meal>) => setMeal(initial ?? {}),
        go,
        chat: () => setChat(true),
      }
    : null;
  if (loading)
    return (
      <div className="loading-screen">
        <Brand />
        <Busy />
      </div>
    );
  if (loadError)
    return (
      <div className="loading-screen">
        <Brand />
        <Note tone="warning">{loadError}</Note>
        <button className="btn" onClick={() => location.reload()}>
          <RefreshCw size={17} />
          Thử kết nối lại
        </button>
      </div>
    );
  if (!data) return <Auth onSuccess={refresh} admin={adminPage} />;
  if (adminPage || data.user.role === "admin")
    return (
      <>
        {data.user.role === "admin" ? (
          <Admin logout={logout} notify={notify} />
        ) : (
          <div className="loading-screen">
            <h1>Trang dành cho quản trị viên</h1>
            <button className="btn" onClick={() => (location.href = "/")}>
              Về ứng dụng
            </button>
            <button className="btn" onClick={logout}>
              Đổi tài khoản
            </button>
          </div>
        )}
        {toast && <Toast message={toast} onClose={closeToast} />}
      </>
    );
  if (!data.profile)
    return (
      <div className="loading-screen">
        <p>Hồ sơ chưa đầy đủ. Vui lòng đăng nhập lại.</p>
        <button className="btn" onClick={logout}>
          Đăng xuất
        </button>
      </div>
    );
  const Avatar = () =>
    data.profile!.avatar.startsWith("media:") ? (
      <img
        src={"/api/media/" + data.profile!.avatar.slice(6)}
        alt="Ảnh đại diện"
      />
    ) : (
      <span>{data.profile!.avatar}</span>
    );
  return (
    <div
      className={
        "app theme-" +
        data.profile.theme +
        (page === "dashboard" ? " journal-first" : "")
      }
    >
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <Brand />
        <p className="sidebar-intro">
          Cân bằng từ những
          <br />
          điều nhỏ mỗi ngày.
        </p>
        <nav aria-label="Điều hướng chính">
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              aria-current={page === id ? "page" : undefined}
              onClick={() => go(id)}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-leaf">
            <svg viewBox="0 0 80 100" aria-hidden="true">
              <path
                d="M40 95Q8 50 58 8Q82 47 36 62M38 76Q8 85 9 55Q31 49 38 76"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <p>
              Ăn tốt.
              <br />
              Sống khỏe.
              <br />
              Là chính mình.
            </p>
          </div>
          <button onClick={logout}>
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>
      {menu && (
        <button
          className="sidebar-scrim"
          aria-label="Đóng menu"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="app-body">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-btn menu-btn"
              aria-label="Mở menu"
              onClick={() => setMenu(!menu)}
            >
              <Menu />
            </button>
            <div className="mobile-brand">
              <Brand />
            </div>
            <div className="breadcrumb">
              NuTri Teens <span>/</span>{" "}
              {nav.find((n) => n[0] === page)?.[1] ?? "Tổng quan"}
            </div>
          </div>
          <div className="topbar-actions">
            <button className="xp-chip" onClick={() => go("profile")}>
              <Flame size={16} />
              {data.rewards.streak}
              <span>ngày</span>
              <span className="xp-divider" />
              <Sparkles size={14} />
              {data.rewards.xp}
              <span>XP</span>
            </button>
            <button
              className="icon-btn"
              aria-label="Cài đặt thông báo"
              onClick={() => go("profile")}
            >
              <Bell size={20} />
            </button>
            <button className="profile-chip" onClick={() => go("profile")}>
              <Avatar />
              <strong>{data.profile.name}</strong>
            </button>
          </div>
        </header>
        <main id="main-content" className="main-content">
          <a href="#main-content" className="sr-only skip-link">
            Đến nội dung chính
          </a>
          {["plan", "science", "world", "stats"].includes(page) && (
            <div className="mobile-subnav">
              <button
                className={page === "plan" ? "active" : ""}
                onClick={() => go("plan")}
              >
                Lộ trình
              </button>
              <button
                className={page === "science" ? "active" : ""}
                onClick={() => go("science")}
              >
                Khoa học
              </button>
              <button
                className={page === "world" ? "active" : ""}
                onClick={() => go("world")}
              >
                Ẩm thực
              </button>
              <button
                className={page === "stats" ? "active" : ""}
                onClick={() => go("stats")}
              >
                Thống kê
              </button>
            </div>
          )}
          {page === "diary" ? (
            <Diary {...props!} />
          ) : page === "stats" ? (
            <Statistics {...props!} />
          ) : page === "plan" ? (
            <Plan {...props!} />
          ) : page === "science" ? (
            <Explore {...props!} />
          ) : page === "world" ? (
            <WorldCuisine {...props!} />
          ) : page === "profile" ? (
            <Profile {...props!} logout={logout} />
          ) : (
            <Dashboard {...props!} />
          )}
          <footer className="app-footer">
            <Brand />
            <span>Hiểu bữa ăn · Chăm sóc bản thân · Mỗi ngày cân bằng</span>
          </footer>
        </main>
      </div>
      <button
        className="floating-chat"
        aria-label="Mở NuTri AI"
        onClick={() => setChat(true)}
      >
        <MessageCircle size={23} />
        <span>Hỏi NuTri</span>
      </button>
      <nav className="bottom-nav" aria-label="Điều hướng di động">
        <button
          className={page === "dashboard" ? "active" : ""}
          onClick={() => go("dashboard")}
        >
          <Home size={21} />
          <span>Trang chủ</span>
        </button>
        <button
          className={page === "diary" ? "active" : ""}
          onClick={() => go("diary")}
        >
          <NotebookPen size={21} />
          <span>Nhật ký</span>
        </button>
        <button className="bottom-scan" onClick={() => setMeal({})}>
          <span>
            <Camera size={24} />
          </span>
          <small>Quét món</small>
        </button>
        <button
          className={
            ["science", "world", "plan", "stats"].includes(page) ? "active" : ""
          }
          onClick={() => go("science")}
        >
          <FlaskConical size={21} />
          <span>Khám phá</span>
        </button>
        <button
          className={page === "profile" ? "active" : ""}
          onClick={() => go("profile")}
        >
          <UserRound size={21} />
          <span>Hồ sơ</span>
        </button>
      </nav>
      {meal && (
        <MealEditor
          initial={meal}
          aiConfigured={data.aiConfigured}
          onClose={() => setMeal(null)}
          onSaved={async () => {
            await refresh();
            notify("Đã lưu bữa ăn.");
          }}
        />
      )}
      {chat && (
        <Chat
          onClose={() => setChat(false)}
          configured={data.aiConfigured}
          name={data.profile.name}
          notify={notify}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
