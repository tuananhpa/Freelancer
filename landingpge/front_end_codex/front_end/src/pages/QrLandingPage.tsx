import { useParams, Navigate, Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { useResource } from "../hooks/useResource";
import { repository } from "../services";
import { isWebUrl } from "../services/contacts";
import { Loading, ErrorState, NotFound } from "../components/common";
import { useLanguage } from "../app/providers";
export default function QrLandingPage() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { data, loading, error, reload } = useResource(
    () => repository.products.list(),
    [id],
  );
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const source = data?.find((p) => p.id === id);
  if (!source) return <NotFound />;
  const destination = source.qrDestination;
  if (destination?.kind === "external") {
    if (!isWebUrl(destination.url)) return <NotFound />;
    const url = new URL(destination.url);
    if (url.origin === window.location.origin) {
      if (url.pathname.startsWith("/q/")) return <NotFound />;
      return (
        <Navigate replace to={`${url.pathname}${url.search}${url.hash}`} />
      );
    }
    return (
      <section className="state-screen">
        <h1>
          {t("Liên kết của", "A link from")} {source.name}
        </h1>
        <p>
          {t("Bạn sẽ mở trang tại", "You will open a page at")}{" "}
          <strong>{url.hostname}</strong>
        </p>
        <a className="button" href={url.href} rel="noopener noreferrer">
          {t("Mở trang đích", "Open destination")}
          <ExternalLink size={18} />
        </a>
        <Link className="underlined-link" to={`/p/${source.slug}`}>
          {t("Xem câu chuyện sản phẩm", "Read the product story")}
        </Link>
      </section>
    );
  }
  const target = data?.find(
    (p) => p.id === (destination?.productId || source.id),
  );
  return target ? <Navigate replace to={`/p/${target.slug}`} /> : <NotFound />;
}
