import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/common/Icon';
import CertBadge from '@/components/common/CertBadge';
import { formatDate } from '@/utils/format';

/** Khối 1: Video hero (tự phát, tắt tiếng) + thẻ định danh lô hàng. */
export default function HeroBlock({ product, onWatchFilm }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const { hero } = product;

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.play().catch(() => { /* trình duyệt chặn autoplay: vẫn hiển thị poster */ });
  }, [hero?.loopUrl]);

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) v.play().catch(() => {});
  };

  return (
    <>
      <section className="pp-hero" aria-label="Video giới thiệu">
        {hero?.loopUrl ? (
          <video ref={videoRef} src={hero.loopUrl} poster={hero.posterUrl} autoPlay muted loop playsInline preload="auto" />
        ) : (
          <img src={hero?.posterUrl || product.coverUrl} alt="" />
        )}
        {hero?.duration && <span className="pp-hero__tag">PHIM · {hero.duration}</span>}
        <div className="pp-hero__controls">
          <button type="button" className="icon-btn" onClick={toggleSound} aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}>
            <Icon name={muted ? 'mute' : 'sound'} />
          </button>
        </div>
        <div className="pp-hero__title">
          <span className="eyebrow eyebrow--gold">{product.tagline}</span>
          <h1>{product.name}</h1>
          {hero?.videoUrl && (
            <button type="button" className="btn btn--gold btn--sm pp-hero__watch" onClick={onWatchFilm}>
              <Icon name="playSolid" size={14} /> Xem phim có thuyết minh
            </button>
          )}
        </div>
      </section>

      <section className="id-card" aria-label="Thẻ định danh sản phẩm">
        <div className="id-card__row">
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Mã lô hàng</span>
          <span className="id-card__code">{product.batchCode}</span>
        </div>
        <dl className="id-card__grid" style={{ margin: 0 }}>
          <div><dt>Ngày sản xuất</dt><dd>{formatDate(product.harvestDate)}</dd></div>
          <div><dt>Hạn sử dụng</dt><dd>{formatDate(product.expiryDate)}</dd></div>
          <div className="full"><dt>Vùng trồng</dt><dd>{product.origin}{product.cooperative ? ` — ${product.cooperative}` : ''}</dd></div>
        </dl>
        {product.certifications?.length > 0 && (
          <div className="id-card__badges">{product.certifications.map((c) => <CertBadge key={c} code={c} />)}</div>
        )}
        <div className="verified"><Icon name="shield" size={18} /> Mã QR chính hãng HYTale · đã xác thực</div>
      </section>
    </>
  );
}
