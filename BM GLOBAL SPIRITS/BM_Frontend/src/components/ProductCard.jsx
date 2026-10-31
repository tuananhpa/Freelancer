import React from 'react';
import { Niche } from './Niche.jsx';
import { brandName, metaLine, url } from '../utils/helpers.js';

export function ProductCard({
  product,
  index = 0,
  cls = '',
  style,
  sizes = '(max-width: 960px) 50vw, 240px',
  quick = true,
  onQuickView,
  dataReveal = false,
}) {
  if (!product) return null;
  const footText = [metaLine(product), product.pack ? `Thùng ${product.pack}` : ''].filter(Boolean).join(' · ');

  return (
    <article
      className={`card${cls ? ' ' + cls : ''}`}
      style={style}
      {...(dataReveal ? { 'data-reveal': '' } : {})}
    >
      <a href={url.product(product)} className="card__link" aria-label={product.name}>
        <Niche product={product} tone="oak" sizes={sizes} />
        <div className="card__body">
          <span className="card__meta label">{brandName(product)}</span>
          <h3 className="card__name">{product.name}</h3>
          <p className="card__foot soft">{footText}</p>
        </div>
      </a>
      {quick !== false && (
        <div className="card__quick">
          <button
            type="button"
            data-quick={product.id}
            onClick={(e) => {
              e.preventDefault();
              onQuickView && onQuickView(product);
            }}
          >
            Xem nhanh
          </button>
        </div>
      )}
    </article>
  );
}
