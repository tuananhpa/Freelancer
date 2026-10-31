import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons.jsx';
import { Niche } from './Niche.jsx';
import { SITE, FEATURE_MEGA } from '../data/siteConfig.js';
import {
  D,
  P,
  byId,
  CAT,
  count,
  brandName,
  metaLine,
  realBrands,
  url,
  img,
  topBrands,
  search,
  pop,
  trap,
} from '../utils/helpers.js';

function MegaGroup({ cid }) {
  const c = CAT[cid];
  if (!c) return null;
  const items = c.types.length
    ? c.types.map((t) => (
        <li key={t.id}>
          <a href={url.list({ cat: cid, type: t.id })}>
            {t.name}
            <span className="num">{count((p) => p.type === t.id)}</span>
          </a>
        </li>
      ))
    : topBrands(cid, 4).map(([b, n]) => (
        <li key={b}>
          <a href={url.list({ cat: cid, brand: b })}>
            {D.brands[b].name}
            <span className="num">{n}</span>
          </a>
        </li>
      ));

  return (
    <div className="mega__group">
      <h3>
        <a href={url.list({ cat: cid })}>{c.name}</a>
      </h3>
      <ul className="mega__list">{items}</ul>
    </div>
  );
}

export function Header({ page = '' }) {
  const headerRef = useRef(null);
  const megaRef = useRef(null);
  const megaBtnRef = useRef(null);
  const drawerRef = useRef(null);
  const menuBtnRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [query, setQuery] = useState('');

  const feat = byId[FEATURE_MEGA] || P[0];
  const results = query.trim().length >= 2 ? search(query.trim()).slice(0, 9) : [];

  useEffect(() => {
    const h = headerRef.current;
    if (!h) return;
    let lastY = 0;
    const onScroll = () => {
      const overHero = !!document.querySelector('[data-header-over]');
      const y = window.scrollY;
      h.classList.toggle('is-solid', !overHero || y > 40);
      if (!h.classList.contains('is-open')) {
        h.classList.toggle('is-hidden', y > 700 && y > lastY + 4);
      }
      if (y < lastY - 4) h.classList.remove('is-hidden');
      lastY = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [page]);

  // Mega menu open/close helper
  const setMegaState = (open) => {
    const mega = megaRef.current;
    const h = headerRef.current;
    const drawer = drawerRef.current;
    if (!mega || !h) return;
    if (!open && !mega.classList.contains('is-open')) return;
    pop(mega, open);
    setMegaOpen(open);
    h.classList.toggle('is-open', open || (drawer && drawer.classList.contains('is-open')));
  };

  // Drawer open/close helper
  const closeDrawer = () => {
    const drawer = drawerRef.current;
    const h = headerRef.current;
    if (!drawer || !h) return;
    pop(drawer, false);
    setDrawerOpen(false);
    h.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  };

  const toggleDrawer = () => {
    const drawer = drawerRef.current;
    const h = headerRef.current;
    if (!drawer || !h) return;
    const open = !drawer.classList.contains('is-open');
    if (!open) return closeDrawer();
    pop(drawer, true);
    setDrawerOpen(true);
    h.classList.add('is-open');
    document.body.classList.add('is-locked');
  };

  // Search modal open/close helper
  const untrapSearchRef = useRef(null);
  const openSearch = () => {
    const s = searchRef.current;
    if (!s) return;
    untrapSearchRef.current = trap(s);
    pop(s, true);
    document.body.classList.add('is-locked');
    setTimeout(() => {
      searchInputRef.current && searchInputRef.current.focus();
    }, 60);
  };

  const closeSearch = () => {
    const s = searchRef.current;
    const drawer = drawerRef.current;
    if (untrapSearchRef.current) {
      untrapSearchRef.current();
      untrapSearchRef.current = null;
    }
    pop(s, false);
    if (!drawer || !drawer.classList.contains('is-open')) {
      document.body.classList.remove('is-locked');
    }
  };

  useEffect(() => {
    let tOpen, tClose;
    const btn = megaBtnRef.current;
    const mega = megaRef.current;
    const enter = () => {
      clearTimeout(tClose);
      tOpen = setTimeout(() => setMegaState(true), 90);
    };
    const leave = () => {
      clearTimeout(tOpen);
      tClose = setTimeout(() => setMegaState(false), 220);
    };
    if (btn && mega) {
      btn.addEventListener('mouseenter', enter);
      btn.addEventListener('mouseleave', leave);
      mega.addEventListener('mouseenter', enter);
      mega.addEventListener('mouseleave', leave);
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMegaState(false);
        closeSearch();
        closeDrawer();
      }
    };
    const onClickDoc = (e) => {
      if (!e.target.closest('#mega, #megaBtn')) setMegaState(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClickDoc);
    return () => {
      clearTimeout(tOpen);
      clearTimeout(tClose);
      if (btn && mega) {
        btn.removeEventListener('mouseenter', enter);
        btn.removeEventListener('mouseleave', leave);
        mega.removeEventListener('mouseenter', enter);
        mega.removeEventListener('mouseleave', leave);
      }
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClickDoc);
    };
  }, []);

  return (
    <>
      <a className="skip" href="#main">
        Bỏ qua, tới nội dung chính
      </a>
      <header className="site-header" id="header" ref={headerRef}>
        <div className="wrap site-header__in">
          <a className="brand" href="index.html" aria-label="BM Global Spirits — Trang chủ">
            <img className="brand__mark" src="assets/img/brand/mark.svg" alt="" width="34" height="40" />
            <img className="brand__word" src="assets/img/brand/word.svg" alt="" width="132" height="15" />
          </a>
          <nav className="nav" aria-label="Chính">
            <button
              ref={megaBtnRef}
              className="nav__link"
              type="button"
              aria-expanded={megaOpen}
              aria-controls="mega"
              id="megaBtn"
              aria-current={page === 'catalog' || page === 'product' ? 'page' : undefined}
              onClick={() => setMegaState(!megaRef.current?.classList.contains('is-open'))}
            >
              Sản phẩm <Icon name="down" />
            </button>
            <a className="nav__link" href={url.list({ cat: 'whisky' })}>
              Whisky
            </a>
            <a className="nav__link" href={url.list({ cat: 'vietnamese-spirits' })}>
              Rượu Việt
            </a>
            <a className="nav__link" href="gioi-thieu.html" aria-current={page === 'about' ? 'page' : undefined}>
              Giới thiệu
            </a>
            <a className="nav__link" href="lien-he.html" aria-current={page === 'contact' ? 'page' : undefined}>
              Liên hệ
            </a>
          </nav>
          <div className="header-tools">
            <button
              className="icon-btn"
              type="button"
              data-open-search
              aria-label="Tìm sản phẩm"
              onClick={openSearch}
            >
              <Icon name="search" />
            </button>
            <a className="btn btn--sm" href={SITE.zalo} target="_blank" rel="noopener">
              <Icon name="zalo" />
              Hỏi giá
            </a>
            <button
              ref={menuBtnRef}
              className="icon-btn menu-btn"
              type="button"
              aria-label="Mở menu"
              aria-expanded={drawerOpen}
              aria-controls="drawerNav"
              id="menuBtn"
              onClick={toggleDrawer}
            >
              <Icon name={drawerOpen ? 'x' : 'menu'} />
            </button>
          </div>
        </div>

        <div className="mega" id="mega" ref={megaRef} role="region" aria-label="Danh mục sản phẩm">
          <div className="wrap mega__in">
            <div className="mega__col">
              <MegaGroup cid="whisky" />
              <MegaGroup cid="cognac-brandy" />
            </div>
            <div className="mega__col">
              <MegaGroup cid="spirits" />
              <MegaGroup cid="japanese-spirits" />
            </div>
            <div className="mega__col">
              <MegaGroup cid="liqueurs-aperitifs" />
              <MegaGroup cid="vietnamese-spirits" />
            </div>
            <div className="mega__col mega__feature">
              <a href={url.product(feat)}>
                <Niche product={feat} tone="claret" sizes="200px" mirror={false} />
              </a>
              <div>
                <p className="label soft">{brandName(feat)}</p>
                <p className="h3" style={{ marginTop: '6px' }}>
                  {feat.name}
                </p>
                <p className="small soft">{metaLine(feat)}</p>
                <p style={{ marginTop: '16px' }}>
                  <a className="link" href={url.list()}>
                    Xem toàn bộ {P.length} sản phẩm <Icon name="arrow" />
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="drawer-nav" id="drawerNav" ref={drawerRef} aria-label="Menu">
        <details open>
          <summary>
            Sản phẩm <Icon name="plus" />
          </summary>
          <div className="drawer-nav__sub">
            {D.categories.map((c) => (
              <a key={c.id} href={url.list({ cat: c.id })}>
                {c.name}
                <span className="num soft">{count((p) => p.cat === c.id)}</span>
              </a>
            ))}
            <a href={url.list()} className="gold">
              Tất cả<span className="num">{P.length}</span>
            </a>
          </div>
        </details>
        <div className="drawer-nav__big">
          <a href="gioi-thieu.html">Giới thiệu</a>
          <a href="lien-he.html">Liên hệ</a>
        </div>
        <p className="small soft" style={{ marginTop: '32px' }}>
          Hotline{' '}
          <a className="gold" href={SITE.hotlineHref}>
            {SITE.hotline}
          </a>
        </p>
        <p className="age-note" style={{ marginTop: '8px' }}>
          Không dành cho người dưới 18 tuổi.
        </p>
      </div>

      <div
        className="search"
        id="search"
        ref={searchRef}
        role="dialog"
        aria-modal="true"
        aria-label="Tìm sản phẩm"
        onClick={(e) => {
          if (e.target === searchRef.current) closeSearch();
        }}
      >
        <div className="search__panel">
          <div className="wrap">
            <form className="search__row" action="san-pham.html" role="search">
              <Icon name="search" />
              <label className="sr-only" htmlFor="searchInput">
                Tên sản phẩm hoặc thương hiệu
              </label>
              <input
                ref={searchInputRef}
                className="search__input"
                id="searchInput"
                name="q"
                type="search"
                autoComplete="off"
                placeholder="Macallan, Hennessy, Dassai…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                className="icon-btn"
                type="button"
                data-close-search
                aria-label="Đóng"
                onClick={closeSearch}
              >
                <Icon name="x" />
              </button>
            </form>
            <div className="search__results" id="searchResults">
              {query.trim().length >= 2 &&
                (results.length ? (
                  results.map((p) => (
                    <a key={p.id} className="search__item" href={url.product(p)}>
                      <img src={img(p.id, 300)} alt="" loading="lazy" width="52" height="70" />
                      <span>
                        <b>{p.name}</b>
                        <span>
                          {brandName(p)} · {metaLine(p)}
                        </span>
                      </span>
                    </a>
                  ))
                ) : (
                  <p className="soft">
                    Chưa thấy "{query.trim()}". Thử tên thương hiệu, hoặc{' '}
                    <a className="gold" href={SITE.zalo}>
                      hỏi chúng tôi qua Zalo
                    </a>
                    .
                  </p>
                ))}
            </div>
            <p className="search__hint" id="searchHint">
              {query.trim().length >= 2
                ? results.length
                  ? `Nhấn Enter để xem tất cả kết quả cho “${query.trim()}”.`
                  : ''
                : `Gõ tên chai hoặc thương hiệu — ${P.length} sản phẩm, ${realBrands.length} thương hiệu.`}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
