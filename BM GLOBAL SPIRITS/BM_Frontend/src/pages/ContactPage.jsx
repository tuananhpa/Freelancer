import React, { useMemo } from 'react';
import { Icon } from '../components/Icons.jsx';
import { useFakeFormSubmit } from '../components/InquiryForm.jsx';
import { SITE, CONTACT_SHELF } from '../data/siteConfig.js';
import { P, byId, url, img, glow } from '../utils/helpers.js';
import { usePageMotion } from '../utils/useMotion.js';

export function ContactPage() {
  usePageMotion([]);
  const { formRef, okRef, submitting, sent, onSubmit } = useFakeFormSubmit('contact');

  const shelfItems = useMemo(() => CONTACT_SHELF.map((id) => byId[id]).filter(Boolean), []);
  const shelfGlow = shelfItems[0] ? glow(shelfItems[0]) : '201 151 75';

  const defaultWant = useMemo(() => {
    const sp = new URLSearchParams(window.location.search).get('sp');
    if (sp && byId[sp]) {
      const p = byId[sp];
      return p.name + (p.vol ? ' ' + p.vol : '');
    }
    return '';
  }, []);

  return (
    <main id="main">
      <header className="page-head">
        <span className="page-head__beam" aria-hidden="true"></span>
        <div className="wrap" data-reveal-group>
          <nav className="crumbs" aria-label="Đường dẫn" data-reveal>
            <a href="index.html">Trang chủ</a>
            <span aria-hidden="true">/</span>
            <span>Liên hệ</span>
          </nav>
          <div className="page-head__row">
            <div>
              <h1 data-reveal>Liên hệ &amp; hỏi giá</h1>
              <p className="lead soft" data-reveal>
                Nhắn tên chai, số lượng và nơi giao — chúng tôi báo giá theo lô hàng hiện tại qua kênh bạn chọn.
              </p>
            </div>
            <figure
              className="shelf shelf--sm"
              id="contactShelf"
              aria-label="Một số chai trong danh mục"
              data-reveal
              style={{ '--glow': shelfGlow }}
            >
              <span className="shelf__beam" aria-hidden="true"></span>
              {shelfItems.map((p) => (
                <a key={p.id} className="shelf__item" href={url.product(p)} aria-label={p.name}>
                  <img src={img(p.id, 600)} alt={p.name} width="600" height="800" loading="lazy" />
                </a>
              ))}
            </figure>
          </div>
        </div>
      </header>

      <div className="wrap contact-grid">
        <section aria-labelledby="chTitle" data-reveal-group>
          <h2 id="chTitle" className="h3" style={{ marginBottom: '24px' }} data-reveal>
            Kênh trả lời nhanh nhất
          </h2>
          <div className="contact-list">
            <a className="contact-item" href={SITE.zalo} target="_blank" rel="noopener" data-reveal>
              <Icon name="zalo" />
              <div>
                <b>Zalo</b>
                <span>Gửi ảnh chai bạn đang tìm</span>
              </div>
            </a>
            <a className="contact-item" href={SITE.messenger} target="_blank" rel="noopener" data-reveal>
              <Icon name="messenger" />
              <div>
                <b>Messenger</b>
                <span>Nhắn qua trang Facebook</span>
              </div>
            </a>
            <a className="contact-item" href={SITE.hotlineHref} data-reveal>
              <Icon name="phone" />
              <div>
                <b className="num">{SITE.hotline}</b>
                <span>Hotline — gọi trong giờ làm việc</span>
              </div>
            </a>
            <a className="contact-item" href={`mailto:${SITE.email}`} data-reveal>
              <Icon name="mail" />
              <div>
                <b>{SITE.email}</b>
                <span>Hồ sơ năng lực, báo giá số lượng lớn</span>
              </div>
            </a>
          </div>
          <div className="contact-info" data-reveal>
            <div>
              <h3>Showroom</h3>
              <p>{SITE.address}</p>
            </div>
            <div>
              <h3>Giờ làm việc</h3>
              <p id="hoursText">
                {SITE.hours.map(([d, t], idx) => (
                  <React.Fragment key={d}>
                    {idx > 0 && <br />}
                    {d}: <span className="num">{t}</span>
                  </React.Fragment>
                ))}
              </p>
            </div>
          </div>
          <p className="age-note" style={{ marginTop: '32px' }} data-reveal>
            Chúng tôi không bán rượu cho người dưới 18 tuổi.
          </p>
        </section>

        <section className="contact-form" aria-labelledby="formTitle" data-reveal-group>
          <h2 id="formTitle" data-reveal>
            Gửi yêu cầu
          </h2>
          <p data-reveal>Điền vài dòng, chúng tôi gọi lại hoặc nhắn Zalo cho bạn.</p>
          <form
            ref={formRef}
            className={`form form--2${sent ? ' is-sent' : ''}`}
            data-fake
            noValidate
            data-reveal
            onSubmit={onSubmit}
          >
            <div className="field">
              <input id="fName" name="name" placeholder=" " required autoComplete="name" />
              <label htmlFor="fName">Họ và tên</label>
            </div>
            <div className="field">
              <input id="fPhone" name="phone" type="tel" placeholder=" " required autoComplete="tel" inputMode="tel" />
              <label htmlFor="fPhone">Số điện thoại</label>
            </div>
            <div className="field full">
              <input id="fMail" name="email" type="email" placeholder=" " autoComplete="email" />
              <label htmlFor="fMail">Email (không bắt buộc)</label>
            </div>
            <fieldset className="full who">
              <legend>Bạn là</legend>
              <label>
                <input type="radio" name="who" value="ca-nhan" defaultChecked />
                <span>Cá nhân</span>
              </label>
              <label>
                <input type="radio" name="who" value="nha-hang" />
                <span>Nhà hàng, quầy bar</span>
              </label>
              <label>
                <input type="radio" name="who" value="dai-ly" />
                <span>Đại lý, cửa hàng</span>
              </label>
              <label>
                <input type="radio" name="who" value="qua-tang" />
                <span>Quà tặng doanh nghiệp</span>
              </label>
            </fieldset>
            <div className="field full">
              <input id="fWant" name="want" placeholder=" " list="productList" defaultValue={defaultWant} />
              <label htmlFor="fWant">Chai bạn quan tâm</label>
              <datalist id="productList">
                {P.map((p) => (
                  <option key={p.id} value={p.name + (p.vol ? ' ' + p.vol : '')} />
                ))}
              </datalist>
            </div>
            <div className="field full">
              <textarea id="fMsg" name="msg" placeholder=" " rows="4"></textarea>
              <label htmlFor="fMsg">Số lượng, thời gian, nơi giao…</label>
            </div>
            <button className="btn btn--block full" type="submit" disabled={submitting}>
              {submitting ? 'Đang gửi…' : 'Gửi yêu cầu báo giá'}
            </button>
            <div ref={okRef} className="form__ok full" role="status">
              <Icon name="check" />
              <div>
                <b>Cảm ơn bạn, chúng tôi đã nhận yêu cầu.</b>
                <br />
                BM Global Spirits sẽ liên hệ lại sớm. (Bản mockup — form chưa gửi dữ liệu.)
              </div>
            </div>
          </form>
        </section>
      </div>

      <section className="section on-paper" aria-labelledby="faqTitle">
        <div className="wrap values">
          <div className="values__head" data-reveal-group>
            <h2 id="faqTitle" data-reveal>
              Câu hỏi thường gặp
            </h2>
            <p className="soft" style={{ marginTop: '16px', maxWidth: '34ch' }} data-reveal>
              Câu trả lời đang chờ BM xác nhận trước khi đưa lên website chính thức.
            </p>
          </div>
          <div className="values__list faq" data-reveal-group>
            <details className="value" data-reveal open>
              <summary>
                <h3>Vì sao website không ghi giá?</h3>
              </summary>
              <p>
                Giá rượu nhập khẩu thay đổi theo lô hàng và tỉ giá. Để bạn nhận đúng giá tại thời điểm mua, chúng tôi báo giá trực tiếp qua Zalo, Messenger hoặc điện thoại.
              </p>
            </details>
            <details className="value" data-reveal>
              <summary>
                <h3>Có bán lẻ từng chai không?</h3>
              </summary>
              <p>
                Có — bán lẻ từng chai và bán theo thùng. Quy cách thùng ghi trên trang từng sản phẩm.{' '}
                <span className="tbc">[[CẦN XÁC NHẬN]]</span>
              </p>
            </details>
            <details className="value" data-reveal>
              <summary>
                <h3>Giao hàng ở đâu, mất bao lâu?</h3>
              </summary>
              <p>
                <span className="tbc">[[CẦN XÁC NHẬN: khu vực giao, thời gian, phí]]</span>
              </p>
            </details>
            <details className="value" data-reveal>
              <summary>
                <h3>Có xuất hoá đơn VAT không?</h3>
              </summary>
              <p>
                <span className="tbc">[[CẦN XÁC NHẬN]]</span>
              </p>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}
