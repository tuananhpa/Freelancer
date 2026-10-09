import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="site-footer" id="lien-he">
      <div className="container">
        <div className="site-footer__grid">
          <div>
            <h4 className="display" style={{ fontSize: 24 }}>HYTale</h4>
            <p>AgriTales – Truyện kể Nông sản Việt. Công nghệ truyền thông di sản &amp; chuyển đổi số nông nghiệp Hưng Yên.</p>
          </div>
          <div>
            <h4>Liên hệ</h4>
            <p>[Số hotline]</p>
            <p>[Zalo OA HYTale]</p>
            <p>[Email liên hệ]</p>
          </div>
          <div>
            <h4>Dành cho đối tác</h4>
            <p><a href="#htx">Gói Nông sản Di sản</a></p>
            <p><Link to="/admin/login">Đăng nhập quản trị (HTX / Admin)</Link></p>
          </div>
        </div>
        <div className="site-footer__bottom">© 2026 HYTale · hytales.vn · Chạm mã QR – Mở câu chuyện quê</div>
      </div>
    </footer>
  );
}
