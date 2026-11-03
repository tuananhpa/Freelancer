import { Link } from 'react-router-dom'
import { useCart } from '../cart'
import type { Product } from '../data/products'

export default function ProductCard({ p }: { p: Product }) {
  const { add } = useCart()
  const chips = 'parameters' in p ? p.parameters : p.bullets
  return (
    <article className="card">
      <Link to={`/san-pham/${p.id}`} className="card-img" tabIndex={-1} aria-hidden="true">
        <img src={p.image} alt="" loading="lazy" width={300} height={220} />
      </Link>
      <div className="card-body">
        <span className="tag">{p.categoryLabel}</span>
        <h3><Link to={`/san-pham/${p.id}`}>{p.name}</Link></h3>
        {chips.length > 0 && (
          <ul className="chips">
            {chips.slice(0, 4).map((c) => <li key={c}>{c}</li>)}
            {chips.length > 4 && <li>+{chips.length - 4}</li>}
          </ul>
        )}
      </div>
      <div className="card-foot">
        <Link to={`/san-pham/${p.id}`} className="btn btn-ghost btn-sm">Chi tiết</Link>
        <button className="btn btn-primary btn-sm" onClick={() => add(p.id)}>Mua hàng</button>
      </div>
    </article>
  )
}
