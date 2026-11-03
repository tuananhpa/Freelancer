import { useEffect, useMemo, useRef, useState } from 'react'
import { SCAN, fold } from '../data/products'
import ProductCard from './ProductCard'

const FILTERS = [
  ['all', 'Tất cả'],
  ['spectrometer', 'Đầu dò quang phổ'],
  ['sensor', 'Cảm biến vật lý'],
  ['accessory', 'Phụ kiện'],
] as const

/** 3-column grid (2 rows) that scrolls sideways page by page. */
export default function ScanCatalog() {
  const [cat, setCat] = useState<(typeof FILTERS)[number][0]>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [pages, setPages] = useState(1)
  const track = useRef<HTMLDivElement>(null)

  const list = useMemo(() => {
    const k = fold(q.trim())
    return SCAN.filter((p) => (cat === 'all' || p.category === cat) && (!k || fold(p.name + ' ' + p.parameters.join(' ') + ' ' + p.description).includes(k)))
  }, [cat, q])

  useEffect(() => {
    const el = track.current
    if (!el) return
    el.scrollTo({ left: 0 })
    const measure = () => {
      setPages(Math.max(1, Math.round(el.scrollWidth / el.clientWidth)))
      setPage(Math.round(el.scrollLeft / el.clientWidth))
    }
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => (el.removeEventListener('scroll', measure), window.removeEventListener('resize', measure))
  }, [list])

  const goto = (i: number) => track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: 'smooth' })

  return (
    <div className="catalog">
      <div className="catalog-tools">
        <div className="pills" role="group" aria-label="Lọc theo loại">
          {FILTERS.map(([id, label]) => (
            <button key={id} className={cat === id ? 'on' : ''} aria-pressed={cat === id} onClick={() => setCat(id)}>
              {label} <span>{id === 'all' ? SCAN.length : SCAN.filter((p) => p.category === id).length}</span>
            </button>
          ))}
        </div>
        <input type="search" className="search" placeholder="Tìm tên hoặc chỉ tiêu (COD, pH, amoni…)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Tìm sản phẩm s::can" />
      </div>

      {list.length ? (
        <div className="catalog-track" ref={track} tabIndex={0} aria-label={`${list.length} sản phẩm s::can`}>
          {list.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      ) : (
        <p className="empty">Không tìm thấy sản phẩm phù hợp.</p>
      )}

      {pages > 1 && (
        <nav className="pager" aria-label="Trang sản phẩm">
          <button onClick={() => goto(page - 1)} disabled={page === 0} aria-label="Trang trước">‹</button>
          {Array.from({ length: pages }, (_, i) => i)
            .filter((i) => i === 0 || i === pages - 1 || Math.abs(i - page) <= 1)
            .map((i, n, arr) => (
              <span key={i} className="pager-item">
                {n > 0 && i - arr[n - 1] > 1 && <span className="pager-gap">…</span>}
                <button className={i === page ? 'on' : ''} aria-current={i === page ? 'page' : undefined} onClick={() => goto(i)}>{i + 1}</button>
              </span>
            ))}
          <button onClick={() => goto(page + 1)} disabled={page >= pages - 1} aria-label="Trang sau">›</button>
        </nav>
      )}
    </div>
  )
}
