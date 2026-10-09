import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Download,
  Copy,
  ScanLine,
  ImagePlus,
  ExternalLink,
  Trash2,
  Save,
} from "lucide-react";
import { repository, productUrl, qrUrl } from "../../services";
import { isWebUrl } from "../../services/contacts";
import { renderQr, exportQr } from "../../services/qr";
import { useResource } from "../../hooks/useResource";
import { useNotice } from "../../app/providers";
import { Loading, ErrorState } from "../../components/common";
import type { QrDestination, ImageDisplay } from "../../types/domain";
import { ImageFramingControls } from "../../components/ImageFramingControls";
import { imageDisplayStyle } from "../../services/imageDisplay";
export default function QrPage() {
  const {
    data: products,
    loading,
    error,
    reload,
  } = useResource(() => repository.products.list(true));
  const [params] = useSearchParams();
  const [selected, setSelected] = useState(params.get("product") || "");
  const [destination, setDestination] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [color, setColor] = useState("#294b35");
  const [logo, setLogo] = useState<string>();
  const [logoDisplay, setLogoDisplay] = useState<ImageDisplay>({
    fit: "contain",
    x: 50,
    y: 50,
  });
  const [logoName, setLogoName] = useState("");
  const logoInput = useRef<HTMLInputElement>(null);
  const [qr, setQr] = useState<{ png: string; svg: string }>();
  const [qrError, setQrError] = useState("");
  const [destinationError, setDestinationError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const notify = useNotice();
  const p = products?.find((p) => p.id === selected) || products?.[0];
  const url = p ? qrUrl(p.id) : "";
  const savedDestination =
    p?.qrDestination ??
    (p ? { kind: "product" as const, productId: p.id } : undefined);
  const savedTarget = products?.find(
    (x) =>
      x.id ===
      (savedDestination?.kind === "product" ? savedDestination.productId : ""),
  );
  const savedTargetUrl =
    savedDestination?.kind === "external"
      ? savedDestination.url
      : savedTarget
        ? productUrl(savedTarget.slug)
        : "";
  useEffect(() => {
    setDestination(
      p?.qrDestination?.kind === "external"
        ? "custom"
        : p?.qrDestination?.productId || p?.id || "",
    );
    setCustomUrl(
      p?.qrDestination?.kind === "external" ? p.qrDestination.url : "",
    );
    setDestinationError("");
  }, [p?.id, JSON.stringify(p?.qrDestination)]);
  useEffect(() => {
    let active = true;
    setQr(undefined);
    setQrError("");
    if (url)
      void renderQr(url, color, logo, logoDisplay)
        .then((r) => {
          if (active) setQr(r);
        })
        .catch((e) => {
          if (active) setQrError(e.message);
        });
    return () => {
      active = false;
    };
  }, [url, color, logo, logoDisplay]);
  async function applyDestination() {
    if (!p) return;
    setDestinationError("");
    let value: QrDestination;
    if (destination === "custom") {
      const trimmed = customUrl.trim();
      if (!isWebUrl(trimmed)) {
        setDestinationError("Nhập liên kết http:// hoặc https:// hợp lệ.");
        return;
      }
      const target = new URL(trimmed);
      if (
        target.origin === window.location.origin &&
        target.pathname.startsWith("/q/")
      ) {
        setDestinationError(
          "Hãy chọn sản phẩm từ danh sách thay vì nhập liên kết QR.",
        );
        return;
      }
      value = { kind: "external", url: trimmed };
    } else {
      if (!products?.some((x) => x.id === destination)) {
        setDestinationError("Hãy chọn một sản phẩm làm đích.");
        return;
      }
      value = { kind: "product", productId: destination };
    }
    setSaving(true);
    try {
      await repository.products.save({ ...p, qrDestination: value });
      reload();
      notify("Đã áp dụng đích đến. Mã QR được giữ nguyên.");
    } catch (e) {
      setDestinationError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 512 * 1024
    ) {
      setQrError("Logo cần là PNG, JPG hoặc WebP dưới 512 KB.");
      if (logoInput.current) logoInput.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogo(String(reader.result));
      setLogoDisplay({ fit: "contain", x: 50, y: 50 });
      setLogoName(file.name);
    };
    reader.readAsDataURL(file);
  }
  function removeLogo() {
    setLogo(undefined);
    setLogoName("");
    setQrError("");
    if (logoInput.current) logoInput.current.value = "";
  }
  async function download(format: "png" | "svg" | "pdf") {
    if (!p || !qr) return;
    setBusy(true);
    try {
      await exportQr(format, qr, `hytales-${p.slug}`);
      notify(`Đã tạo mã QR ${format.toUpperCase()} để tải về.`);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!p)
    return (
      <section className="admin-panel empty-inbox">
        <ScanLine size={36} />
        <h2>Chưa có sản phẩm để tạo QR.</h2>
        <p>Tạo sản phẩm đầu tiên để bắt đầu.</p>
        <Link className="button" to="/admin/products">
          Quản lý sản phẩm
        </Link>
      </section>
    );
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Cầu nối trên từng bao bì</p>
          <h1>Mã QR & tem nhãn</h1>
          <p>Chọn nơi câu chuyện được mở ra khi người dùng quét mã.</p>
        </div>
      </div>
      <div className="qr-layout">
        <section className="admin-panel form-stack">
          <h2>Tùy biến mã QR</h2>
          <label htmlFor="qr-product">Sản phẩm / lô hàng</label>
          <select
            id="qr-product"
            value={p.id}
            onChange={(e) => setSelected(e.target.value)}
          >
            {products?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.batchCode}
              </option>
            ))}
          </select>
          <div className="qr-destination-editor form-stack">
            <label htmlFor="qr-destination">Đường dẫn đích</label>
            <select
              id="qr-destination"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setDestinationError("");
              }}
            >
              {products
                ?.filter((x) => x.status === "published" || x.id === p.id)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    Câu chuyện: {item.name}
                    {item.id === p.id ? " (sản phẩm này)" : ""}
                  </option>
                ))}
              <option value="custom">Nhập liên kết riêng…</option>
            </select>
            {destination === "custom" && (
              <label htmlFor="qr-custom-url">
                Liên kết riêng
                <input
                  id="qr-custom-url"
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://…"
                />
              </label>
            )}
            {destinationError && (
              <p role="alert" className="form-error">
                {destinationError}
              </p>
            )}
            <button
              className="button button-small"
              disabled={saving}
              onClick={() => void applyDestination()}
            >
              <Save size={16} />
              {saving ? "Đang áp dụng…" : "Áp dụng đích đến"}
            </button>
            <small className="quiet-note">
              Đích hiện tại:{" "}
              {savedDestination?.kind === "external"
                ? savedDestination.url
                : savedTarget?.name || "Sản phẩm không còn tồn tại"}
              . Chọn đích rồi bấm Áp dụng để lưu.
            </small>
          </div>
          <button
            className="text-button"
            onClick={() =>
              void navigator.clipboard
                .writeText(url)
                .then(() => notify("Đã sao chép liên kết QR."))
                .catch(() =>
                  notify("Không sao chép được liên kết. Vui lòng thử lại."),
                )
            }
          >
            <Copy size={16} />
            Sao chép liên kết QR
          </button>
          <label>
            Màu mã QR
            <div className="color-input">
              <input
                type="color"
                aria-label="Màu mã QR"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <span>{color}</span>
            </div>
            <small>Chọn màu đậm trên nền trắng để máy ảnh dễ nhận diện.</small>
          </label>
          <div className="qr-logo-editor">
            <label className="upload-label">
              <ImagePlus size={17} />
              Chèn logo thương hiệu
              <input
                ref={logoInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label="Chọn logo thương hiệu"
                onChange={(e) => void upload(e.target.files?.[0])}
              />
            </label>
            {logo && (
              <div className="qr-logo-preview">
                <img
                  src={logo}
                  style={imageDisplayStyle(logoDisplay)}
                  alt="Logo đã chọn"
                />
                <span>{logoName}</span>
                <button
                  className="button button-danger button-small"
                  onClick={removeLogo}
                >
                  <Trash2 size={15} />
                  Xóa logo
                </button>
              </div>
            )}
          </div>
          {logo && (
            <div data-testid="qr-logo-framing">
              <ImageFramingControls
                src={logo}
                value={logoDisplay}
                onChange={setLogoDisplay}
                logo
              />
            </div>
          )}
          {p.status === "draft" && (
            <div className="demo-note">
              Sản phẩm đang là bản nháp. Hãy công khai trước khi sử dụng QR trên
              bao bì.
            </div>
          )}
          <div className="qr-help">
            <ScanLine size={23} />
            <div>
              <strong>Một mã QR, nhiều lần cập nhật.</strong>
              <p>
                Liên kết QR được hệ thống tự quản lý. Bạn có thể sửa câu chuyện
                hoặc chọn lại đích đến mà không cần in lại mã.
              </p>
            </div>
          </div>
        </section>
        <section className="admin-panel qr-preview">
          <p className="eyebrow">Bản xem trước tem nhãn</p>
          <div className="qr-label">
            <span className="qr-label-brand">
              HYTales<small>Chạm mã QR – Mở câu chuyện quê</small>
            </span>
            {qr ? (
              <img src={qr.png} alt={`Mã QR của ${p.name}`} />
            ) : (
              <div className="qr-placeholder">
                <ScanLine size={80} />
              </div>
            )}
            <strong>{p.name}</strong>
            <small>{p.batchCode}</small>
          </div>
          {qrError && (
            <p className="form-error" role="alert">
              {qrError}
            </p>
          )}
          <div className="qr-downloads">
            {(["png", "svg", "pdf"] as const).map((format) => (
              <button
                key={format}
                className="button button-outline"
                disabled={!qr || busy}
                onClick={() => void download(format)}
              >
                <Download size={15} />
                {format.toUpperCase()}
              </button>
            ))}
          </div>
          <small>PNG 1200 × 1200 px · SVG vector · PDF 100 × 100 mm</small>
          {savedTargetUrl && isWebUrl(savedTargetUrl) && (
            <a
              className="underlined-link"
              href={savedTargetUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mở trang đích
              <ExternalLink size={15} />
            </a>
          )}
          <a
            className="underlined-link"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Thử quét QR
            <ScanLine size={15} />
          </a>
          {!import.meta.env.VITE_PUBLIC_URL && (
            <div className="demo-note">
              Bản local đang dùng {window.location.origin}. Domain công khai sẽ
              được cấu hình khi triển khai website.
            </div>
          )}
        </section>
      </div>
    </>
  );
}
