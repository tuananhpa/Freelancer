import { useState } from "react";
import type { Settings } from "../../types/domain";
import { ManagedImageEditor } from "./ManagedImageEditor";
import { mediaLibrary } from "../../services/mediaLibrary";
import { repository } from "../../services";
import { useResource } from "../../hooks/useResource";
import { ImageFramingControls } from "../../components/ImageFramingControls";
export function AppearanceEditor({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (updates: Partial<Settings>) => void;
}) {
  const { data: assets, error } = useResource(async () => {
    const [media, reviews] = await Promise.all([
      mediaLibrary.list(),
      repository.reviews.list(),
    ]);
    const images = [
      ...media.filter((a) => a.kind === "image"),
      ...reviews
        .filter((r) => r.image)
        .map((r) => ({ url: r.image!, name: `Ảnh cảm nhận của ${r.name}` })),
    ];
    return images.filter(
      (a, i) => images.findIndex((other) => other.url === a.url) === i,
    );
  });
  const [selected, setSelected] = useState("");
  const asset = assets?.find((a) => a.url === selected) ?? assets?.[0];
  return (
    <section className="appearance-panel">
      <h2>Logo & khung ảnh</h2>
      <p className="quiet-note">
        Đổi logo, thay ảnh và chọn vùng ảnh hiển thị. Bấm Lưu thiết lập để áp
        dụng.
      </p>
      <div data-testid="brand-logo-editor">
        <ManagedImageEditor
          label="Logo HYTales"
          value={settings.brandLogo}
          logo
          onChange={(brandLogo) => onChange({ brandLogo })}
        />
      </div>
      {settings.storyImages.map((image, i) => (
        <div key={i} data-testid={`story-image-${i}`}>
          <ManagedImageEditor
            label={
              ["Người trồng", "Miền đất", "Mùa quả"][i] ||
              `Ảnh câu chuyện ${i + 1}`
            }
            value={image}
            removable={false}
            onChange={(updated) => {
              if (updated)
                onChange({
                  storyImages: settings.storyImages.map((item, n) =>
                    n === i ? updated : item,
                  ),
                });
            }}
          />
        </div>
      ))}
      <h3>Những ảnh khác trên website</h3>
      <p className="quiet-note">
        Chọn ảnh trong kho hoặc ảnh cảm nhận để chỉnh vùng hiển thị ở các khung
        dùng ảnh đó. Ảnh đại diện và bộ sưu tập cũng chỉnh riêng được trong
        trang Sản phẩm.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <label htmlFor="appearance-image">Ảnh cần chỉnh</label>
      <select
        id="appearance-image"
        value={asset?.url ?? ""}
        onChange={(e) => setSelected(e.target.value)}
      >
        {assets?.map((a) => (
          <option key={a.url} value={a.url}>
            {a.name}
          </option>
        ))}
      </select>
      {asset && (
        <ImageFramingControls
          src={asset.url}
          value={settings.imageDisplays[asset.url]}
          onChange={(display) =>
            onChange({
              imageDisplays: {
                ...settings.imageDisplays,
                [asset.url]: display,
              },
            })
          }
        />
      )}
    </section>
  );
}
