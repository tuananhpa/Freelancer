import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../components/Icons.jsx';
import { Niche } from '../components/Niche.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { SITE } from '../data/siteConfig.js';
import {
  P,
  byId,
  CAT,
  TYPE,
  count,
  brandName,
  brandOrigin,
  fmtAbv,
  url,
  img,
  askText,
  copyAsk,
} from '../utils/helpers.js';
import { usePageMotion } from '../utils/useMotion.js';

const VIEWS = [
  ['full', 'Toàn chai'],
  ['detail', 'Cận nhãn'],
];

export function ProductPage() {
  const idParam = useMemo(() => new URLSearchParams(window.location.search).get('id'), []);
  const p = useMemo(() => byId[idParam] || (!idParam ? byId['0370'] : null), [idParam]);
  usePageMotion([p?.id]);

  const [view, setView] = useState('full');
  const [zoomed, setZoomed] = useState(false);
  const mainNicheRef = useRef(null);

  useEffect(() => {
    if (p) {
      document.title = `${p.name}${p.vol ? ' ' + p.vol : ''} — BM Global Spirits`;
    }
  }, [p]);

  const related = useMemo(() => {
    if (!p) return [];
    const seen = new Set([p.id]);
    const pick = (fn) => P.filter((x) => !seen.has(x.id) && fn(x));
    const rel = [];
    [
      (x) => x.brand === p.brand && !p.brand.startsWith('other'),
      (x) => p.type && x.type === p.type,
      (x) => x.cat === p.cat,
    ].forEach((fn) => {
      if (rel.length >= 5) return;
      pick(fn)
        .sort((a, b) => (a.flags ? 1 : 0) - (b.flags ? 1 : 0))
        .slice(0, 5 - rel.length)
        .forEach((x) => {
          rel.push(x);
          seen.add(x.id);
        });
    });
    return rel;
  }, [p]);

  if (!p) {
    return (
      <main id="main">
        <div className="wrap" id="pd">
          <div className="pd-missing">
            <h1 className="h2">Không tìm thấy sản phẩm</h1>
            <p className="soft" style={{ marginTop: '16px' }}>
              Mã “{idParam}” không có trong catalog. Có thể sản phẩm đã đổi mã.
            </p>
            <p style={{ marginTop: '32px' }}>
              <a className="btn" href="san-pham.html">
                Về bộ sưu tập
              </a>
            </p>
          </div>
        </div>
      </main>
    );
  }

  const typeName = p.type && TYPE[p.type] ? TYPE[p.type].name : '';
  const ask = askText(p);
  const msgr = `${SITE.messenger}?text=${encodeURIComponent(ask)}`;

  const specs = [
    [
      'Thương hiệu',
      <a key="brand" href={url.list({ brand: p.brand })}>
        {brandName(p)}
      </a>,
    ],
    [
      'Danh mục',
      <a key="cat" href={url.list({ cat: p.cat })}>
        {CAT[p.cat].name}
      </a>,
    ],
    [
      'Loại',
      typeName ? (
        <a key="type" href={url.list({ type: p.type })}>
          {typeName}
        </a>
      ) : null,
    ],
    ['Dung tích', p.vol || ''],
    ['Nồng độ cồn', fmtAbv(p.abv)],
    ['Quy cách thùng', p.pack ? `Thùng ${p.pack} chai` : ''],
    ['Đóng gói', p.nobox ? 'Không kèm hộp' : ''],
    ['Xuất xứ thương hiệu', brandOrigin(p)],
    [
      'Mã sản phẩm',
      <span key="code" className="num">
        BM-{p.id}
      </span>,
    ],
  ].filter((r) => r[1]);

  const sameBrand = count((x) => x.brand === p.brand);
  const relMoreHref =
    sameBrand > 1 && !p.brand.startsWith('other')
      ? url.list({ brand: p.brand })
      : url.list(p.type ? { type: p.type } : { cat: p.cat });
  const relMoreText =
    sameBrand > 1 && !p.brand.startsWith('other')
      ? `Tất cả ${sameBrand} chai ${brandName(p)}`
      : `Xem thêm ${typeName || CAT[p.cat].name}`;

  const updateZoomCoords = (e) => {
    const main = mainNicheRef.current;
    if (!main) return;
    const im = main.querySelector('.niche__img');
    if (!im) return;
    const ir = im.getBoundingClientRect();
    const x = ((e.clientX - ir.left) / ir.width) * 100;
    const y = ((e.clientY - ir.top) / ir.height) * 100;
    main.style.setProperty('--zx', `${Math.max(0, Math.min(100, x))}%`);
    main.style.setProperty('--zy', `${Math.max(0, Math.min(100, y))}%`);
  };

  const handleMainClick = (e) => {
    if (view === 'detail') {
      setView('full');
      setZoomed(false);
      return;
    }
    const nextZoom = !zoomed;
    setZoomed(nextZoom);
    if (nextZoom) updateZoomCoords(e);
  };

  const handlePointerMove = (e) => {
    if (!zoomed) return;
    updateZoomCoords(e);
  };

  const nicheCls = [view === 'detail' ? 'is-detail' : '', zoomed ? 'is-zoom' : ''].filter(Boolean).join(' ');

  return (
    <main id="main">
      <div className="wrap" id="pd">
        <div className="pd">
          <div className="pd__gallery" data-reveal-group>
            <div className="pd__thumbs" role="group" aria-label="Chọn góc xem">
              {VIEWS.map(([v, l]) => (
                <button
                  key={v}
                  className={`pd__thumb${v === 'detail' ? ' pd__thumb--detail' : ''}`}
                  type="button"
                  data-view={v}
                  aria-pressed={view === v}
                  aria-label={l}
                  onClick={() => {
                    setView(v);
                    setZoomed(false);
                  }}
                >
                  <img src={img(p.id, 300)} alt="" width="300" height="400" />
                </button>
              ))}
            </div>
            <div className="pd__main" data-reveal>
              <Niche
                innerRef={mainNicheRef}
                product={p}
                tone="oak"
                sizes="(max-width:960px) 100vw, 55vw"
                eager
                mainSize={1200}
                cls={nicheCls}
                onClick={handleMainClick}
                onPointerMove={handlePointerMove}
                onMouseLeave={() => setZoomed(false)}
              />
              <p className="pd__hint">
                <Icon name="zoom" />
                Bấm để phóng to
              </p>
            </div>
          </div>

          <div className="pd__head" data-reveal-group>
            <nav className="crumbs" aria-label="Đường dẫn" data-reveal>
              <a href="index.html">Trang chủ</a>
              <span aria-hidden="true">/</span>
              <a href={url.list({ cat: p.cat })}>{CAT[p.cat].name}</a>
              {typeName && (
                <>
                  <span aria-hidden="true">/</span>
                  <a href={url.list({ type: p.type })}>{typeName}</a>
                </>
              )}
            </nav>
            <h1 data-reveal>{p.name}</h1>
            <p className="pd__sub soft" data-reveal>
              <a className="pd__brand" href={url.list({ brand: p.brand })}>
                {brandName(p)}
              </a>{' '}
              · {[typeName || CAT[p.cat].name, p.vol, fmtAbv(p.abv)].filter(Boolean).join(' · ')}
            </p>
          </div>

          <div className="pd__info" data-reveal-group>
            <p className="pd__price" data-reveal>
              <b>Giá liên hệ</b> — báo theo lô hàng hiện tại, trong giờ làm việc.
            </p>
            <div className="pd__cta" data-reveal>
              <a
                className="btn"
                href={SITE.zalo}
                target="_blank"
                rel="noopener"
                data-ask={p.id}
                onClick={() => copyAsk(p)}
              >
                <Icon name="zalo" />
                Hỏi giá qua Zalo
                <span>Chép sẵn tên chai</span>
              </a>
              <a className="btn btn--ghost" href={msgr} target="_blank" rel="noopener">
                <Icon name="messenger" />
                Nhắn Messenger
              </a>
              <a className="btn btn--ghost" href={SITE.hotlineHref}>
                <Icon name="phone" />
                Gọi Hotline
                <span className="num">{SITE.hotline}</span>
              </a>
            </div>

            <div className="pd__note-bm" data-reveal>
              <h2>Ghi chú của BM</h2>
              <p>
                {brandName(p)}
                {brandOrigin(p) ? ` là thương hiệu đến từ ${brandOrigin(p)}` : ''}
                {typeName ? `, dòng ${typeName}` : ''}
                {p.pack ? `. Quy cách nhập: thùng ${p.pack} chai` : ''}.
              </p>
              <p className="soft">
                Ghi chú nếm, nhà chưng cất và gợi ý thưởng thức: <span className="tbc">[[CẦN XÁC NHẬN]]</span>
              </p>
            </div>

            <div className="specs" data-reveal>
              <h2>Thông tin sản phẩm</h2>
              <table>
                <tbody>
                  {specs.map(([k, v]) => (
                    <tr key={k}>
                      <th scope="row">{k}</th>
                      <td>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="pd__note" data-reveal>
              Hình ảnh minh hoạ; bao bì, hộp và nhãn có thể thay đổi theo lô nhập. Sản phẩm dành cho người từ 18 tuổi trở lên.
            </p>
          </div>
        </div>
      </div>

      <section className="related" aria-labelledby="relTitle" id="related">
        <div className="wrap" data-reveal-group>
          <div className="related__head">
            <h2 id="relTitle" data-reveal>
              Có thể bạn cũng quan tâm
            </h2>
            <a className="link" id="relMore" href={relMoreHref} data-reveal>
              {relMoreText}
              <Icon name="arrow" />
            </a>
          </div>
          <div className="pgrid" id="relGrid">
            {related.map((x, i) => (
              <ProductCard key={x.id} product={x} index={i + 1} quick={false} dataReveal />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
