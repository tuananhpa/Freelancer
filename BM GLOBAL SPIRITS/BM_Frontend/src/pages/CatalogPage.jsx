import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../components/Icons.jsx';
import { Niche } from '../components/Niche.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { SITE, CAT_ORDER } from '../data/siteConfig.js';
import {
  D,
  P,
  byId,
  CAT,
  TYPE,
  count,
  brandName,
  brandOrigin,
  fmtAbv,
  fold,
  url,
  pop,
  trap,
  copyAsk,
} from '../utils/helpers.js';
import { usePageMotion } from '../utils/useMotion.js';

const PER = 24;
const VOLS = [
  ['mini', 'Mini (đến 200 ml)', (ml) => ml <= 200],
  ['half', '300 – 500 ml', (ml) => ml > 200 && ml < 700],
  ['std', '700 – 750 ml', (ml) => ml >= 700 && ml <= 750],
  ['litre', '1 lít', (ml) => ml > 750 && ml <= 1000],
  ['big', 'Trên 1 lít', (ml) => ml > 1000],
  ['na', 'Chưa ghi dung tích', (ml) => !ml],
];

const brandCount = {};
P.forEach((p) => {
  brandCount[p.brand] = (brandCount[p.brand] || 0) + 1;
});

const IDX = P.map((p) =>
  fold(`${p.name} ${brandName(p)} ${p.type && TYPE[p.type] ? TYPE[p.type].name : ''} ${CAT[p.cat] ? CAT[p.cat].name : ''} ${p.vol || ''}`)
);

function rank(p) {
  const f = p.flags || [];
  return f.includes('review') ? 3 : f.includes('wide') || (p.ratio || 0) > 0.55 ? 1 : 0;
}

