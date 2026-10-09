import { useState, useRef } from "react";
import { ImagePlus, Trash2, Images } from "lucide-react";
import type { ManagedImage } from "../../types/domain";
import { mediaLibrary } from "../../services/mediaLibrary";
import { ImageFramingControls } from "../../components/ImageFramingControls";
import { AssetPicker } from "./ProductMediaEditor";
import { useMediaUploadState } from "./MediaUploadState";
export function ManagedImageEditor({
  label,
  value,
  onChange,
  logo = false,
  removable = true,
}: {
  label: string;
  value?: ManagedImage;
  onChange: (image?: ManagedImage) => void;
  logo?: boolean;
  removable?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const uploads = useMediaUploadState();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [picker, setPicker] = useState(false);
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    uploads.start();
    try {
      const asset = await mediaLibrary.upload(file);
      onChange({
        src: asset.url,
        display: { fit: logo ? "contain" : "cover", x: 50, y: 50 },
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      uploads.finish();
      if (input.current) input.current.value = "";
    }
  }
  return (
    <div className="managed-image-editor">
      <h3>{label}</h3>
      <div className="managed-image-actions">
        <button
          type="button"
          className="button button-small"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          <ImagePlus size={16} />
          {busy ? "Đang tải…" : "Tải ảnh / logo"}
        </button>
        <button
          type="button"
          className="button button-small button-outline"
          disabled={busy}
          onClick={() => setPicker(true)}
        >
          <Images size={16} />
          Chọn từ thư viện
        </button>
        {value?.src && removable && (
          <button
            type="button"
            disabled={busy}
            className="button button-small button-danger"
            onClick={() => onChange(undefined)}
          >
            <Trash2 size={16} />
            Gỡ ảnh
          </button>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          ref={input}
          aria-label={`Tải ${label}`}
          onChange={(e) => void upload(e.target.files?.[0])}
        />
      </div>
      {value?.src && (
        <ImageFramingControls
          src={value.src}
          value={value.display}
          logo={logo}
          onChange={(display) => onChange({ ...value, display })}
        />
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {picker && (
        <AssetPicker
          kind="image"
          onClose={() => setPicker(false)}
          onSelect={(assets) =>
            onChange({
              src: assets[0].url,
              display: { fit: logo ? "contain" : "cover", x: 50, y: 50 },
            })
          }
        />
      )}
    </div>
  );
}
