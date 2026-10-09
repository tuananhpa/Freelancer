import { useState, useRef } from "react";
import { Images, Upload, Trash2, ImagePlus, Film, Check } from "lucide-react";
import type { Product } from "../../types/domain";
import { mediaLibrary, type MediaAsset } from "../../services/mediaLibrary";
import { useResource } from "../../hooks/useResource";
import { Modal, Loading, ErrorState } from "../../components/common";
import { ImageFramingControls } from "../../components/ImageFramingControls";
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
export function ProductMediaEditor({
  product,
  onChange,
  onBusy,
  onError,
}: {
  product: Product;
  onChange: (patch: Partial<Product>) => void;
  onBusy: (busy: boolean) => void;
  onError: (message: string) => void;
}) {
  const [picker, setPicker] = useState<"image" | "video" | "gallery">();
  const [uploading, setUploading] = useState(false);
  const [framingGallery, setFramingGallery] = useState<number>();
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  async function upload(
    files: FileList | null,
    target: "image" | "video" | "gallery",
  ) {
    if (!files?.length) return;
    setUploading(true);
    onBusy(true);
    onError("");
    try {
      const assets: MediaAsset[] = [];
      for (const file of Array.from(files))
        assets.push(await mediaLibrary.upload(file));
      if (target === "gallery")
        onChange({
          gallery: [...product.gallery, ...assets.map((a) => a.url)],
        });
      else onChange({ [target]: assets[0].url });
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setUploading(false);
      onBusy(false);
      const input =
        target === "image"
          ? imageInput.current
          : target === "video"
            ? videoInput.current
            : galleryInput.current;
      if (input) input.value = "";
    }
  }
  return (
    <>
      <section className="media-editor-section">
        <div className="panel-heading">
          <h3>
            <ImagePlus size={18} />
            Ảnh đại diện
          </h3>
          {product.image && (
            <button
              className="button button-danger button-small"
              type="button"
              disabled={uploading}
              onClick={() => onChange({ image: "" })}
            >
              <Trash2 size={15} />
              Xóa ảnh đại diện
            </button>
          )}
        </div>
        {product.image ? (
          <MediaImage
            className="editor-image-preview"
            src={product.image}
            display={product.imageDisplay}
            alt="Ảnh đại diện sản phẩm"
          />
        ) : (
          <div className="media-empty">
            <ImagePlus size={27} />
            Chưa có ảnh đại diện
          </div>
        )}
        <div className="media-actions">
          <button
            className="button button-outline button-small"
            type="button"
            disabled={uploading}
            onClick={() => setPicker("image")}
          >
            <Images size={16} />
            Chọn ảnh từ thư viện
          </button>
          <button
            className="button button-small"
            type="button"
            disabled={uploading}
            onClick={() => imageInput.current?.click()}
          >
            <Upload size={16} />
            Tải ảnh từ máy
          </button>
          <input
            ref={imageInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            aria-label="Tải ảnh đại diện"
            onChange={(e) => void upload(e.target.files, "image")}
          />
        </div>
        {product.image && (
          <div data-testid="product-cover-framing">
            <ImageFramingControls
              src={product.image}
              value={product.imageDisplay}
              onChange={(imageDisplay) => onChange({ imageDisplay })}
            />
          </div>
        )}
      </section>
      <section className="media-editor-section">
        <div className="panel-heading">
          <h3>
            <Film size={18} />
            Video câu chuyện
          </h3>
          {product.video && (
            <button
              className="button button-danger button-small"
              type="button"
              disabled={uploading}
              onClick={() => onChange({ video: "" })}
            >
              <Trash2 size={15} />
              Xóa video
            </button>
          )}
        </div>
        {product.video ? (
          <MediaVideo
            className="editor-video-preview"
            display={product.imageDisplay}
            src={product.video}
            poster={product.image}
            controls
            preload="metadata"
          />
        ) : (
          <div className="media-empty">
            <Film size={27} />
            Chưa có video câu chuyện
          </div>
        )}
        <div className="media-actions">
          <button
            className="button button-outline button-small"
            type="button"
            disabled={uploading}
            onClick={() => setPicker("video")}
          >
            <Images size={16} />
            Chọn video từ thư viện
          </button>
          <button
            className="button button-small"
            type="button"
            disabled={uploading}
            onClick={() => videoInput.current?.click()}
          >
            <Upload size={16} />
            Tải video từ máy
          </button>
          <input
            ref={videoInput}
            type="file"
            accept="video/mp4,video/webm"
            hidden
            aria-label="Tải video câu chuyện"
            onChange={(e) => void upload(e.target.files, "video")}
          />
        </div>
      </section>
      <section className="media-editor-section">
        <div className="panel-heading">
          <h3>
            <Images size={18} />
            Bộ sưu tập ảnh
          </h3>
          <small>{product.gallery.length} ảnh</small>
        </div>
        <div className="gallery-editor-grid">
          {product.gallery.map((src, i) => (
            <div key={`${src}-${i}`}>
              <MediaImage
                src={src}
                display={product.galleryDisplays?.[src]}
                alt={`Ảnh bộ sưu tập ${i + 1}`}
              />
              <button
                type="button"
                className="button button-small button-outline gallery-framing-button"
                onClick={() => setFramingGallery(i)}
              >
                Chỉnh khung ảnh {i + 1}
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={`Xóa ảnh bộ sưu tập ${i + 1}`}
                disabled={uploading}
                onClick={() =>
                  onChange({
                    gallery: product.gallery.filter((_, n) => n !== i),
                  })
                }
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
        {product.gallery.map((src, i) => (
          <details
            key={`frame-${src}-${i}`}
            open={framingGallery === i}
            onToggle={(e) => {
              if (e.currentTarget.open) setFramingGallery(i);
            }}
            data-testid={`gallery-framing-${i}`}
          >
            <summary>Vùng hiển thị ảnh {i + 1}</summary>
            <ImageFramingControls
              src={src}
              value={product.galleryDisplays?.[src]}
              onChange={(display) =>
                onChange({
                  galleryDisplays: {
                    ...product.galleryDisplays,
                    [src]: display,
                  },
                })
              }
            />
          </details>
        ))}
        {!product.gallery.length && (
          <div className="media-empty">
            Thêm những khoảnh khắc của sản phẩm và người trồng.
          </div>
        )}
        <div className="media-actions">
          <button
            className="button button-outline button-small"
            type="button"
            disabled={uploading}
            onClick={() => setPicker("gallery")}
          >
            <Images size={16} />
            Thêm ảnh từ thư viện
          </button>
          <button
            className="button button-small"
            type="button"
            disabled={uploading}
            onClick={() => galleryInput.current?.click()}
          >
            <Upload size={16} />
            Tải thêm ảnh từ máy
          </button>
          <input
            ref={galleryInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            aria-label="Tải ảnh bộ sưu tập"
            onChange={(e) => void upload(e.target.files, "gallery")}
          />
        </div>
      </section>
      <small className="quiet-note">
        Ảnh JPG/PNG/WebP tối đa 12 MB · Video MP4/WebM tối đa 300 MB.
      </small>
      {uploading && <p role="status">Đang lưu file vào thư viện…</p>}
      {picker && (
        <AssetPicker
          kind={picker === "video" ? "video" : "image"}
          multiple={picker === "gallery"}
          onClose={() => setPicker(undefined)}
          onSelect={(assets) => {
            if (picker === "gallery")
              onChange({
                gallery: [...product.gallery, ...assets.map((a) => a.url)],
              });
            else onChange({ [picker]: assets[0].url });
          }}
        />
      )}
    </>
  );
}
