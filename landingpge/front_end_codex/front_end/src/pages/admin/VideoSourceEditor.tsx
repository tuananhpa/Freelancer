import { useRef, useState } from "react";
import { Upload, Images, Trash2 } from "lucide-react";
import { MediaVideo } from "../../components/Media";
import { mediaLibrary } from "../../services/mediaLibrary";
import { AssetPicker } from "./AssetPicker";
import { useMediaUploadState } from "./MediaUploadState";

export function VideoSourceEditor({
  label,
  value,
  poster,
  onChange,
}: {
  label: string;
  value?: string;
  poster?: string;
  onChange: (source: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const uploads = useMediaUploadState();
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    uploads.start();
    setError("");
    try {
      if (!["video/mp4", "video/webm"].includes(file.type))
        throw new Error("Chọn video MP4 hoặc WebM.");
      const asset = await mediaLibrary.upload(file);
      onChange(asset.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      uploads.finish();
      if (input.current) input.current.value = "";
    }
  }
  return (
    <section className="media-editor-section" aria-label={label}>
      <h3>{label}</h3>
      {value ? (
        <MediaVideo
          className="editor-video-preview"
          src={value}
          poster={poster}
          controls
          preload="metadata"
        />
      ) : (
        <p className="media-empty">Chưa có {label.toLowerCase()}.</p>
      )}
      <div className="media-actions">
        <button
          type="button"
          className="button button-small"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          <Upload size={16} />
          {value ? "Thay video từ máy" : "Tải video từ máy"}
        </button>
        <button
          type="button"
          className="button button-outline button-small"
          disabled={busy}
          onClick={() => setPicker(true)}
        >
          <Images size={16} />
          Chọn video từ thư viện
        </button>
        {value && (
          <button
            type="button"
            className="button button-danger button-small"
            disabled={busy}
            onClick={() => onChange("")}
          >
            <Trash2 size={16} />
            Xóa video
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept="video/mp4,video/webm"
          hidden
          aria-label={`Tải ${label}`}
          onChange={(e) => void upload(e.target.files?.[0])}
        />
      </div>
      {busy && <p role="status">Đang lưu video vào thư viện…</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {picker && (
        <AssetPicker
          kind="video"
          onClose={() => setPicker(false)}
          onSelect={(assets) => onChange(assets[0].url)}
        />
      )}
    </section>
  );
}
