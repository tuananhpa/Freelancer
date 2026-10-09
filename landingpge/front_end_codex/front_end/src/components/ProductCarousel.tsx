import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MoveHorizontal } from "lucide-react";
import type { Product } from "../types/domain";
import { useLanguage } from "../app/providers";
import { ProductCard } from "./ProductCard";

export function ProductCarousel({ products }: { products: Product[] }) {
  const { t } = useLanguage();
  const id = useId();
  const track = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState({
    first: 1,
    last: products.length,
    previous: false,
    next: false,
  });
  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const viewport = el.getBoundingClientRect();
    const cards = Array.from(el.children) as HTMLElement[];
    const visible = cards
      .map((card, index) => ({ index, box: card.getBoundingClientRect() }))
      .filter(
        ({ box }) =>
          box.left < viewport.right - 20 && box.right > viewport.left + 20,
      );
    setRange({
      first: (visible[0]?.index ?? 0) + 1,
      last: (visible.at(-1)?.index ?? 0) + 1,
      previous: el.scrollLeft > 2,
      next: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
    });
  }, []);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [measure, products]);
  function move(direction: number) {
    const el = track.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    if (!card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const stride = card.getBoundingClientRect().width + gap;
    const pageSize = Math.max(
      1,
      Math.floor((el.clientWidth + gap + 1) / stride),
    );
    const start = Math.round(el.scrollLeft / stride);
    el.scrollTo({
      left: Math.max(0, (start + direction * pageSize) * stride),
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  return (
    <div
      className="product-carousel"
      role="region"
      aria-label={t("Bộ sưu tập thức quà", "Local treasures collection")}
      aria-roledescription={t("Thanh trượt sản phẩm", "Product carousel")}
    >
      <div className="product-carousel-toolbar">
        <p>
          <MoveHorizontal size={18} aria-hidden="true" />
          {t("Lướt ngang để khám phá", "Scroll sideways to explore")}
        </p>
        <div className="product-carousel-controls">
          <span
            className="product-carousel-count"
            aria-live="polite"
            aria-atomic="true"
          >
            {range.first === range.last
              ? range.first
              : `${range.first}–${range.last}`}{" "}
            / {products.length}
          </span>
          <button
            type="button"
            className="icon-button"
            aria-label={t("Xem sản phẩm trước", "Previous products")}
            aria-controls={id}
            disabled={!range.previous}
            onClick={() => move(-1)}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={t("Xem sản phẩm tiếp theo", "Next products")}
            aria-controls={id}
            disabled={!range.next}
            onClick={() => move(1)}
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
      <div
        ref={track}
        id={id}
        className="product-grid product-carousel-track"
        tabIndex={0}
        aria-label={t(
          "Danh sách sản phẩm, dùng phím trái phải để lướt",
          "Products, use left and right arrows to scroll",
        )}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowRight" ? 1 : -1);
          }
          if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            track.current?.scrollTo({
              left: event.key === "Home" ? 0 : track.current.scrollWidth,
              behavior: "instant",
            });
          }
        }}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
