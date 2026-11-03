import { Link } from 'react-router-dom'
import { ABOUT, CORE_VALUES, INDUSTRIES, PARTNERS, SALES_PHILOSOPHY, SITE } from '../data/site'
import Reveal from '../components/Reveal'

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">{SITE.name}</p>
            <h1>Giải pháp công nghiệp cho nước, khí và an toàn sản xuất</h1>
            <p className="lead">
              Giám sát chất lượng nước, phát hiện khí độc và cháy nổ, van, bơm, biến tần và PCCC tự động — cho ngành nước, dầu khí, nhiệt điện và khai khoáng.
            </p>
            <div className="hero-cta">
              <Link to="/san-pham" className="btn btn-primary">Xem sản phẩm</Link>
              <a href="#lien-he" className="btn btn-ghost">Liên hệ tư vấn</a>
            </div>
          </div>
          <img className="hero-mark" src="/img/brand/cpes-mark.png" alt="" width={726} height={831} />
        </div>
      </section>

      <section className="section" id="ve-chung-toi">
        <div className="container about-grid">
          <Reveal>
            <p className="eyebrow">Về chúng tôi</p>
            <h2>Đối tác tin cậy cho giải pháp công nghiệp</h2>
          </Reveal>
          <Reveal className="about-text">
            {ABOUT.map((t) => <p key={t}>{t}</p>)}
          </Reveal>
        </div>
        <div className="container industries">
          {INDUSTRIES.map((t, i) => (
            <Reveal key={t} className="industry" delay={i * 80}>
              <span className="industry-no">0{i + 1}</span>
              <span>{t}</span>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section values" id="gia-tri-cot-loi">
        <div className="container">
          <Reveal className="sec-head">
            <p className="eyebrow">C · P · E · S</p>
            <h2>Giá trị cốt lõi</h2>
          </Reveal>
          <div className="values-grid">
            {CORE_VALUES.map((v, i) => (
              <Reveal key={v.letter} className="value-card" delay={i * 90}>
                <span className="value-letter" aria-hidden="true">{v.letter}</span>
                <p><b>{v.letter}</b> = {v.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section philosophy" id="triet-ly-ban-hang">
        <div className="container">
          <Reveal className="sec-head">
            <p className="eyebrow">C · P · E · S</p>
            <h2>Triết lý bán hàng</h2>
          </Reveal>
          <ol className="philo-list">
            {SALES_PHILOSOPHY.map((v, i) => (
              <Reveal as="li" key={v.letter} delay={i * 90}>
                <span className="philo-letter" aria-hidden="true">{v.letter}</span>
                <p><b>{v.letter}</b> = {v.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section partners" aria-labelledby="partners-title">
        <div className="container">
          <p className="eyebrow" id="partners-title">Thương hiệu CPES phân phối</p>
        </div>
        <div className="marquee">
          <div className="marquee-track">
            {[...PARTNERS, ...PARTNERS].map(([name, file], i) => (
              <div className="partner" key={i} aria-hidden={i >= PARTNERS.length}>
                <img src={`/img/partner/${file}`} alt={i < PARTNERS.length ? name : ''} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section contact" id="lien-he">
        <div className="container contact-grid">
          <div>
            <p className="eyebrow">Liên hệ</p>
            <h2>{SITE.name}</h2>
            <ul className="contact-list">
              <li><span>Địa chỉ</span>{SITE.address}</li>
              <li><span>Điện thoại</span><a href={`tel:${SITE.tel}`}>{SITE.phone}</a></li>
              <li><span>Email</span><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
              <li><span>Website</span>{SITE.web}</li>
            </ul>
          </div>
          <iframe
            className="map"
            title="Bản đồ văn phòng CPES"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${encodeURIComponent('490 Phạm Thái Bường, Tân Phong, Quận 7, Hồ Chí Minh')}&z=16&output=embed`}
          />
        </div>
      </section>
    </>
  )
}
