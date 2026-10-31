import React from 'react';
import { glow, img, srcset } from '../utils/helpers.js';

export function Niche({
  product,
  tone = 'oak',
  sizes = '(max-width: 960px) 50vw, 25vw',
  eager = false,
  cls = '',
  mirror = true,
  alt,
  mainSize = 600,
  mirrorSize = 300,
  noSrcset = false,
  onClick,
  onPointerMove,
  onMouseLeave,
  innerRef,
}) {
  if (!product) return null;
  const a = alt ?? `${product.name}${product.vol ? ' ' + product.vol : ''}`;
  return (
    <div
      ref={innerRef}
      className={`niche${cls ? ' ' + cls : ''}`}
      data-tone={tone}
      style={{ '--glow': glow(product) }}
      onClick={onClick}
      onPointerMove={onPointerMove}
      onMouseLeave={onMouseLeave}
    >
      <span className="niche__beam" aria-hidden="true"></span>
      {mirror && (
        <img
          className="niche__mirror"
          src={img(product.id, mirrorSize)}
          alt=""
          aria-hidden="true"
          loading={eager ? undefined : 'lazy'}
          width={mirrorSize}
          height={Math.round((mirrorSize * 4) / 3)}
        />
      )}
      <span className="niche__shadow" aria-hidden="true"></span>
      <img
        className="niche__img"
        src={img(product.id, mainSize)}
        srcSet={noSrcset ? undefined : srcset(product.id)}
        sizes={sizes}
        alt={a}
        width={mainSize}
        height={Math.round((mainSize * 4) / 3)}
        fetchPriority={eager ? 'high' : undefined}
        loading={eager ? undefined : 'lazy'}
        decoding="async"
      />
    </div>
  );
}
