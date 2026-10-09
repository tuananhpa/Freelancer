import { Plus, Trash2 } from "lucide-react";
import type { Settings, SocialLink, SocialPlatform } from "../../types/domain";
import { socialPlatforms } from "../../services/contacts";
import { SocialIcon } from "../../components/SocialWidgets";
import { ManagedImageEditor } from "./ManagedImageEditor";
export function SocialLinksEditor({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (updates: Partial<Settings>) => void;
}) {
  function patch(id: string, updates: Partial<SocialLink>) {
    onChange({
      socialLinks: settings.socialLinks.map((link) =>
        link.id === id ? { ...link, ...updates } : link,
      ),
    });
  }
  return (
    <section className="social-editor">
      <div className="panel-heading">
        <h2>Widget liên hệ nổi</h2>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.socialWidgetEnabled}
            onChange={(e) =>
              onChange({ socialWidgetEnabled: e.target.checked })
            }
          />
          Hiển thị widget
        </label>
      </div>
      <p className="quiet-note">
        Thêm các kênh bạn muốn dùng. Kênh chưa có liên kết hoặc đã tắt sẽ không
        hiển thị trên website.
      </p>
      <div className="social-links-list">
        {settings.socialLinks.map((link, i) => (
          <article className="social-link-editor" key={link.id}>
            <div className="panel-heading">
              <span>
                <SocialIcon platform={link.platform} icon={link.icon} />
                <strong>Kênh {i + 1}</strong>
              </span>
              <div className="social-row-actions">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={link.enabled}
                    onChange={(e) =>
                      patch(link.id, { enabled: e.target.checked })
                    }
                    aria-label={`Hiển thị ${link.label}`}
                  />
                  Hiển thị
                </label>
                <button
                  type="button"
                  className="icon-button danger-icon"
                  aria-label={`Xóa kênh ${link.label}`}
                  onClick={() =>
                    onChange({
                      socialLinks: settings.socialLinks.filter(
                        (x) => x.id !== link.id,
                      ),
                    })
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
            <div className="form-grid">
              <label>
                Nền tảng
                <select
                  aria-label={`Nền tảng kênh ${i + 1}`}
                  value={link.platform}
                  onChange={(e) => {
                    const platform = e.target.value as SocialPlatform;
                    patch(link.id, {
                      platform,
                      label: socialPlatforms.find((p) => p.value === platform)!
                        .label,
                    });
                  }}
                >
                  {socialPlatforms.map((p) => (
                    <option value={p.value} key={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tên hiển thị
                <input
                  aria-label={`Tên hiển thị kênh ${i + 1}`}
                  value={link.label}
                  onChange={(e) => patch(link.id, { label: e.target.value })}
                  required
                  maxLength={40}
                />
              </label>
            </div>
            <label>
              Liên kết
              <input
                aria-label={`Liên kết ${link.label}`}
                type="url"
                value={link.url}
                onChange={(e) => patch(link.id, { url: e.target.value })}
                placeholder={
                  link.platform === "zalo"
                    ? "https://zalo.me/…"
                    : `https://${link.platform === "website" ? "example.com" : link.platform + ".com"}/…`
                }
              />
            </label>
            <details className="social-logo-details">
              <summary>Chỉnh logo {link.label}</summary>
              <ManagedImageEditor
                label={`Logo ${link.label}`}
                value={link.icon}
                logo
                onChange={(icon) => patch(link.id, { icon })}
              />
            </details>
          </article>
        ))}
      </div>
      <button
        type="button"
        className="button button-outline button-small"
        onClick={() => {
          const platform =
            socialPlatforms.find(
              (p) => !settings.socialLinks.some((x) => x.platform === p.value),
            ) || socialPlatforms[0];
          onChange({
            socialLinks: [
              ...settings.socialLinks,
              {
                id: crypto.randomUUID(),
                platform: platform.value,
                label: platform.label,
                url: "",
                enabled: true,
              },
            ],
          });
        }}
      >
        <Plus size={16} />
        Thêm kênh liên hệ
      </button>
    </section>
  );
}
