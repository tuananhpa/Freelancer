import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useCart } from '../cart'

export default function Header() {
  const { count, setOpen } = useCart()
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const loc = useLocation()

  useEffect(() => setMenu(false), [loc])
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container header-row">
        <Link to="/" className="brand" aria-label="CPES – Trang chủ">
          <img src="/img/brand/logo-cpes-ngang-transparent.png" alt="CPES" width={150} height={40} />
        </Link>

        <nav className={`nav ${menu ? 'open' : ''}`} aria-label="Menu chính">
          <NavLink to="/" end>Giới thiệu</NavLink>
          <div className="nav-group">
            <NavLink to="/san-pham">Sản phẩm</NavLink>
            <div className="nav-sub">
              <Link to="/san-pham#ati">ATi <small>Brochure sách lật</small></Link>
              <Link to="/san-pham#scan">s::can <small>Giám sát chất lượng nước</small></Link>
            </div>
          </div>
          <NavLink to="/giai-phap">Giải pháp</NavLink>
        </nav>

        <div className="header-actions">
          <button className="cart-btn" onClick={() => setOpen(true)} aria-label={`Giỏ hàng, ${count} sản phẩm`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
            </svg>
            {count > 0 && <span className="cart-count">{count}</span>}
          </button>
          <button className="burger" aria-label="Mở menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  )
}
