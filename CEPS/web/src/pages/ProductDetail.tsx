import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCart } from '../cart'
import { ALL, byId, splitDescription } from '../data/products'
import ProductCard from '../components/ProductCard'
import NotFound from './NotFound'

export default function ProductDetail() {
  const { id = '' } = useParams()
  const p = byId(id)
  const { add } = useCart()
  const [qty, setQty] = useState(1)
  if (!p) return <NotFound />

  const { intro, bullets } = splitDescription(p)
  const related = ALL.filter((x) => x.brand === p.brand && x.category === p.category && x.id !== p.id).slice(0, 3)

  return (
    <>
      <section className="section detail">
        <div className="container">
          <nav className="crumbs" aria-label="Đường dẫn">
            <Link to="/san-pham">Sản phẩm</Link> / <Link to={`/san-pham#${p.brand === 'ATi' ? 'ati' : 'scan'}`}>{p.brand}</Link> / <span>{p.name}</span>
          </nav>
          <div className="detail-grid">
            <div className="detail-img"><img src={p.image} alt={p.name} /></div>
            <div>
              <p className="eyebrow">{p.brand} · {p.categoryLabel}</p>
              <h1>{p.name}</h1>
              <p className="lead">{intro}</p>
              {bullets.length > 0 && <ul className="ticks">{bullets.map((b) => <li key={b}>{b}</li>)}</ul>}

              {'parameters' in p && p.parameters.length > 0 && (
                <>
                  <h2 className="h-sm">Chỉ tiêu đo</h2>
                  <ul className="chips">{p.parameters.map((c) => <li key={c}>{c}</li>)}</ul>
                </>
              )}
              {'markets' in p && p.markets.length > 0 && (
                <>
                  <h2 className="h-sm">Ứng dụng</h2>
                  <ul className="chips soft">{p.markets.map((c) => <li key={c}>{c}</li>)}</ul>
                </>
              )}

              <div className="buy">
                <span className="price">Giá: liên hệ</span>
                <div className="qty">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Giảm số lượng">−</button>
                  <span aria-live="polite">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} aria-label="Tăng số lượng">+</button>
                </div>
                <button className="btn btn-primary" onClick={() => add(p.id, qty)}>Mua hàng</button>
              </div>

              <p className="muted small">
                {'page' in p ? (
                  <>Nguồn: brochure ATi, <Link to={`/san-pham?trang=${p.page}#ati`}>xem trang {p.page} trong sách</Link>.</>
                ) : (
                  <>Nguồn: <a href={p.source} target="_blank" rel="noopener noreferrer">trang sản phẩm Badger Meter</a>.</>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section alt">
          <div className="container">
            <h2 className="h-md">Sản phẩm cùng nhóm</h2>
            <div className="grid-3">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
          </div>
        </section>
      )}
    </>
  )
}
