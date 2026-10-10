import { useState } from "react";
import { Check } from "lucide-react";
import { mediaLibrary, type MediaAsset } from "../../services/mediaLibrary";
import { useResource } from "../../hooks/useResource";
import { Modal, Loading, ErrorState } from "../../components/common";
import { MediaImage, MediaVideo } from "../../components/Media";
export function AssetPicker({
  kind,
  multiple,
  onSelect,
  onClose,
}: {
  kind: "image" | "video";
  multiple?: boolean;
  onSelect: (assets: MediaAsset[]) => void;
  onClose: () => void;
}) {
  const { data, loading, error, reload } = useResource(() =>
    mediaLibrary.list(),
  );
  const [selected, setSelected] = useState<string[]>([]);
  const assets = data?.filter((a) => a.kind === kind) ?? [];
  return (
    <Modal
      title={
        kind === "image" ? "Chọn ảnh từ thư viện" : "Chọn video từ thư viện"
      }
      wide
      onClose={onClose}
    >
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          <div className="media-library-grid">
            {assets.map((asset) => (
              <button
                type="button"
                key={asset.id}
                className={`media-library-item ${selected.includes(asset.id) ? "selected" : ""}`}
                onClick={() =>
                  setSelected((prev) =>
                    multiple
                      ? prev.includes(asset.id)
                        ? prev.filter((x) => x !== asset.id)
                        : [...prev, asset.id]
                      : [asset.id],
                  )
                }
                aria-pressed={selected.includes(asset.id)}
              >
                {asset.kind === "image" || asset.poster ? (
                  <MediaImage src={asset.poster || asset.url} alt="" />
                ) : (
                  <MediaVideo src={asset.url} preload="metadata" muted />
                )}
                <span>{asset.name}</span>
                {selected.includes(asset.id) && (
                  <Check className="media-check" size={18} />
                )}
              </button>
            ))}
          </div>
          {!assets.length && (
            <p>Thư viện chưa có file phù hợp. Bạn có thể tải từ máy.</p>
          )}
          <div className="media-picker-footer">
            <span>{selected.length} file được chọn</span>
            <button
              type="button"
              className="button"
              disabled={!selected.length}
              onClick={() => {
                onSelect(assets.filter((a) => selected.includes(a.id)));
                onClose();
              }}
            >
              {multiple
                ? "Thêm ảnh đã chọn"
                : kind === "image"
                  ? "Dùng ảnh này"
                  : "Dùng video này"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
