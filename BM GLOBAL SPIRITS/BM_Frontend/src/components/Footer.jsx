import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons.jsx';
import { SITE } from '../data/siteConfig.js';
import { D, url, pop } from '../utils/helpers.js';

export function Footer({ page = '' }) {
  const fabRef = useRef(null);
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    const f = fabRef.current;
    if (!f) return;
    const onScrollFab = () => {
      if (page !== 'product') {
        f.classList.toggle('is-visible', window.scrollY > 560);
      } else {
        f.classList.remove('is-visible');
      }
    };
    onScrollFab();
    window.addEventListener('scroll', onScrollFab, { passive: true });
    return () => window.removeEventListener('scroll', onScrollFab);
  }, [page]);

  const toggleFab = () => {
    const f = fabRef.current;
    if (!f) return;
    const open = !f.classList.contains('is-open');
    pop(f, open);
    setFabOpen(open);
  };

  return (
    <>
      <footer className="site-footer">
        <div className="foot-grid">
          <div className="foot-tile foot-tile--statement">
            <p>Rượu mạnh nhập khẩu, chọn từng chai, giao tận tay.</p>
            <p className="age-note">
              Sản phẩm dành cho người từ 18 tuổi trở lên. Thưởng thức có trách nhiệm — đã uống rượu bia, không lái xe.
            </p>
          </div>
          <nav className="foot-tile foot-tile--nav" aria-label="Chân trang">
            <h3>Danh mục</h3>
            {D.categories.map((c) => (
              <a key={c.id} href={url.list({ cat: c.id })}>
                {c.name}
              </a>
            ))}
          </nav>
          <div className="foot-tile foot-tile--hours">
            <h3>Giờ làm việc</h3>
            <ul>
              {SITE.hours.map(([d, h]) => (
                <li key={d}>
                  {d}
                  <br />
                  <span className="num">{h}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="foot-tile foot-tile--contact">
            <div>
              <h3>Liên hệ</h3>
              <a href={SITE.hotlineHref} className="num">
                {SITE.hotline}
              </a>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </div>
            <p className="soft">{SITE.address}</p>
          </div>
          <div className="foot-tile foot-tile--word" aria-hidden="true">
            <img
              src="assets/img/brand/word-gold.svg"
              alt=""
              width="2128"
              height="241"
              style={{ width: 'min(70%,680px)', opacity: 0.85 }}
            />
          </div>
          <a className="foot-tile foot-tile--cta" href={SITE.zalo} target="_blank" rel="noopener">
            <p>Nhắn Zalo hỏi giá</p>
            <svg className="arrow" viewBox="0 0 56 56" aria-hidden="true">
              <path d="M10 46 46 10M18 10h28v28" />
            </svg>
          </a>
        </div>
        <div className="foot-legal">
          <span>
            © {SITE.year} {SITE.name}. {SITE.license}
          </span>
          <span>
            <strong>Không dành cho người dưới 18 tuổi.</strong>
          </span>
        </div>
      </footer>

      <div className="fab" id="fab" ref={fabRef}>
        <div className="fab__list" id="fabList">
          <a className="fab__item" href={SITE.zalo} target="_blank" rel="noopener">
            <Icon name="zalo" />
            Zalo
          </a>
          <a className="fab__item" href={SITE.messenger} target="_blank" rel="noopener">
            <Icon name="messenger" />
            Messenger
          </a>
          <a className="fab__item" href={SITE.hotlineHref}>
            <Icon name="phone" />
            <span className="num">{SITE.hotline}</span>
          </a>
        </div>
        <button
          className="fab__toggle"
          type="button"
          aria-expanded={fabOpen}
          aria-controls="fabList"
          aria-label="Liên hệ nhanh"
          onClick={toggleFab}
        >
          <Icon name="chat" className="icon-chat" />
          <Icon name="x" className="icon-x" />
        </button>
      </div>

      <nav className="mbar" aria-label="Liên hệ nhanh">
        <a href={SITE.zalo} target="_blank" rel="noopener">
          <Icon name="zalo" />
          Zalo
        </a>
        <a href={SITE.messenger} target="_blank" rel="noopener">
          <Icon name="messenger" />
          Messenger
        </a>
        <a href={SITE.hotlineHref}>
          <Icon name="phone" />
          Gọi Hotline
        </a>
      </nav>

      <div className="toast" id="toast" role="status" aria-live="polite"></div>
    </>
  );
}
