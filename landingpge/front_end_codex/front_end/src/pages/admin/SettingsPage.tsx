import { useState, useEffect, useRef, type FormEvent } from "react";
import { Save, Plug, MessageCircle } from "lucide-react";
import { useResource } from "../../hooks/useResource";
import { repository, isMock } from "../../services";
import { apiBase } from "../../services/apiRepository";
import type { Settings } from "../../types/domain";
import { useNotice } from "../../app/providers";
import { Loading, ErrorState } from "../../components/common";
import { normalizeSettings } from "../../services/contacts";
import { SocialLinksEditor } from "./SocialLinksEditor";
import { AppearanceEditor } from "./AppearanceEditor";
import { MediaUploadProvider, useMediaUploadState } from "./MediaUploadState";
export default function SettingsPage() {
  return (
    <MediaUploadProvider>
      <SettingsForm />
    </MediaUploadProvider>
  );
}
function SettingsForm() {
  const uploads = useMediaUploadState();
  const { data, loading, error, reload } = useResource(() =>
    repository.settings.get(),
  );
  const [form, setForm] = useState<Settings>(() => normalizeSettings({}));
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [logoSaving, setLogoSaving] = useState(false);
  const logoQueue = useRef(Promise.resolve());
  const logoVersion = useRef(0);
  const notify = useNotice();
  function updateAppearance(updates: Partial<Settings>) {
    setForm((prev) => ({ ...prev, ...updates }));
    if (
      !["brandLogo", "brandName", "brandTagline", "brandLogoMode"].some(
        (key) => key in updates,
      )
    )
      return;
    const version = ++logoVersion.current;
    setLogoSaving(true);
    setFormError("");
    window.dispatchEvent(
      new CustomEvent("hytales:brand-preview", {
        detail: updates,
      }),
    );
    logoQueue.current = logoQueue.current.then(async () => {
      try {
        const current = await repository.settings.get();
        await repository.settings.save({
          ...current,
          ...updates,
        });
        if (version === logoVersion.current) {
          window.dispatchEvent(new Event("hytales:settings-updated"));
          notify("Đã lưu thông tin thương hiệu.");
        }
      } catch (error) {
        if (version === logoVersion.current) {
          setFormError(
            `Không lưu được thương hiệu: ${(error as Error).message}`,
          );
          window.dispatchEvent(new Event("hytales:settings-updated"));
        }
      } finally {
        if (version === logoVersion.current) setLogoSaving(false);
      }
    });
  }
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (logoSaving || uploads.busy) return;
    setBusy(true);
    setFormError("");
    try {
      await repository.settings.save(form);
      window.dispatchEvent(new Event("hytales:settings-updated"));
      notify("Đã lưu thiết lập liên hệ.");
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Nền tảng cho những kết nối</p>
          <h1>Thiết lập</h1>
          <p>Thông tin liên hệ và trạng thái kết nối dữ liệu.</p>
          <a href="#logo-thuong-hieu" className="underlined-link">
            Tải file / thay logo HYTales
          </a>
        </div>
      </div>
      <div className="settings-grid">
        <form className="admin-panel form-stack" onSubmit={save}>
          <h2>
            <MessageCircle size={21} />
            Liên hệ công khai
          </h2>
          <label>
            Tên đơn vị
            <input
              value={form.organization}
              onChange={(e) =>
                setForm({ ...form, organization: e.target.value })
              }
              maxLength={100}
              required
            />
          </label>
          <label>
            Email liên hệ
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <SocialLinksEditor
            settings={form}
            onChange={(updates) => setForm((prev) => ({ ...prev, ...updates }))}
          />
          <AppearanceEditor settings={form} onChange={updateAppearance} />
          {logoSaving && <p role="status">Đang lưu thương hiệu…</p>}
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
          <button
            className="button"
            disabled={busy || uploads.busy || logoSaving}
          >
            <Save size={17} />
            {busy
              ? "Đang lưu…"
              : uploads.busy
                ? "Đang tải ảnh…"
                : "Lưu thiết lập"}
          </button>
        </form>
        <section className="admin-panel integration-panel">
          <span>
            <Plug size={28} />
          </span>
          <h2>Kết nối backend</h2>
          <dl>
            <dt>Nguồn dữ liệu</dt>
            <dd>{isMock ? "Mock · localStorage" : "API · cookie session"}</dd>
            <dt>API base URL</dt>
            <dd>{apiBase}</dd>
            <dt>Frontend</dt>
            <dd>React · TypeScript · Vite</dd>
          </dl>
          <p>
            Lớp service và DTO đã tách riêng. Chuyển VITE_DATA_MODE=api để gọi
            backend theo hợp đồng API trong docs/API_CONTRACT.md.
          </p>
          <div className="demo-note">
            Frontend chỉ điều hướng màn hình admin. Khi triển khai, backend phải
            xác thực, phân quyền, kiểm chứng hồ sơ và bảo vệ các API quản trị.
          </div>
        </section>
      </div>
    </>
  );
}
