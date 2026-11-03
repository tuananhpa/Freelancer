import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="section">
      <div className="container narrow">
        <h1>Không tìm thấy trang</h1>
        <p className="lead">Trang bạn tìm không tồn tại hoặc đã được di chuyển.</p>
        <Link className="btn btn-primary" to="/san-pham">Xem sản phẩm</Link>
      </div>
    </section>
  )
}
