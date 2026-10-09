import { Link } from 'react-router-dom';
import { COMING_SOON } from '@/config/content';

export default function ProductShowcase({ products = [], loading }) {
  return (
    <section className="section" id="san-vat">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">Thức quà tiến Vua</span>
          <h2 className="section__title">Những câu chuyện đầu tiên, kể từ bãi bồi sông Hồng</h2>
          <p className="section__lead">Chạm vào một sản vật để trải nghiệm đúng trang khách hàng thấy khi quét mã QR trên bao bì.</p>
        </div>
        {loading && <div className="state"><span className="spinner" /></div>}
        <div className="product-grid">
          {products.map((p) => (
            <Link key={p.id} to={`/p/${p.slug}`} className="p-card">
              <div className="p-card__media">
                <img src={p.coverUrl} alt={p.name} loading="lazy" />
                {p.duration && <span className="p-card__chip">Phim {p.duration} · có thuyết minh</span>}
              </div>
              <div className="p-card__body">
                <span className="p-card__kicker">{p.category}</span>
                <h3 className="p-card__title">{p.name}</h3>
                <p className="p-card__text">{p.tagline}</p>
                <span className="p-card__more">Mở câu chuyện →</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="chips">
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>Sắp lên sóng:</span>
          {COMING_SOON.map((c) => <span key={c} className="chip">{c}</span>)}
        </div>
      </div>
    </section>
  );
}
