import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="login">
      <div className="login__card" style={{ textAlign: 'center' }}>
        <h1>Không tìm thấy trang</h1>
        <p style={{ color: 'var(--muted)' }}>Đường dẫn có thể đã thay đổi. Hãy quét lại mã QR trên bao bì hoặc quay về trang chủ.</p>
        <Link to="/" className="btn btn--primary">Về trang chủ HYTale</Link>
      </div>
    </div>
  );
}
