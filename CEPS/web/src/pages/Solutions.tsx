import { Link } from 'react-router-dom'
import { byId, type Product } from '../data/products'
import Reveal from '../components/Reveal'

// Copy here is a neutral placeholder: CPES has not supplied solution write-ups yet.
const TOTEMS = [
  {
    id: 'nuoc-thai',
    title: 'Giải pháp nước thải',
    text: 'Giám sát liên tục chất lượng nước thải từ đầu vào, bể sục khí đến đầu ra bằng đầu dò quang phổ và cảm biến đo trực tiếp.',
    image: '/img/scan/section-river-monitoring.jpg',
    products: ['scan-spectro-lyser-v3-spectrometer-probe', 'scan-ammo-lyser-pro-ammonium-physical-sensor', 'scan-oxi-lyser-dissolved-oxygen-physical-sensor', 'ati-giam-sat-chat-ran-lo-lung-nong-do-bun-hoat-tinh-mlss', 'ati-bo-tach-khi-air-stripping-tong-clo'],
  },
  {
    id: 'nuoc-cap',
    title: 'Giải pháp nước cấp',
    text: 'Giám sát clo dư, độ đục và các chỉ tiêu nước cấp tại nhà máy và trên mạng lưới phân phối.',
    image: '/img/scan/section-concube-station.jpg',
    products: ['scan-chlori-lyser-free-total-chlorine-physical-sensor', 'scan-i-scan-spectrophotometer-probe', 'ati-giam-sat-chi-tieu-clo-du', 'ati-metrinet', 'ati-nephnet'],
  },
]

export default function Solutions() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">Giải pháp</p>
          <h1>Giải pháp theo ứng dụng</h1>
        </div>
      </section>

      <section className="section">
        <div className="container totems">
          {TOTEMS.map((t, i) => {
            const products = t.products.map(byId).filter(Boolean) as Product[]
            return (
              <Reveal key={t.id} className={`totem ${i % 2 ? 'flip' : ''}`}>
                <div className="totem-img" id={t.id}>
                  <img src={t.image} alt="" loading="lazy" />
                </div>
                <div className="totem-body">
                  <p className="eyebrow">0{i + 1}</p>
                  <h2>{t.title}</h2>
                  <p>{t.text}</p>
                  <p className="pending">Nội dung chi tiết đang chờ CPES cung cấp.</p>
                  <h3 className="h-sm">Thiết bị tiêu biểu</h3>
                  <ul className="totem-products">
                    {products.map((p) => (
                      <li key={p.id}>
                        <Link to={`/san-pham/${p.id}`}>
                          <img src={p.image} alt="" width={44} height={44} />
                          <span>{p.name}<small>{p.brand}</small></span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <a className="btn btn-primary" href="/#lien-he">Tư vấn giải pháp</a>
                </div>
              </Reveal>
            )
          })}
          <div className="totem soon">
            <p>Các giải pháp khác đang được cập nhật.</p>
          </div>
        </div>
      </section>
    </>
  )
}
