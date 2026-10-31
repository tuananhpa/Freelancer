import React, { useMemo } from 'react';
import { Icon } from '../components/Icons.jsx';
import { SITE, SHELF } from '../data/siteConfig.js';
import {
  P,
  byId,
  count,
  realBrands,
  countries,
  url,
  img,
  glow,
} from '../utils/helpers.js';
import { usePageMotion } from '../utils/useMotion.js';

export function AboutPage() {
  usePageMotion([]);
  const shelfItems = useMemo(() => SHELF.map((id) => byId[id]).filter(Boolean), []);
  const whiskyCount = useMemo(() => count((p) => p.cat === 'whisky'), []);
  const shelfGlow = shelfItems[2] ? glow(shelfItems[2]) : '201 151 75';

  return (
    <main id="main">
      <section className="wrap about-hero" aria-labelledby="aboutTitle">
        <div data-reveal-group>
          <nav className="crumbs" aria-label="Đường dẫn" data-reveal>
            <a href="index.html">Trang chủ</a>
            <span aria-hidden="true">/</span>
            <span>Giới thiệu</span>
          </nav>
          <h1 id="aboutTitle" data-reveal>
            Người đứng sau từng chai rượu
          </h1>
          <p className="lead" data-reveal>
            BM Global Spirits nhập khẩu và phân phối rượu mạnh tại Việt Nam{' '}
            <span className="tbc">[[CẦN XÁC NHẬN: từ năm…]]</span>. Chúng tôi làm việc với nhà hàng, quầy bar, đại lý và những người chọn rượu làm quà hay để sưu tầm.
          </p>
          <div className="hero__actions" data-reveal>
            <a className="btn" href="san-pham.html">
              Xem bộ sưu tập
              <Icon name="arrow" />
            </a>
            <a className="link" href="lien-he.html">
              Liên hệ hợp tác
            </a>
          </div>
        </div>
        <figure
          className="shelf"
          id="shelf"
          aria-label="Một số chai trong danh mục"
          data-reveal-group
          style={{ '--glow': shelfGlow }}
        >
          <span className="shelf__beam" aria-hidden="true"></span>
          {shelfItems.map((p) => (
            <a key={p.id} className="shelf__item" href={url.product(p)} data-reveal aria-label={p.name}>
              <img src={img(p.id, 600)} alt={p.name} width="600" height="800" loading="lazy" />
            </a>
          ))}
        </figure>
      </section>

      <section className="section" style={{ paddingTop: 0 }} aria-labelledby="numTitle">
        <div className="wrap" data-reveal-group>
          <h2 id="numTitle" className="sr-only">
            Danh mục bằng con số
          </h2>
          <div className="numbers">
            <div data-reveal>
              <b className="num" data-stat-a="products">
                {P.length}
              </b>
              <span>sản phẩm đang có trong catalog</span>
            </div>
            <div data-reveal>
              <b className="num" data-stat-a="brands">
                {realBrands.length}
              </b>
              <span>thương hiệu, từ nhà chưng cất lớn đến xưởng thủ công</span>
            </div>
            <div data-reveal>
              <b className="num" data-stat-a="countries">
                {countries.length}
              </b>
              <span>quốc gia xuất xứ thương hiệu</span>
            </div>
            <div data-reveal>
              <b className="num" data-stat-a="whisky">
                {whiskyCount}
              </b>
              <span>chai whisky — hơn nửa kho</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section on-paper" aria-labelledby="valuesTitle">
        <div className="wrap values">
          <div className="values__head" data-reveal-group>
            <h2 id="valuesTitle" data-reveal>
              Cách chúng tôi làm việc
            </h2>
            <p className="soft" style={{ marginTop: '16px', maxWidth: '34ch' }} data-reveal>
              Bốn điều khách hàng có thể đòi hỏi ở BM, với mọi chai, mọi đơn.
            </p>
          </div>
          <div className="values__list" data-reveal-group>
            <div className="value" data-reveal>
              <h3>Nguồn gốc rõ ràng</h3>
              <p>
                Hàng nhập khẩu theo đường chính ngạch, có chứng từ và tem theo quy định{' '}
                <span className="tbc">[[CẦN XÁC NHẬN]]</span>. Khách cần hồ sơ lô hàng cho nhà hàng hay quà tặng doanh nghiệp, chúng tôi cung cấp.
              </p>
            </div>
            <div className="value" data-reveal>
              <h3>Bảo quản đúng cách</h3>
              <p>
                Rượu mạnh không sợ thời gian, chỉ sợ nắng và nóng. Kho lưu trữ{' '}
                <span className="tbc">[[CẦN XÁC NHẬN: điều kiện kho]]</span>; chai được kiểm nắp, tem và hộp trước khi giao.
              </p>
            </div>
            <div className="value" data-reveal>
              <h3>Báo giá minh bạch</h3>
              <p>
                Giá rượu nhập thay đổi theo lô và tỉ giá, nên chúng tôi không niêm yết cố định. Bạn nhắn tên chai, chúng tôi báo giá và tình trạng hàng — rõ ràng, một lần.
              </p>
            </div>
            <div className="value" data-reveal>
              <h3>Giao hàng cẩn thận</h3>
              <p>
                Đóng gói chống va đập, giao tận nơi tại <span className="tbc">[[CẦN XÁC NHẬN: khu vực]]</span>. Đơn quà tặng có thể kèm thiệp và hộp theo yêu cầu{' '}
                <span className="tbc">[[CẦN XÁC NHẬN]]</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="partnerTitle">
        <div className="wrap" data-reveal-group>
          <div className="feat__head">
            <div>
              <h2 id="partnerTitle" data-reveal>
                Làm việc cùng BM
              </h2>
              <p className="soft prose" data-reveal>
                Mỗi nhóm khách có nhu cầu riêng — chúng tôi có chính sách riêng cho từng nhóm.
              </p>
            </div>
          </div>
          <div className="partners">
            <article className="partner" data-reveal>
              <h3>Nhà hàng &amp; quầy bar</h3>
              <p>
                Danh mục rộng cho thực đơn đồ uống: từ rượu nền pha chế (gin, rum, tequila, liqueur Giffard và Bols) đến các chai trưng bày cao cấp.
              </p>
              <a className="link" href="lien-he.html">
                Nhận bảng giá sỉ
                <Icon name="arrow" />
              </a>
            </article>
            <article className="partner" data-reveal>
              <h3>Đại lý &amp; cửa hàng</h3>
              <p>
                Nguồn hàng ổn định theo thùng, quy cách rõ ràng (thùng 3, 6, 12 chai tuỳ sản phẩm). Chính sách đại lý{' '}
                <span className="tbc">[[CẦN XÁC NHẬN]]</span>.
              </p>
              <a className="link" href="lien-he.html">
                Đăng ký làm đại lý
                <Icon name="arrow" />
              </a>
            </article>
            <article className="partner" data-reveal>
              <h3>Quà tặng &amp; sưu tầm</h3>
              <p>
                Những chai có hộp đẹp, bản giới hạn và dung tích lớn cho dịp Tết, khai trương, tri ân đối tác. Tư vấn chọn chai theo ngân sách.
              </p>
              <a className="link" href="lien-he.html">
                Nhờ tư vấn quà
                <Icon name="arrow" />
              </a>
            </article>
          </div>
        </div>
      </section>

      <section className="coupon-wrap" style={{ paddingTop: 0 }} aria-labelledby="aboutContact">
        <div className="wrap" data-reveal-group>
          <div className="coupon">
            <div className="coupon__left" data-reveal>
              <h2 id="aboutContact">Ghé showroom hoặc nhắn tin</h2>
              <p>
                <span>{SITE.address}</span>
                <br />
                <span className="soft" style={{ color: 'rgba(242,234,221,.7)' }}>
                  Showroom mở cửa theo giờ làm việc <span className="tbc">[[CẦN XÁC NHẬN]]</span>
                </span>
              </p>
              <img className="coupon__stamp" src="assets/img/brand/mark-ivory.svg" alt="" aria-hidden="true" />
            </div>
            <div className="coupon__right" data-reveal>
              <div className="channels">
                <a className="channel" href={SITE.zalo} target="_blank" rel="noopener">
                  <b>Zalo</b>
                  <span>Nhắn tin, gửi ảnh chai</span>
                </a>
                <a className="channel" href={SITE.messenger} target="_blank" rel="noopener">
                  <b>Messenger</b>
                  <span>Qua Facebook</span>
                </a>
                <a className="channel" href={SITE.hotlineHref}>
                  <b>Hotline</b>
                  <span className="num">{SITE.hotline}</span>
                </a>
              </div>
              <a className="btn btn--block" href="lien-he.html">
                Gửi yêu cầu báo giá
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
