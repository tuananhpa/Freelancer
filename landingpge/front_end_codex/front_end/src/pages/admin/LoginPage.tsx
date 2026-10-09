import { useState, type FormEvent } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Leaf,
  LockKeyhole,
  ScanLine,
} from "lucide-react";
import { Brand } from "../../components/common";
import { useAuth } from "../../app/auth";
import { isMock } from "../../services";
export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/admin" replace />;
  async function enter(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    const f = e ? new FormData(e.currentTarget) : null;
    try {
      await login(
        String(f?.get("email") || ""),
        String(f?.get("password") || ""),
      );
      navigate("/admin");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <div className="login-story">
        <Brand light />
        <div>
          <Leaf size={44} />
          <h1>
            Gìn giữ chuyện quê.
            <br />
            Từ những điều
            <br />
            bạn chăm chút.
          </h1>
          <p>Không gian dành cho những người đứng sau mỗi thức quà.</p>
        </div>
        <span>
          <ScanLine size={18} />
          HYTales · Hộ chiếu di sản số
        </span>
      </div>
      <div className="login-form">
        <Link className="back-link" to="/">
          <ArrowLeft size={16} />
          Về trang trải nghiệm
        </Link>
        <div>
          <span className="login-icon">
            <LockKeyhole size={27} />
          </span>
          <h2>Không gian quản trị</h2>
          <p>
            Quản lý câu chuyện, lô hàng và những kết nối với người thưởng thức.
          </p>
          {isMock ? (
            <>
              <div className="demo-note">
                <strong>Bản demo frontend</strong>
                <p>
                  Phiên quản trị minh họa trên trình duyệt. Backend sẽ bổ sung
                  tài khoản, xác thực và phân quyền thật.
                </p>
              </div>
              <button
                className="button full-width"
                disabled={busy}
                onClick={() => void enter()}
              >
                Mở không gian demo
                <ArrowUpRight size={18} />
              </button>
            </>
          ) : (
            <form className="form-stack" onSubmit={enter}>
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  required
                />
              </label>
              <label>
                Mật khẩu
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>
              <button className="button" disabled={busy}>
                {busy ? "Đang đăng nhập…" : "Đăng nhập"}
              </button>
            </form>
          )}
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <small className="quiet-note">
            Người xem câu chuyện không cần đăng ký hoặc đăng nhập.
          </small>
        </div>
      </div>
    </main>
  );
}
