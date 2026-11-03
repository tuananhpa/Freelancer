import { Link } from 'react-router-dom'
import { SITE } from '../data/site'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <img src="/img/brand/logo-cpes-doc-transparent.png" alt="CPES" width={84} height={96} className="footer-logo" />
          <p className="footer-name">{SITE.name.toUpperCase()}</p>
        </div>
        <nav aria-label="Liên kết chân trang">
          <h3>Danh mục</h3>
          <Link to="/">Giới thiệu</Link>
          <Link to="/san-pham#ati">Sản phẩm ATi</Link>
          <Link to="/san-pham#scan">Sản phẩm s::can</Link>
          <Link to="/giai-phap">Giải pháp</Link>
        </nav>
        <address>
          <h3>Thông tin liên hệ</h3>
          <span>{SITE.address}</span>
          <a href={`tel:${SITE.tel}`}>{SITE.phone}</a>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          <span>{SITE.web}</span>
        </address>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} {SITE.name}</span>
        <span>s::can và ATi là thương hiệu của Badger Meter®</span>
      </div>
    </footer>
  )
}