export function CatalogPage() {
  usePageMotion([]);

  const initialFilterState = useMemo(() => {
    const qs = new URLSearchParams(window.location.search);
    const list = (k) => (qs.get(k) ? qs.get(k).split(',').filter(Boolean) : []);
    return {
      cat: list('cat'),
      type: list('type'),
      brand: list('brand'),
      vol: list('vol'),
      q: qs.get('q') || '',
      sort: qs.get('sort') || '',
      shown: PER,
    };
  }, []);

  const [st, setSt] = useState(initialFilterState);
  const [qText, setQText] = useState(initialFilterState.q);
  const [brandSearch, setBrandSearch] = useState('');
  const [allBrands, setAllBrands] = useState(() => window.location.hash === '#fBrands');
  const [quickProduct, setQuickProduct] = useState(null);

  const filtersRef = useRef(null);
  const scrimRef = useRef(null);
  const openBtnRef = useRef(null);
  const modalRef = useRef(null);
  const quickCloseRef = useRef(null);
  const untrapFRef = useRef(null);
  const untrapQRef = useRef(null);
  const lastFocusRef = useRef(null);

  // Sync state to URL
  useEffect(() => {
    const o = new URLSearchParams();
    ['cat', 'type', 'brand', 'vol'].forEach((k) => {
      if (st[k].length) o.set(k, st[k].join(','));
    });
    if (st.q) o.set('q', st.q);
    if (st.sort) o.set('sort', st.sort);
    const s = o.toString().replace(/%2C/g, ',');
    window.history.replaceState(null, '', s ? `?${s}` : window.location.pathname);
  }, [st.cat, st.type, st.brand, st.vol, st.q, st.sort]);

  // Debounced search input
  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = qText.trim();
      setSt((prev) => (prev.q === trimmed ? prev : { ...prev, q: trimmed, shown: PER }));
    }, 180);
    return () => clearTimeout(t);
  }, [qText]);

  const pass = (p, i, skip) => {
    if (skip !== 'cat' && (st.cat.length || st.type.length)) {
      const ok = st.cat.includes(p.cat) || (p.type && st.type.includes(p.type));
      if (!ok) return false;
    }
    if (skip !== 'brand' && st.brand.length && !st.brand.includes(p.brand)) return false;
    if (
      skip !== 'vol' &&
      st.vol.length &&
      !st.vol.some((v) => {
        const found = VOLS.find((x) => x[0] === v);
        return found ? found[2](p.ml) : false;
      })
    )
      return false;
    if (st.q) {
      const terms = fold(st.q).split(' ').filter(Boolean);
      if (!terms.every((t) => IDX[i].includes(t))) return false;
    }
    return true;
  };

  const res = useMemo(() => {
    const r = P.filter((p, i) => pass(p, i));
    const by =
      {
        '': (a, b) =>
          CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b.cat) ||
          rank(a) - rank(b) ||
          brandCount[b.brand] - brandCount[a.brand] ||
          a.name.localeCompare(b.name),
        name: (a, b) => a.name.localeCompare(b.name, 'vi'),
        'name-desc': (a, b) => b.name.localeCompare(a.name, 'vi'),
        brand: (a, b) => brandName(a).localeCompare(brandName(b), 'vi') || a.name.localeCompare(b.name),
        vol: (a, b) => (a.ml || 1e9) - (b.ml || 1e9),
        'vol-desc': (a, b) => (b.ml || 0) - (a.ml || 0),
      }[st.sort] || (() => 0);

    r.sort(by);
    if (st.sort) return r;

    const out = [];
    CAT_ORDER.forEach((cid) => {
      const groups = {};
      r.filter((p) => p.cat === cid).forEach((p) => {
        (groups[p.brand] ||= []).push(p);
      });
      const g = Object.values(groups).sort((a, b) => b.length - a.length || rank(a[0]) - rank(b[0]));
      for (let i = 0; g.some((x) => x[i]); i++) {
        g.forEach((x) => {
          if (x[i]) out.push(x[i]);
        });
      }
    });
    return out.sort(
      (a, b) => CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b.cat) || (rank(a) === 3) - (rank(b) === 3)
    );
  }, [st.cat, st.type, st.brand, st.vol, st.q, st.sort]);

  const fc = useMemo(() => P.filter((p, i) => pass(p, i, 'cat')), [st.brand, st.vol, st.q]);
  const fb = useMemo(() => P.filter((p, i) => pass(p, i, 'brand')), [st.cat, st.type, st.vol, st.q]);
  const fv = useMemo(() => P.filter((p, i) => pass(p, i, 'vol')), [st.cat, st.type, st.brand, st.q]);

  const brandList = useMemo(() => {
    const bc = {};
    fb.forEach((p) => {
      bc[p.brand] = (bc[p.brand] || 0) + 1;
    });
    const term = fold(brandSearch || '');
    const brands = Object.entries(D.brands)
      .map(([k, b]) => [
        k,
        b.name + (k.startsWith('other') ? ` (${CAT[k.replace('other-', '')]?.name || ''})` : ''),
        bc[k] || 0,
      ])
      .filter(([k, n, c]) => (c > 0 || st.brand.includes(k)) && (!term || fold(n).includes(term)))
      .sort(
        (a, b) =>
          st.brand.includes(b[0]) - st.brand.includes(a[0]) ||
          fold(a[1].replace(/^the /i, '')).localeCompare(fold(b[1].replace(/^the /i, '')))
      );

    let shown = brands;
    if (!term && !allBrands && brands.length > 12) {
      const top = new Set(
        brands
          .slice()
          .sort((a, b) => b[2] - a[2])
          .slice(0, 10)
          .map((x) => x[0])
      );
      shown = brands.filter(([k]) => st.brand.includes(k) || top.has(k)).sort((a, b) => b[2] - a[2]);
    }
    return { brands, shown, hasTerm: !!term };
  }, [fb, brandSearch, allBrands, st.brand]);

  // Page title & heading
  const headInfo = useMemo(() => {
    let t = 'Bộ sưu tập rượu nhập khẩu';
    if (st.brand.length === 1 && !st.cat.length && !st.type.length && D.brands[st.brand[0]]) {
      t = D.brands[st.brand[0]].name;
    } else if (st.type.length === 1 && !st.cat.length && TYPE[st.type[0]]) {
      t = TYPE[st.type[0]].name;
    } else if (st.cat.length === 1 && !st.type.length && CAT[st.cat[0]]) {
      t = CAT[st.cat[0]].name;
    }
    const nb = new Set(res.map((p) => p.brand).filter((b) => !b.startsWith('other'))).size;
    return {
      title: t,
      crumb: t === 'Bộ sưu tập rượu nhập khẩu' ? 'Bộ sưu tập' : t,
      lead: `${res.length} chai từ ${nb} thương hiệu. Giá theo từng lô hàng — bấm vào chai để hỏi giá.`,
    };
  }, [st.cat, st.type, st.brand, res]);

  useEffect(() => {
    document.title = `${headInfo.title} — BM Global Spirits`;
  }, [headInfo.title]);

  const toggleCheck = (k, v, checked) => {
    setSt((prev) => {
      let nextCat = [...prev.cat];
      let nextType = [...prev.type];
      let nextBrand = [...prev.brand];
      let nextVol = [...prev.vol];

      const map = { cat: nextCat, type: nextType, brand: nextBrand, vol: nextVol };
      if (checked) {
        if (!map[k].includes(v)) map[k].push(v);
      } else {
        map[k] = map[k].filter((x) => x !== v);
      }

      if (k === 'cat') {
        const types = CAT[v].types.map((t) => t.id);
        map.type = map.type.filter((t) => !types.includes(t));
      }
      if (k === 'type' && !checked) {
        const parent = TYPE[v].cat;
        if (map.cat.includes(parent)) {
          map.cat = map.cat.filter((c) => c !== parent);
          map.type = map.type.concat(CAT[parent].types.map((t) => t.id).filter((t) => t !== v));
        }
      }

      return {
        ...prev,
        cat: map.cat,
        type: map.type,
        brand: map.brand,
        vol: map.vol,
        shown: PER,
      };
    });
  };

  const resetAll = () => {
    setQText('');
    setSt((prev) => ({
      ...prev,
      cat: [],
      type: [],
      brand: [],
      vol: [],
      q: '',
      shown: PER,
    }));
  };

  const chips = useMemo(() => {
    const items = [];
    st.cat.forEach((v) => CAT[v] && items.push(['cat', v, CAT[v].name]));
    st.type.forEach((v) => TYPE[v] && items.push(['type', v, TYPE[v].name]));
    st.brand.forEach((v) => items.push(['brand', v, D.brands[v] ? D.brands[v].name : v]));
    st.vol.forEach((v) => {
      const found = VOLS.find((x) => x[0] === v);
      if (found) items.push(['vol', v, found[1]]);
    });
    if (st.q) items.push(['q', st.q, `“${st.q}”`]);
    return items;
  }, [st.cat, st.type, st.brand, st.vol, st.q]);

  const removeChip = (k, v) => {
    if (k === 'q') {
      setQText('');
      setSt((prev) => ({ ...prev, q: '', shown: PER }));
    } else {
      setSt((prev) => ({ ...prev, [k]: prev[k].filter((x) => x !== v), shown: PER }));
    }
  };

  // Mobile filter drawer
  const openF = () => {
    const filters = filtersRef.current;
    const scrim = scrimRef.current;
    if (!filters || !scrim) return;
    pop(filters, true);
    pop(scrim, true);
    document.body.classList.add('is-locked');
    openBtnRef.current?.setAttribute('aria-expanded', 'true');
    untrapFRef.current = trap(filters);
    setTimeout(() => filters.querySelector('[data-close-filters]')?.focus(), 60);
  };

  const closeF = () => {
    const filters = filtersRef.current;
    const scrim = scrimRef.current;
    if (!filters || !filters.classList.contains('is-open')) return;
    pop(filters, false);
    pop(scrim, false);
    document.body.classList.remove('is-locked');
    openBtnRef.current?.setAttribute('aria-expanded', 'false');
    if (untrapFRef.current) {
      untrapFRef.current();
      untrapFRef.current = null;
    }
    openBtnRef.current?.focus();
  };

  // Quick View modal
  const openQuick = (p) => {
    if (!p) return;
    lastFocusRef.current = document.activeElement;
    setQuickProduct(p);
    const modal = modalRef.current;
    if (!modal) return;
    pop(modal, true);
    untrapQRef.current = trap(modal);
    document.body.classList.add('is-locked');
    setTimeout(() => quickCloseRef.current?.focus(), 30);
  };

  const closeQuick = () => {
    const modal = modalRef.current;
    if (!modal) return;
    if (untrapQRef.current) {
      untrapQRef.current();
      untrapQRef.current = null;
    }
    pop(modal, false);
    document.body.classList.remove('is-locked');
    lastFocusRef.current && lastFocusRef.current.focus();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (modalRef.current?.classList.contains('is-open')) closeQuick();
        closeF();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const nf = st.cat.length + st.type.length + st.brand.length + st.vol.length;
  const shownCount = Math.min(st.shown, res.length);
  const visibleProducts = res.slice(0, st.shown);

  const quickRows = useMemo(() => {
    if (!quickProduct) return [];
    const p = quickProduct;
    return [
      ['Thương hiệu', brandName(p)],
      ['Danh mục', p.type && TYPE[p.type] ? `${CAT[p.cat].name} · ${TYPE[p.type].name}` : CAT[p.cat].name],
      ['Dung tích', p.vol],
      ['Nồng độ', fmtAbv(p.abv)],
      ['Xuất xứ', brandOrigin(p)],
    ].filter((r) => r[1]);
  }, [quickProduct]);

  return (
    <main id="main">
      <header className="page-head">
        <span className="page-head__beam" aria-hidden="true"></span>
        <div className="wrap page-head__in" data-reveal-group>
          <nav className="crumbs" aria-label="Đường dẫn" data-reveal>
            <a href="index.html">Trang chủ</a>
            <span aria-hidden="true">/</span>
            <span id="crumbCur">{headInfo.crumb}</span>
          </nav>
          <div className="page-head__row">
            <div>
              <h1 id="catTitle" data-reveal>
                {headInfo.title}
              </h1>
              <p className="lead soft" id="catLead" data-reveal>
                {headInfo.lead}
              </p>
            </div>
            <div className="page-head__cats" id="headCats" data-reveal>
              {CAT_ORDER.map((cid) => {
                const on = st.cat.length === 1 && st.cat[0] === cid && !st.type.length;
                return (
                  <a
                    key={cid}
                    href={url.list({ cat: cid })}
                    data-cat={cid}
                    aria-current={on ? 'true' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      setQText('');
                      setSt((prev) => ({
                        ...prev,
                        cat: on ? [] : [cid],
                        type: [],
                        brand: [],
                        vol: [],
                        q: '',
                        shown: PER,
                      }));
                    }}
                  >
                    {CAT[cid].name}
                    <span className="num">{count((p) => p.cat === cid)}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <div className="wrap cat-page">
        <aside className="filters" id="filters" ref={filtersRef} aria-label="Bộ lọc">
          <div className="filters__head">
            <span className="h3">Bộ lọc</span>
            <button
              className="icon-btn"
              type="button"
              data-close-filters
              aria-label="Đóng bộ lọc"
              onClick={closeF}
            >
              <Icon name="x" />
            </button>
          </div>

          <div className="fgroup">
            <p className="fgroup__title">Danh mục</p>
            <div id="fCats">
              {CAT_ORDER.map((cid) => {
                const c = CAT[cid];
                const n = fc.filter((p) => p.cat === cid).length;
                const catOn = st.cat.includes(cid);
                return (
                  <React.Fragment key={cid}>
                    <label className="fcheck">
                      <input
                        type="checkbox"
                        name="cat"
                        value={cid}
                        checked={catOn}
                        disabled={n === 0 && !catOn}
                        onChange={(e) => toggleCheck('cat', cid, e.target.checked)}
                      />
                      <span>{c.name}</span>
                      <span className="num">{n}</span>
                    </label>
                    {c.types.map((t) => {
                      const tn = fc.filter((p) => p.type === t.id).length;
                      const typeOn = st.type.includes(t.id) || st.cat.includes(cid);
                      return (
                        <label key={t.id} className="fcheck fcheck--sub">
                          <input
                            type="checkbox"
                            name="type"
                            value={t.id}
                            checked={typeOn}
                            disabled={tn === 0 && !typeOn}
                            onChange={(e) => toggleCheck('type', t.id, e.target.checked)}
                          />
                          <span>{t.name}</span>
                          <span className="num">{tn}</span>
                        </label>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="fgroup">
            <p className="fgroup__title">Thương hiệu</p>
            <label className="sr-only" htmlFor="fBrandSearch">
              Tìm thương hiệu
            </label>
            <input
              className="fbrand-search"
              id="fBrandSearch"
              type="search"
              placeholder="Tìm thương hiệu…"
              autoComplete="off"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
            />
            <div className="fbrands" id="fBrands">
              {brandList.shown.length ? (
                brandList.shown.map(([k, n, c]) => {
                  const on = st.brand.includes(k);
                  return (
                    <label key={k} className="fcheck">
                      <input
                        type="checkbox"
                        name="brand"
                        value={k}
                        checked={on}
                        disabled={c === 0 && !on}
                        onChange={(e) => toggleCheck('brand', k, e.target.checked)}
                      />
                      <span>{n}</span>
                      <span className="num">{c}</span>
                    </label>
                  );
                })
              ) : (
                <p className="small soft">Không có thương hiệu phù hợp.</p>
              )}
              {!brandList.hasTerm && brandList.brands.length > 12 && (
                <button
                  type="button"
                  className="fmore link"
                  data-all-brands
                  onClick={() => setAllBrands((prev) => !prev)}
                >
                  {allBrands ? 'Thu gọn' : `Xem tất cả ${brandList.brands.length} thương hiệu`}
                </button>
              )}
            </div>
          </div>

          <div className="fgroup">
            <p className="fgroup__title">Dung tích</p>
            <div id="fVols">
              {VOLS.map(([id, label, fn]) => {
                const n = fv.filter((p) => fn(p.ml)).length;
                const on = st.vol.includes(id);
                return (
                  <label key={id} className="fcheck">
                    <input
                      type="checkbox"
                      name="vol"
                      value={id}
                      checked={on}
                      disabled={n === 0 && !on}
                      onChange={(e) => toggleCheck('vol', id, e.target.checked)}
                    />
                    <span>{label}</span>
                    <span className="num">{n}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="filters__apply">
            <button
              className="btn btn--block"
              type="button"
              data-close-filters
              id="applyBtn"
              onClick={closeF}
            >
              Xem {res.length} kết quả
            </button>
          </div>
        </aside>

        <div className="scrim" id="scrim" ref={scrimRef} data-close-filters onClick={closeF}></div>

        <section aria-labelledby="catTitle">
          <div className="toolbar">
            <button
              ref={openBtnRef}
              className="btn btn--ghost btn--sm filter-btn"
              type="button"
              id="openFilters"
              aria-controls="filters"
              aria-expanded="false"
              onClick={openF}
            >
              <Icon name="filter" />
              Bộ lọc <span id="fCount">{nf ? `(${nf})` : ''}</span>
            </button>
            <p className="toolbar__count" id="resCount" aria-live="polite">
              <b>{res.length}</b> sản phẩm
            </p>
            <div className="searchbox">
              <Icon name="search" />
              <label className="sr-only" htmlFor="q">
                Tìm trong catalog
              </label>
              <input
                id="q"
                type="search"
                placeholder="Tìm tên chai, thương hiệu…"
                autoComplete="off"
                value={qText}
                onChange={(e) => setQText(e.target.value)}
              />
            </div>
            <div className="select">
              <label className="sr-only" htmlFor="sort">
                Sắp xếp
              </label>
              <select
                id="sort"
                value={st.sort}
                onChange={(e) => setSt((prev) => ({ ...prev, sort: e.target.value, shown: PER }))}
              >
                <option value="">Nổi bật</option>
                <option value="name">Tên A → Z</option>
                <option value="name-desc">Tên Z → A</option>
                <option value="brand">Thương hiệu</option>
                <option value="vol">Dung tích tăng dần</option>
                <option value="vol-desc">Dung tích giảm dần</option>
              </select>
              <Icon name="down" />
            </div>
          </div>

          <div className="chips" id="chips">
            {chips.map(([k, v, l]) => (
              <button
                key={`${k}-${v}`}
                className="chip"
                type="button"
                data-k={k}
                data-v={v}
                aria-label={`Bỏ lọc ${l}`}
                onClick={() => removeChip(k, v)}
              >
                {l}
                <Icon name="x" />
              </button>
            ))}
            {chips.length > 1 && (
              <button className="chip chip--clear" type="button" data-clear onClick={resetAll}>
                Xoá tất cả
              </button>
            )}
          </div>

          <h2 className="sr-only">Danh sách sản phẩm</h2>

          <div className="pgrid" id="grid">
            {res.length > 0 ? (
              visibleProducts.map((p, k) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={k}
                  cls="is-new"
                  style={{ '--i': k % PER }}
                  onQuickView={openQuick}
                />
              ))
            ) : (
              <div className="empty" style={{ gridColumn: '1/-1' }}>
                <h3 className="h3">Chưa có chai nào khớp bộ lọc</h3>
                <p>Thử bỏ bớt điều kiện, hoặc nhắn Zalo — chúng tôi có thể đặt hàng theo yêu cầu.</p>
                <p style={{ marginTop: '24px' }}>
                  <button className="btn btn--ghost" type="button" data-reset onClick={resetAll}>
                    Xoá bộ lọc
                  </button>
                </p>
              </div>
            )}
          </div>

          <div className="more" id="more" style={{ display: res.length ? '' : 'none' }}>
            <p className="small soft" id="moreText">
              Đang xem {shownCount} / {res.length} chai
            </p>
            <div className="more__bar" aria-hidden="true">
              <i id="moreBar" style={{ width: res.length ? `${(shownCount / res.length) * 100}%` : '0' }}></i>
            </div>
            {shownCount < res.length && (
              <button
                className="btn btn--ghost"
                type="button"
                id="moreBtn"
                onClick={() => setSt((prev) => ({ ...prev, shown: prev.shown + PER }))}
              >
                Xem thêm {Math.min(PER, res.length - shownCount)} chai
              </button>
            )}
          </div>
        </section>
      </div>

      <div
        className="modal"
        id="quick"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quickTitle"
        onClick={(e) => {
          if (e.target === modalRef.current) closeQuick();
        }}
      >
        <div className="modal__box" id="quickBox">
          {quickProduct && (
            <>
              <Niche product={quickProduct} tone="oak" sizes="480px" />
              <div className="modal__body">
                <h2 id="quickTitle" className="h2">
                  {quickProduct.name}
                </h2>
                <p className="pd__price">
                  <b>Giá liên hệ</b> — báo theo lô hàng hiện tại.
                </p>
                <table className="specs" style={{ marginTop: 0 }}>
                  <tbody>
                    {quickRows.map(([k, v]) => (
                      <tr key={k}>
                        <th scope="row">{k}</th>
                        <td>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="pd__cta" style={{ marginTop: 'auto' }}>
                  <a
                    className="btn"
                    href={SITE.zalo}
                    target="_blank"
                    rel="noopener"
                    data-ask={quickProduct.id}
                    onClick={() => copyAsk(quickProduct)}
                  >
                    <Icon name="zalo" />
                    Hỏi giá qua Zalo
                  </a>
                  <a className="btn btn--ghost" href={url.product(quickProduct)}>
                    Xem chi tiết
                    <Icon name="arrow" />
                  </a>
                </div>
              </div>
              <button
                ref={quickCloseRef}
                className="icon-btn modal__close"
                type="button"
                data-close-quick
                aria-label="Đóng"
                onClick={closeQuick}
              >
                <Icon name="x" />
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
