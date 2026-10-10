import Brand from './Brand';
import Icon from '@/components/common/Icon';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Brand />
        <nav className="site-nav" aria-label="Điều hướng chính">
          <a href="#san-vat">Sản vật</a>
          <a href="#cach-hoat-dong">Cách hoạt động</a>
          <a href="#khac-biet">Khác biệt</a>
          <a href="#htx">Dành cho HTX</a>
        </nav>
        <a href="#san-vat" className="btn btn--gold btn--sm site-header__cta">
          <Icon name="qr" size={18} /> Xem thử
        </a>
      </div>
    </header>
  );
}
