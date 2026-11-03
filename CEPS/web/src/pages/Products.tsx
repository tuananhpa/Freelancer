import { lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import ScanCatalog from '../components/ScanCatalog'
import { ATI, SCAN } from '../data/products'

const AtiBook = lazy(() => import('../components/AtiBook'))

export default function Products() {
  const [params] = useSearchParams()
  const startPage = Number(params.get('trang')) || undefined

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Sản phẩm</p>
          <h1>Thiết bị giám sát nước & phát hiện khí</h1>
          <nav className="page-tabs" aria-label="Danh mục sản phẩm">
            <a href="#scan">s::can <small>{SCAN.length} sản phẩm</small></a>
            <a href="#ati">ATi <small>{ATI.length} sản phẩm · sách lật</small></a>
          </nav>
        </div>
      </section>

      <section className="section" id="scan">
        <div className="container">
          <div className="sec-head split">
            <div>
              <p className="eyebrow">s::can · A Badger Meter® Brand</p>
              <h2>Giám sát chất lượng nước trực tuyến</h2>
            </div>
            <p className="muted">
              Đầu dò quang phổ UV-Vis và cảm biến vật lý đo trực tiếp trong nước, cùng phụ kiện lắp đặt và làm sạch.
            </p>
          </div>
          <ScanCatalog />
        </div>
      </section>

      <section className="section book-section" id="ati">
        <div className="container">
          <div className="sec-head split">
            <div>
              <p className="eyebrow">ATi · A Badger Meter® Brand</p>
              <h2>Brochure ATi — lật từng trang, bấm để mua</h2>
            </div>
            <p className="muted">Giải pháp giám sát chất lượng nước và thiết bị phát hiện khí. Bấm vào thiết bị trên trang sách để xem chi tiết và đặt hàng.</p>
          </div>
          <Suspense fallback={<div className="book-loading">Đang mở sách…</div>}>
            <AtiBook startPage={startPage} />
          </Suspense>
        </div>
      </section>
    </>
  )
}
