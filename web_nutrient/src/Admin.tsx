import { useEffect, useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Save,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { Brand, Note, Busy } from "./components";
import { api } from "./api";
export default function Admin({
  logout,
  notify,
}: {
  logout: () => Promise<void>;
  notify: (s: string) => void;
}) {
  const [status, setStatus] = useState<{
      configured: boolean;
      updatedAt: string | null;
      model: string | null;
    } | null>(null),
    [key, setKey] = useState(""),
    [model, setModel] = useState("gemini-2.5-flash"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    api("/admin/gemini")
      .then((s) => {
        setStatus(s);
        if (s.model) setModel(s.model);
      })
      .catch((e) => setError(e.message));
  }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const nextKey = key;
    setKey("");
    try {
      setStatus(await api("/admin/gemini", "PUT", { key: nextKey, model }));
      notify("Đã cập nhật khóa Gemini.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-layout">
      <header>
        <Brand />
        <button className="btn" onClick={logout}>
          <LogOut size={17} />
          Đăng xuất
        </button>
      </header>
      <main className="admin-card panel">
        <span className="admin-icon">
          <ShieldCheck size={32} />
        </span>
        <span className="eyebrow">Quản trị NuTri Teens</span>
        <h1>Kết nối Gemini</h1>
        <p>Thay khóa dùng chung cho các chức năng AI của ứng dụng.</p>
        <div className="integration-status" role="status">
          <span className={"status-dot " + (status?.configured ? "on" : "")} />
          <strong>
            {status?.configured ? "Đã cấu hình" : "Chưa cấu hình"}
          </strong>
          <small>
            {status?.updatedAt
              ? "Cập nhật: " +
                new Date(status.updatedAt).toLocaleString("vi-VN", {
                  timeZone: "Asia/Saigon",
                })
              : "Chưa có lần cập nhật"}
          </small>
        </div>
        {status?.configured && (
          <>
            <button
              className="btn primary full"
              disabled={busy}
              onClick={() => window.location.assign("/")}
            >
              Về ứng dụng <ArrowRight size={17} />
            </button>
            <p className="muted small-text">
              Khóa đã được lưu, không cần nhập lại. Về trang chủ nhật ký
              bằng tài khoản hiện tại.
            </p>
          </>
        )}
        <Note>
          Chỉ gửi khóa mới. Server không trả lại khóa đã lưu; không có chức năng
          xem hoặc sao chép khóa hiện tại.
        </Note>
        <form onSubmit={save} autoComplete="off">
          <label>
            Gemini API key mới
            <input
              required
              type="password"
              autoComplete="new-password"
              name="new-gemini-secret"
              minLength={20}
              maxLength={200}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Dán khóa mới tại đây"
            />
          </label>
          <label>
            Model
            <input
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
              pattern="gemini-[a-zA-Z0-9.\-]+"
              placeholder="gemini-2.5-flash"
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn primary full" disabled={busy}>
            {busy ? (
              <Busy />
            ) : (
              <>
                <Save size={17} />
                Kiểm tra và thay khóa
              </>
            )}
          </button>
        </form>
        <p className="muted small-text">
          Khóa được kiểm tra với Google trước khi thay. Nếu thất bại, cấu hình
          cũ được giữ nguyên. Ô nhập luôn được xóa sau khi gửi.
        </p>
        <a
          className="text-btn"
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
        >
          Mở Google AI Studio <ExternalLink size={15} />
        </a>
      </main>
    </div>
  );
}
