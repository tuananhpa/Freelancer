import { useState, useEffect } from "react";
import {
  Save,
  Upload,
  Sparkles,
  Trophy,
  Flame,
  Shield,
  Download,
  LogOut,
  Bell,
  Volume2,
  Database,
  Lock,
  Plus,
  Monitor,
  Check,
  Scale,
} from "lucide-react";
import { PageTitle, Note, Busy, Modal } from "./components";
import { api, uploadImage, subscribePush } from "./api";
import { avatars, goals, recipes } from "./catalog";
import type { Profile as P } from "./types";
import type { ViewProps } from "./view-types";
export default function Profile(
  props: ViewProps & { logout: () => Promise<void> },
) {
  const { data } = props;
  const [p, setP] = useState<P>({ ...data.profile! }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [passwordModal, setPasswordModal] = useState(false),
    [current, setCurrent] = useState(""),
    [next, setNext] = useState(""),
    [weight, setWeight] = useState(String(data.profile!.weight || "")),
    [settings, setSettings] = useState({ ...data.settings });
  useEffect(() => {
    setSettings({ ...data.settings });
  }, [data.settings]);
  const change = (key: keyof P, value: any) =>
    setP((v) => ({ ...v, [key]: value }));
  async function perform(fn: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await props.refresh();
      props.notify(message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    await perform(() => api("/profile", "PUT", p), "Đã lưu hồ sơ.");
  }
  async function setting(key: string, value: any) {
    const s = { ...settings, [key]: value };
    setSettings(s);
    try {
      await api("/settings", "PUT", s);
      await props.refresh();
    } catch (e) {
      setSettings({ ...data.settings });
      props.notify((e as Error).message);
    }
  }
  async function push() {
    if (!data.pushPublicKey) return;
    await perform(async () => {
      await subscribePush(data.pushPublicKey!);
      await api("/settings", "PUT", { ...settings, pushEnabled: true });
    }, "Đã bật thông báo trên thiết bị này.");
  }
  const challenges = data.progress.filter((x) => x.kind === "challenge");
  return (
    <>
      <PageTitle
        title="Một chút về bạn"
        description="Hồ sơ, thành tích và những tùy chỉnh riêng."
      />
      <div className="profile-stats">
        <article>
          <Flame />
          <strong>{data.rewards.streak}</strong>
          <span>Ngày hoạt động liên tiếp</span>
        </article>
        <article>
          <Sparkles />
          <strong>{data.rewards.xp}</strong>
          <span>Điểm XP đã tích lũy</span>
        </article>
        <article>
          <Trophy />
          <strong>{challenges.length}</strong>
          <span>Thành tích đầu bếp</span>
        </article>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <form onSubmit={save}>
        <section className="panel">
          <div className="section-head">
            <h2>Thông tin cá nhân</h2>
            <button className="btn primary" disabled={busy}>
              {busy ? (
                <Busy />
              ) : (
                <>
                  <Save size={17} />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
          <div className="avatar-edit">
            {p.avatar.startsWith("media:") ? (
              <img
                className="avatar-large"
                src={"/api/media/" + p.avatar.slice(6)}
                alt="Ảnh đại diện"
              />
            ) : (
              <span className="avatar-large">{p.avatar}</span>
            )}
            <div>
              <label className="file-label compact">
                <Upload size={16} />
                Tải ảnh đại diện
                <input
                  type="file"
                  disabled={busy}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f)
                      perform(async () => {
                        const id = await uploadImage(f);
                        const np = { ...p, avatar: "media:" + id };
                        await api("/profile", "PUT", np);
                        setP(np);
                      }, "Đã cập nhật ảnh đại diện.");
                  }}
                />
              </label>
              <div className="avatar-options">
                {avatars.map((a) => (
                  <button
                    type="button"
                    key={a}
                    aria-label={"Avatar " + a}
                    aria-pressed={p.avatar === a}
                    className={p.avatar === a ? "selected" : ""}
                    onClick={() => change("avatar", a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-grid">
            <label>
              Biệt danh
              <input
                required
                maxLength={50}
                value={p.name}
                onChange={(e) => change("name", e.target.value)}
              />
            </label>
            <label>
              Tuổi
              <input
                required
                type="number"
                min="10"
                max="24"
                value={p.age || ""}
                onChange={(e) => change("age", +e.target.value)}
              />
            </label>
            <label>
              Chiều cao (cm)
              <input
                required
                type="number"
                min="80"
                max="230"
                value={p.height || ""}
                onChange={(e) => change("height", +e.target.value)}
              />
            </label>
            <label>
              Cân nặng (kg)
              <input
                required
                type="number"
                min="15"
                max="220"
                step=".1"
                value={p.weight || ""}
                onChange={(e) => change("weight", +e.target.value)}
              />
            </label>
          </div>
          <label>
            Mục tiêu
            <select
              value={goals.includes(p.goal) ? p.goal : "custom"}
              onChange={(e) => {
                if (e.target.value !== "custom") change("goal", e.target.value);
              }}
            >
              {goals.map((g) => (
                <option key={g}>{g}</option>
              ))}
              <option value="custom">Mục tiêu riêng</option>
            </select>
            <textarea
              maxLength={500}
              value={p.goal}
              onChange={(e) => change("goal", e.target.value)}
            />
          </label>
          <div className="form-grid">
            <label>
              Dị ứng
              <input
                maxLength={1000}
                value={p.allergies}
                onChange={(e) => change("allergies", e.target.value)}
              />
            </label>
            <label>
              Lưu ý sức khỏe
              <input
                maxLength={1000}
                value={p.conditions}
                onChange={(e) => change("conditions", e.target.value)}
              />
            </label>
            <label>
              Giới hạn vận động
              <textarea
                maxLength={1000}
                value={p.mobility}
                onChange={(e) => change("mobility", e.target.value)}
              />
            </label>
            <label>
              Ăn uống, ngủ và sinh hoạt
              <textarea
                maxLength={1000}
                value={p.habits}
                onChange={(e) => change("habits", e.target.value)}
              />
            </label>
          </div>
          <h3>Mục tiêu trong nhật ký</h3>
          <Note>
            Các giá trị khởi đầu là tham khảo. Nếu bạn còn đang phát triển, hãy
            điều chỉnh cùng người lớn hoặc chuyên gia; không dùng để tự ép giảm
            cân.
          </Note>
          <div className="form-grid four">
            {[
              ["calorieTarget", "Năng lượng (kcal)", 1200, 4500],
              ["waterTarget", "Nước (ml)", 500, 5000],
              ["proteinTarget", "Đạm (g)", 20, 250],
              ["carbsTarget", "Tinh bột (g)", 50, 600],
              ["fatTarget", "Chất béo (g)", 20, 180],
            ].map(([key, label, min, max]) => (
              <label key={key}>
                {label}
                <input
                  required
                  type="number"
                  min={min}
                  max={max}
                  value={p[key as keyof P] as number}
                  onChange={(e) => change(key as keyof P, +e.target.value)}
                />
              </label>
            ))}
          </div>
          <h3>Không gian của bạn</h3>
          <div className="theme-options">
            {[
              ["balance", "Cân bằng"],
              ["garden", "Vườn xanh"],
              ["berry", "Sắc tím"],
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                className={p.theme === id ? "selected " + id : id}
                onClick={() => change("theme", id)}
              >
                <span />
                {label}
              </button>
            ))}
          </div>
        </section>
      </form>
      <section className="panel">
        <div className="section-head">
          <h2>
            <Sparkles size={20} />
            NuTri hiểu bạn hơn
          </h2>
          <button
            className="btn"
            disabled={busy || !data.aiConfigured}
            onClick={() =>
              perform(
                () => api("/ai/profile", "POST", {}),
                "Đã cập nhật gợi ý từ hồ sơ.",
              )
            }
          >
            <Sparkles size={17} />
            Phân tích hồ sơ đã lưu
          </button>
        </div>
        <p className="muted">
          Khi bấm phân tích, thông tin hồ sơ đã lưu được gửi tới Gemini để tạo
          gợi ý.
        </p>
        {data.profile?.analysis ? (
          <>
            <p>{data.profile.analysis.summary}</p>
            <div className="split">
              {(["nutrition", "movement", "habits", "cautions"] as const).map(
                (k) => (
                  <section key={k}>
                    <h3>
                      {
                        {
                          nutrition: "Dinh dưỡng",
                          movement: "Vận động",
                          habits: "Thói quen",
                          cautions: "Lưu ý",
                        }[k]
                      }
                    </h3>
                    <ul>
                      {data.profile!.analysis![k].map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </section>
                ),
              )}
            </div>
          </>
        ) : (
          <Note>
            {data.aiConfigured
              ? "Chưa yêu cầu phân tích hồ sơ."
              : "Gemini chưa cấu hình. Các chức năng ghi nhật ký vẫn hoạt động."}
          </Note>
        )}
      </section>
      <section className="panel">
        <h2>
          <Scale size={20} />
          Ghi nhận cân nặng
        </h2>
        <div className="actions">
          <label className="inline-field">
            Cân nặng (kg)
            <input
              aria-label="Cân nặng mới"
              type="number"
              min="15"
              max="220"
              step=".1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </label>
          <button
            className="btn"
            disabled={busy}
            onClick={() =>
              perform(async () => {
                await api("/weight", "POST", { kg: Number(weight) });
                setP((v) => ({ ...v, weight: Number(weight) }));
              }, "Đã ghi nhận cân nặng.")
            }
          >
            <Plus size={17} />
            Ghi hôm nay
          </button>
        </div>
      </section>
      <section className="panel">
        <h2>
          <Trophy size={20} />
          Album thành tích
        </h2>
        {challenges.length ? (
          <div className="badge-grid">
            {challenges.map((c) => (
              <div key={c.item_id}>
                {c.data.imageId ? (
                  <img src={"/api/media/" + c.data.imageId} alt="Thành phẩm" />
                ) : (
                  <Trophy size={30} />
                )}
                <strong>
                  {recipes.find((r) => r.id === c.item_id)?.title}
                </strong>
                <span>+30 XP</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            Nấu một món mới trong mục Ẩm thực để ghi thành tích đầu tiên.
          </p>
        )}
        <button className="text-btn" onClick={() => props.go("world")}>
          Khám phá thử thách nấu ăn
        </button>
      </section>
      <section className="panel">
        <div className="section-head">
          <h2>
            <Bell size={20} />
            Nhắc nhở & âm thanh
          </h2>
          <button
            className="btn"
            disabled={busy || !data.pushConfigured}
            onClick={push}
          >
            Bật trên thiết bị này
          </button>
        </div>
        <Note>
          Thông báo khi đóng trình duyệt cần Web Push và lịch server đang chạy.
          Với bản local, dùng script lịch trong dự án. iPhone cần cài app vào
          Màn hình chính.
        </Note>
        <label className="switch-row">
          <span>
            <strong>Nhận thông báo nhắc nhở</strong>
            <small>Ăn uống, nghỉ ngơi và ghi nhật ký</small>
          </span>
          <input
            type="checkbox"
            checked={settings.pushEnabled}
            onChange={(e) => setting("pushEnabled", e.target.checked)}
          />
        </label>
        {[
          ["breakfast", "Bữa sáng", "07:15"],
          ["lunch", "Bữa trưa", "11:45"],
          ["snack", "Bữa phụ", "15:30"],
          ["dinner", "Bữa tối", "18:45"],
          ["water", "Uống nước", "Mỗi 2 giờ, 08–20h"],
          ["checkin", "Hỏi thăm", "16:30"],
          ["streak", "Nhìn lại hôm nay", "20:30"],
        ].map(([id, label, time]) => (
          <label className="switch-row" key={id}>
            <span>
              {label}
              <small>{time}</small>
            </span>
            <input
              type="checkbox"
              checked={!settings.disabled.includes(id)}
              onChange={(e) =>
                setting(
                  "disabled",
                  e.target.checked
                    ? settings.disabled.filter((v) => v !== id)
                    : [...settings.disabled, id],
                )
              }
            />
          </label>
        ))}
        <label className="switch-row">
          <span>Âm thanh khi ghi nước và rung thông báo</span>
          <input
            type="checkbox"
            checked={settings.sound}
            onChange={(e) => setting("sound", e.target.checked)}
          />
        </label>
        <div className="actions">
          <button
            className="btn"
            disabled={busy}
            onClick={() =>
              perform(async () => {
                const r = await api("/push/test", "POST", {});
                if (!r.sent)
                  throw new Error(
                    "Chưa gửi được. Hãy bật thông báo trên thiết bị này trước.",
                  );
              }, "Đã gửi thông báo thử.")
            }
          >
            <Bell size={17} />
            Thử thông báo
          </button>
          <button
            className="btn"
            onClick={() =>
              props.notify(
                "Chrome/Edge: menu trình duyệt → Cài đặt ứng dụng. Safari iPhone: Chia sẻ → Thêm vào Màn hình chính.",
              )
            }
          >
            <Monitor size={17} />
            Cài ra màn hình
          </button>
        </div>
      </section>
      <section className="panel">
        <h2>
          <Database size={20} />
          Sao lưu dữ liệu
        </h2>
        <p className="muted">
          Bản sao lưu riêng tư của hồ sơ, nhật ký và tiến trình. Không chứa mật
          khẩu hoặc API key.
        </p>
        <label className="switch-row">
          <span>
            Sao lưu tự động mỗi ngày<small>Cần lịch server hoạt động</small>
          </span>
          <input
            type="checkbox"
            checked={settings.autoBackup}
            onChange={(e) => setting("autoBackup", e.target.checked)}
          />
        </label>
        <p>
          Lần gần nhất:{" "}
          {data.backup
            ? new Date(data.backup.created_at).toLocaleString("vi-VN", {
                timeZone: "Asia/Saigon",
              })
            : "Chưa có"}
        </p>
        <div className="actions">
          <button
            className="btn"
            disabled={busy}
            onClick={() =>
              perform(() => api("/backup", "POST", {}), "Đã tạo bản sao lưu.")
            }
          >
            <Database size={17} />
            Sao lưu ngay
          </button>
          {data.backup && (
            <a className="btn" href={"/api/backup/" + data.backup.id} download>
              <Download size={17} />
              Tải bản sao lưu
            </a>
          )}
        </div>
      </section>
      <section className="panel">
        <h2>
          <Shield size={20} />
          Tài khoản
        </h2>
        <p className="muted">Tên đăng nhập: {data.user.username}</p>
        <div className="actions">
          <button className="btn" onClick={() => setPasswordModal(true)}>
            <Lock size={17} />
            Đổi mật khẩu
          </button>
          <button className="btn danger-text" onClick={props.logout}>
            <LogOut size={17} />
            Đăng xuất / Đổi tài khoản
          </button>
        </div>
      </section>
      {passwordModal && (
        <Modal title="Đổi mật khẩu" onClose={() => setPasswordModal(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await api("/password", "PUT", { current, next });
                setCurrent("");
                setNext("");
                await props.logout();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Mật khẩu hiện tại
              <input
                required
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </label>
            <label>
              Mật khẩu mới
              <input
                required
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <Note>Đổi mật khẩu sẽ đăng xuất các phiên đang hoạt động.</Note>
            <button className="btn primary" disabled={busy}>
              {busy ? <Busy /> : "Lưu mật khẩu mới"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
