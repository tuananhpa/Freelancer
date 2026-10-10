import { useEffect, useRef, useId, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Leaf, X, ArrowUpRight, RotateCcw } from "lucide-react";
import { useLanguage } from "../app/providers";
import { useSiteSettings } from "../app/appearance";
import { MediaImage } from "./Media";
export function Brand({ light = false }: { light?: boolean }) {
  const settings = useSiteSettings();
  const name = settings.brandName?.trim() || "HYTales";
  const tagline = settings.brandTagline ?? "Chuyện quê trong từng thức quà";
  const image = settings.brandLogo;
  const fullLogo = image?.src && settings.brandLogoMode !== "symbol";
  return (
    <Link
      className={`brand ${light ? "brand-light" : ""}`}
      to="/"
      aria-label={`${name} – Trang chủ`}
    >
      {fullLogo ? (
        <span className="brand-custom-logo">
          <MediaImage
            src={image.src}
            display={image.display ?? { fit: "contain", x: 50, y: 50 }}
            alt={`Logo ${name}`}
          />
        </span>
      ) : (
        <>
          <span className="brand-symbol">
            {image?.src ? (
              <MediaImage
                src={image.src}
                display={image.display ?? { fit: "contain", x: 50, y: 50 }}
                alt={`Logo ${name}`}
              />
            ) : (
              <Leaf size={26} />
            )}
          </span>
          <span className="brand-copy">
            <span className="brand-tail brand-name" title={name}>
              {name}
            </span>
            {tagline && <small>{tagline}</small>}
          </span>
        </>
      )}
    </Link>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      aria-labelledby={titleId}
      className={`modal ${wide ? "modal-wide" : ""} ${className}`}
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Đóng"
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Loading() {
  const { t } = useLanguage();
  return (
    <div className="state-screen" role="status">
      <Leaf className="loading-leaf" size={36} />
      <p>{t("Đang mở câu chuyện quê…", "Opening a story of home…")}</p>
    </div>
  );
}
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="state-screen" role="alert">
      <h2>{t("Chưa tải được câu chuyện", "Unable to open the story")}</h2>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="button" onClick={onRetry}>
          <RotateCcw size={17} />
          {t("Thử lại", "Retry")}
        </button>
      )}
    </div>
  );
}
export function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="state-screen">
      <p className="eyebrow">HYTales</p>
      <h1>{t("Câu chuyện này chưa được mở", "This story is not available")}</h1>
      <p>
        {t(
          "Đường dẫn có thể không còn tồn tại hoặc sản phẩm chưa được công khai.",
          "The link may no longer exist or the story has not been published.",
        )}
      </p>
      <Link className="button" to="/">
        {t("Về trang chủ", "Back home")}
        <ArrowUpRight size={18} />
      </Link>
    </div>
  );
}
export const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN");
