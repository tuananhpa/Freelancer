import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Leaf,
  Check,
  ShieldCheck,
  ScanLine,
} from "lucide-react";
import { Brand, Note, Busy } from "./components";
import { api } from "./api";
import { defaultProfile, type Profile } from "./types";
import { avatars, goals } from "./catalog";
export default function Auth({
  onSuccess,
  admin = false,
}: {
  onSuccess: () => Promise<void>;
  admin?: boolean;
}) {
  const [signup, setSignup] = useState(false),
    [step, setStep] = useState(1),
    [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [profile, setProfile] = useState<Profile>({ ...defaultProfile }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const p = (key: keyof Profile, value: any) =>
    setProfile((v) => ({ ...v, [key]: value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (signup && step < 5) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      await api(signup ? "/auth/register" : "/auth/login", "POST", {
        username,
        password,
        ...(signup ? { profile } : {}),
      });
      await onSuccess();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <Brand />
        <div>
          <span className="pill">Mỗi ngày, một thói quen tốt</span>
          <h1>
            Ăn ngon.
            <br />
            Sống khỏe.
            <br />
            <span>Là chính mình.</span>
          </h1>
          <p>
            Một góc nhỏ để bạn hiểu bữa ăn, khám phá khoa học và chăm sóc bản
            thân theo cách của riêng mình.
          </p>
          <div className="auth-illustration">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="big-leaf">
              <Leaf size={112} />
            </div>
            <span className="float-chip chip-one">
              <ScanLine size={20} /> Ghi bữa ăn dễ dàng
            </span>
            <span className="float-chip chip-two">
              <Check size={20} /> Từng chút cân bằng
            </span>
          </div>
        </div>
        <p className="auth-foot">Dành cho tuổi teen · Tôn trọng cơ thể bạn</p>
      </aside>
      <main className="auth-main">
        <div className="mobile-brand">
          <Brand />
        </div>
        <div className="auth-card">
          <span className="eyebrow">
            {admin ? "Khu vực quản trị" : "Chào mừng đến NuTri Teens"}
          </span>
          <h2>
            {signup
              ? "Bắt đầu hành trình của bạn"
              : admin
                ? "Đăng nhập quản trị"
                : "Rất vui được gặp bạn"}
          </h2>
          <p className="muted">
            {signup
              ? "Tạo hồ sơ để nhật ký gần gũi hơn với bạn."
              : "Đăng nhập để tiếp tục những thói quen tốt."}
          </p>
          {!admin && (
            <div className="tabs">
              <button
                className={!signup ? "active" : ""}
                onClick={() => {
                  setSignup(false);
                  setError("");
                }}
              >
                Đăng nhập
              </button>
              <button
                className={signup ? "active" : ""}
                onClick={() => {
                  setSignup(true);
                  setError("");
                }}
              >
                Tạo tài khoản
              </button>
            </div>
          )}
          {signup && (
            <>
              <div className="wizard-progress">
                <span>Bước {step} / 5</span>
                <strong>
                  {
                    [
                      "Tài khoản",
                      "Thông tin cơ thể",
                      "Thói quen",
                      "Mục tiêu",
                      "Kiểm tra hồ sơ",
                    ][step - 1]
                  }
                </strong>
              </div>
              <div className="wizard-track">
                <span style={{ width: step * 20 + "%" }} />
              </div>
            </>
          )}
          <form onSubmit={submit}>
            {(!signup || step === 1) && (
              <>
                <label>
                  Tên đăng nhập
                  <input
                    required
                    autoComplete="username"
                    minLength={3}
                    maxLength={40}
                    pattern="[\p{L}\p{N}_.-]+"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ví dụ: minhanh14"
                  />
                </label>
                <label>
                  Mật khẩu
                  <input
                    required
                    type="password"
                    autoComplete={signup ? "new-password" : "current-password"}
                    minLength={8}
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ít nhất 8 ký tự"
                  />
                </label>
                {signup && (
                  <>
                    <label>
                      Biệt danh hiển thị
                      <input
                        required
                        maxLength={50}
                        value={profile.name}
                        onChange={(e) => p("name", e.target.value)}
                        placeholder="Bạn muốn NuTri gọi mình là gì?"
                      />
                    </label>
                    <div className="avatar-options">
                      {avatars.map((a) => (
                        <button
                          type="button"
                          key={a}
                          aria-label={"Chọn avatar " + a}
                          aria-pressed={profile.avatar === a}
                          className={profile.avatar === a ? "selected" : ""}
                          onClick={() => p("avatar", a)}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
            {signup && step === 2 && (
              <>
                <div className="form-grid">
                  <label>
                    Tuổi
                    <input
                      required
                      type="number"
                      min={10}
                      max={24}
                      value={profile.age}
                      onChange={(e) => p("age", +e.target.value)}
                    />
                  </label>
                  <label>
                    Giới tính
                    <select
                      value={profile.gender}
                      onChange={(e) => p("gender", e.target.value)}
                    >
                      <option value="other">Không muốn chia sẻ</option>
                      <option value="female">Nữ</option>
                      <option value="male">Nam</option>
                    </select>
                  </label>
                  <label>
                    Chiều cao (cm)
                    <input
                      required
                      type="number"
                      min={80}
                      max={230}
                      value={profile.height}
                      onChange={(e) => p("height", +e.target.value)}
                    />
                  </label>
                  <label>
                    Cân nặng (kg)
                    <input
                      required
                      type="number"
                      step=".1"
                      min={15}
                      max={220}
                      value={profile.weight}
                      onChange={(e) => p("weight", +e.target.value)}
                    />
                  </label>
                </div>
                <Note>
                  Thông tin giúp bạn theo dõi thay đổi theo thời gian. NuTri
                  không dùng BMI người lớn để kết luận thể trạng của teen.
                </Note>
              </>
            )}
            {signup && step === 3 && (
              <>
                <label>
                  Dị ứng thực phẩm (nếu có)
                  <input
                    maxLength={1000}
                    value={profile.allergies}
                    onChange={(e) => p("allergies", e.target.value)}
                    placeholder="Ví dụ: đậu phộng, sữa…"
                  />
                </label>
                <label>
                  Lưu ý sức khỏe (tùy chọn)
                  <textarea
                    maxLength={1000}
                    value={profile.conditions}
                    onChange={(e) => p("conditions", e.target.value)}
                    placeholder="Chỉ chia sẻ điều bạn thấy thoải mái."
                  />
                </label>
                <label>
                  Giới hạn vận động (nếu có)
                  <input
                    maxLength={1000}
                    value={profile.mobility}
                    onChange={(e) => p("mobility", e.target.value)}
                    placeholder="Ví dụ: cần bài tập ngồi, tránh chạy…"
                  />
                </label>
                <label>
                  Thói quen ăn uống, ngủ và vận động
                  <textarea
                    maxLength={1000}
                    value={profile.habits}
                    onChange={(e) => p("habits", e.target.value)}
                    placeholder="Giờ ngủ, món yêu thích, lịch học…"
                  />
                </label>
              </>
            )}
            {signup && step === 4 && (
              <>
                <div className="goal-options">
                  {goals.map((g) => (
                    <button
                      type="button"
                      key={g}
                      aria-pressed={profile.goal === g}
                      className={profile.goal === g ? "selected" : ""}
                      onClick={() => p("goal", g)}
                    >
                      <span>{g}</span>
                      {profile.goal === g && <Check size={18} />}
                    </button>
                  ))}
                </div>
                <label>
                  Mục tiêu của mình
                  <textarea
                    maxLength={500}
                    value={profile.goal}
                    onChange={(e) => p("goal", e.target.value)}
                  />
                </label>
              </>
            )}
            {signup && step === 5 && (
              <>
                <div className="profile-review">
                  <span className="avatar-large">{profile.avatar}</span>
                  <h3>{profile.name}</h3>
                  <p>
                    {profile.age} tuổi · {profile.height} cm · {profile.weight}{" "}
                    kg
                  </p>
                  <p>{profile.goal}</p>
                </div>
                <Note>
                  Mục tiêu khởi đầu: 2.000 kcal và 2.000 ml nước/ngày, dùng để
                  bố trí nhật ký tham khảo. Bạn có thể điều chỉnh trong hồ sơ
                  theo hướng dẫn phù hợp; đây không phải chỉ định dinh dưỡng cá
                  nhân.
                </Note>
                <p className="muted small-text">
                  Chỉ nhập thông tin cần thiết. Sau khi đăng nhập, bạn có thể
                  chủ động yêu cầu NuTri AI phân tích hồ sơ nếu Gemini đã được
                  cấu hình.
                </p>
              </>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="actions">
              {signup && step > 1 && (
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft size={17} />
                  Quay lại
                </button>
              )}
              <button className="btn primary grow" disabled={busy}>
                {busy ? (
                  <Busy />
                ) : signup ? (
                  step < 5 ? (
                    "Tiếp theo"
                  ) : (
                    "Tạo tài khoản"
                  )
                ) : (
                  "Đăng nhập"
                )}
                {!busy && <ArrowRight size={17} />}
              </button>
            </div>
          </form>
          <p className="auth-security">
            <ShieldCheck size={15} /> Dữ liệu riêng theo từng tài khoản
          </p>
        </div>
      </main>
    </div>
  );
}
