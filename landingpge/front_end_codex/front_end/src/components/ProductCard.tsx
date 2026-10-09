import { MediaImage, MediaVideo } from "./Media";
import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin, Play } from "lucide-react";
import type { Product } from "../types/domain";
import { useLanguage } from "../app/providers";
export function ProductCard({ product }: { product: Product }) {
  const { lang, t } = useLanguage();
  return (
    <Link to={`/p/${product.slug}`} className="product-card">
      <div className="product-card-image">
        <MediaImage
          src={product.image}
          display={product.imageDisplay}
          alt={lang === "vi" ? product.name : product.nameEn}
          loading="lazy"
          width="800"
          height="600"
        />
        <span className="product-season">{product.season[lang]}</span>
        <span className="card-play">
          <Play size={17} fill="currentColor" />
        </span>
      </div>
      <div className="product-card-content">
        <p>
          <MapPin size={14} />
          {product.region[lang]}
        </p>
        <div>
          <h3>{lang === "vi" ? product.name : product.nameEn}</h3>
          <span className="card-arrow">
            <ArrowUpRight size={22} />
          </span>
        </div>
        <span>{product.subtitle[lang]}</span>
        <small>{t("Mở câu chuyện", "Discover the story")}</small>
      </div>
    </Link>
  );
}
