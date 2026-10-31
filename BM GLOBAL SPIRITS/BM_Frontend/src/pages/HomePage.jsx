import React, { useEffect, useMemo, useRef } from 'react';
import { Icon } from '../components/Icons.jsx';
import { Niche } from '../components/Niche.jsx';
import { useFakeFormSubmit } from '../components/InquiryForm.jsx';
import {
  SITE,
  HERO_PICKS,
  CAT_COVER,
  CAT_ORDER,
  FEATURED,
  STORY,
} from '../data/siteConfig.js';
import {
  D,
  P,
  byId,
  CAT,
  count,
  brandName,
  brandOrigin,
  groupName,
  realBrands,
  countries,
  fmtAbv,
  url,
  img,
  srcset,
  glow,
  metaLine,
  matchFilter,
} from '../utils/helpers.js';
import { gsap, ScrollTrigger, usePageMotion } from '../utils/useMotion.js';

const EXTRA_HERO = ['Bourbon', 'Rum', 'Tequila'];

export function HomePage() {
  usePageMotion([]);
  const stageRef = useRef(null);
  const pickerRef = useRef(null);
  const nameRef = useRef(null);
  const metaRef = useRef(null);
  const linkRef = useRef(null);
  const storyPinRef = useRef(null);
  const originListRef = useRef(null);
  const { formRef, okRef, submitting, sent, onSubmit } = useFakeFormSubmit('home');

  const picks = useMemo(() => HERO_PICKS.filter(([, , id]) => byId[id]), []);
  const smCount = useMemo(() => count((p) => p.type === 'single-malt'), []);
  const blCount = useMemo(() => count((p) => p.type === 'blended'), []);
  const featuredProducts = useMemo(() => FEATURED.map((id) => byId[id]).filter(Boolean), []);
  const storyProducts = useMemo(() => STORY.map((id) => byId[id]).filter(Boolean), []);

  // Origins computation
  const { topOrigins, restOrigins, sortedBrands } = useMemo(() => {
    const byCountry = {};
    realBrands.forEach(([k, b]) => {
      if (!b.origin) return;
      (byCountry[b.origin] ||= { brands: [], n: 0 }).brands.push(k);
    });
    P.forEach((p) => {
      const o = brandOrigin(p);
      if (o && byCountry[o]) byCountry[o].n++;
    });
    const rows = Object.entries(byCountry).sort((a, b) => b[1].n - a[1].n);
    const top = rows.slice(0, 9).map(([c, v]) => {
      const bs = v.brands.map((k) => [k, count((p) => p.brand === k)]).sort((a, b) => b[1] - a[1]);
      return { country: c, totalBrands: v.brands.length, totalBottles: v.n, shown: bs.slice(0, 6), extraCount: Math.max(0, bs.length - 6) };
    });
    const rest = rows.slice(9);
    const sorted = realBrands
      .map(([k, b]) => [k, b.name, count((p) => p.brand === k), b.origin])
      .sort((a, b) => b[2] - a[2]);
    return { topOrigins: top, restOrigins: rest, sortedBrands: sorted };
  }, []);

  // Hero picker & GSAP intro/scroll animations
  useEffect(() => {
    const stage = stageRef.current;
    const picker = pickerRef.current;
    const nameEl = nameRef.current;
    const metaEl = metaRef.current;
    const linkEl = linkRef.current;
    if (!stage || !picker || !picks.length) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cur = 0;
    let timer;

    function show(i, first) {
      const [label, f, id] = picks[i];
      const p = byId[id];
      const n = count(matchFilter(f));
      const nicheEl = stage.querySelector('.niche');
      const apply = () => {
        nicheEl.style.setProperty('--glow', glow(p));
        const im = nicheEl.querySelector('.niche__img');
        const mi = nicheEl.querySelector('.niche__mirror');
        im.srcset = srcset(p.id);
        im.src = img(p.id, 1200);
        im.alt = `${p.name}${p.vol ? ' ' + p.vol : ''}`;
        mi.src = img(p.id, 600);
        nameEl.textContent = p.name;
        metaEl.innerHTML = `1 trong <span class="hero__count">${n}</span> chai ${label} đang có`;
        linkEl.href = url.list(f);
        linkEl.innerHTML = `Xem ${n} chai ${label} <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>`;
      };
      if (first || reduce) {
        apply();
        return;
      }
      const im = nicheEl.querySelector('.niche__img');
      const mi = nicheEl.querySelector('.niche__mirror');
      const beam = nicheEl.querySelector('.niche__beam');
      const tl = gsap.timeline();
      tl.to([im, mi], { autoAlpha: 0, y: 14, duration: 0.35, ease: 'power2.in' })
        .to(beam, { opacity: 0.2, duration: 0.35 }, 0)
        .add(() => {
          apply();
        })
        .add(() => new Promise((r) => {
          if (im.complete) r();
          else im.onload = r;
          setTimeout(r, 600);
        }))
        .fromTo([im, mi], { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out' })
        .fromTo(
          beam,
          { opacity: 0.2, '--beam-x': '-30%' },
          { opacity: 1, '--beam-x': '0%', duration: 1.2, ease: 'expo.out' },
          '<'
        );
    }

    const onClickPicker = (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      cur = +b.dataset.i;
      picker.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      clearInterval(timer);
      show(cur, false);
    };

    picker.addEventListener('click', onClickPicker);
    show(0, true);

    const auto = () => {
      timer = setInterval(() => {
        cur = (cur + 1) % picks.length;
        picker.querySelectorAll('button').forEach((x, k) => x.setAttribute('aria-pressed', String(k === cur)));
        show(cur, false);
      }, 6000);
    };
    if (!reduce) auto();

    const stopTimer = () => clearInterval(timer);
    stage.addEventListener('pointerenter', stopTimer);
    stage.addEventListener('focusin', stopTimer);

    // Story pin observer
    const pin = storyPinRef.current;
    let ioStory;
    if (pin && storyProducts.length && 'IntersectionObserver' in window) {
      const setStory = (k) => {
        const p = storyProducts[k];
        if (!p) return;
        const n = pin.querySelector('.niche');
        if (!n) return;
        n.style.setProperty('--glow', glow(p));
        const im = n.querySelector('.niche__img');
        const mi = n.querySelector('.niche__mirror');
        if (im.dataset.id === p.id) return;
        im.style.opacity = 0;
        mi.style.opacity = 0;
        setTimeout(() => {
          im.srcset = srcset(p.id);
          im.src = img(p.id, 600);
          im.alt = p.name;
          im.dataset.id = p.id;
          mi.src = img(p.id, 300);
          im.style.opacity = '';
          mi.style.opacity = '';
        }, 260);
        const cap = pin.querySelector('figcaption');
        if (cap) cap.innerHTML = `<b>${p.name}</b><span>${metaLine(p)}</span>`;
      };
      const firstIm = pin.querySelector('.niche__img');
      if (firstIm && storyProducts[0]) firstIm.dataset.id = storyProducts[0].id;
      const chapters = document.querySelectorAll('.chapter');
      ioStory = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (e.isIntersecting) setStory(+e.target.dataset.k);
          }),
        { rootMargin: '-45% 0px -45% 0px' }
      );
      chapters.forEach((c) => ioStory.observe(c));
    }

    // Origins active row observer
    let ioOrigins;
    const listEl = originListRef.current;
    if (listEl && 'IntersectionObserver' in window) {
      const rowsEl = listEl.querySelectorAll('.origin-row');
      ioOrigins = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (e.isIntersecting) {
              rowsEl.forEach((r) => r.classList.remove('is-active'));
              e.target.classList.add('is-active');
            }
          }),
        { rootMargin: '-48% 0px -48% 0px' }
      );
      rowsEl.forEach((r) => ioOrigins.observe(r));
    }

    // GSAP Home Intro & ScrollTriggers
    const triggers = [];
    const intro = () => {
      if (reduce) return;
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('.hero__stage .niche__beam', { opacity: 0, '--beam-x': '-60%', duration: 1.8 })
        .from('.hero__stage .niche__img, .hero__stage .niche__mirror', { autoAlpha: 0, y: 40, duration: 1.4 }, 0.25)
        .from('.hero__beam', { autoAlpha: 0, duration: 2.2, ease: 'power2.out' }, 0)
        .from('.hero [data-hero]', { autoAlpha: 0, y: 28, duration: 1.1, stagger: 0.09 }, 0.35)
        .from('.hero__picker, .hero__caption', { autoAlpha: 0, y: 14, duration: 1, stagger: 0.1 }, 0.8);
    };

    if (!reduce) {
      if (document.querySelector('.gate')) {
        document.addEventListener('bm:age-ok', intro, { once: true });
      } else {
        intro();
      }
      const tMarquee = gsap.fromTo(
        '#marquee1',
        { xPercent: 4 },
        {
          xPercent: -36,
          ease: 'none',
          scrollTrigger: { trigger: '.brandwall', start: 'top bottom', end: 'bottom top', scrub: 0.8 },
        }
      );
      const tBeam = gsap.to('.hero__beam', {
        xPercent: 18,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });
      const tImg = gsap.to('.hero__stage .niche__img', {
        yPercent: -6,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });
      [tMarquee, tBeam, tImg].forEach((tw) => tw.scrollTrigger && triggers.push(tw.scrollTrigger));
    }

    return () => {
      clearInterval(timer);
      picker.removeEventListener('click', onClickPicker);
      stage.removeEventListener('pointerenter', stopTimer);
      stage.removeEventListener('focusin', stopTimer);
      document.removeEventListener('bm:age-ok', intro);
      ioStory && ioStory.disconnect();
      ioOrigins && ioOrigins.disconnect();
      triggers.forEach((st) => st.kill());
    };
  }, [picks, storyProducts]);

  const riderP = byId['0352'];
  const sp0 = storyProducts[0];

  return (
    <main id="main">
      {/* HERO ------------------------------------------------------------- */}
      <section className="hero" data-header-over aria-labelledby="heroTitle">
        <span className="hero__beam" aria-hidden="true"></span>
        <div className="hero__text">
          <h1 id="heroTitle" data-hero>
            Rượu mạnh nhập khẩu, tuyển từng chai
          </h1>
          <p className="lead" data-hero>
            BM Global Spirits nhập khẩu và phân phối hơn 600 nhãn whisky, cognac, gin, rum, tequila, sake và rượu Việt thủ công — báo giá riêng cho từng khách.
          </p>
          <div className="hero__actions" data-hero>
            <a className="btn" href="san-pham.html">
              Xem bộ sưu tập
              <Icon name="arrow" />
            </a>
            <a className="link" id="heroLink" ref={linkRef} href="san-pham.html">
              Xem tất cả
            </a>
          </div>
        </div>
        <div className="hero__stage" id="heroStage" ref={stageRef}>
          <div className="niche" data-tone="night" style={{ '--glow': '201 151 75' }}>
            <span className="niche__beam" aria-hidden="true"></span>
            <img
              className="niche__mirror"
              src="assets/img/products/600/0352.webp"
              alt=""
              aria-hidden="true"
              width="600"
              height="800"
            />
            <span className="niche__shadow" aria-hidden="true"></span>
            <img
              className="niche__img"
              src="assets/img/products/1200/0352.webp"
              sizes="(max-width: 960px) 70vw, 40vw"
              alt=""
              width="1200"
              height="1600"
              fetchPriority="high"
            />
          </div>
          <div className="hero__menu">
            <p className="hero__picker-label" id="pickerLabel">
              Soi một dòng rượu
            </p>
            <div className="picker" id="heroPicker" ref={pickerRef} role="group" aria-labelledby="pickerLabel">
              {picks.map(([label], i) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={i === 0}
                  data-i={i}
                  className={EXTRA_HERO.includes(label) ? 'is-extra' : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="hero__dock">
            <div className="hero__caption" aria-live="polite">
              <p className="hero__caption-name" id="heroName" ref={nameRef}></p>
              <p className="hero__caption-meta" id="heroMeta" ref={metaRef}></p>
            </div>
          </div>
        </div>
      </section>

      {/* DANH MỤC ------------------------------------------------------- */}
      <section className="section cats" aria-labelledby="catsTitle">
        <div className="wrap" data-reveal-group>
          <div className="cats__head">
            <h2 id="catsTitle" data-reveal>
              Chọn theo dòng rượu
            </h2>
            <p className="cats__note" id="catNote" data-reveal>
              Whisky chiếm hơn nửa kho: {smCount} chai Single Malt, {blCount} chai Blended, cùng Bourbon, Rye và Irish whiskey.
            </p>
            <a className="link" href="san-pham.html" data-reveal>
              Toàn bộ danh mục
              <Icon name="arrow" />
            </a>
          </div>
          <div className="cats__run" id="catRun">
            {CAT_ORDER.map((cid, i) => {
              const c = CAT[cid];
              const p = byId[CAT_COVER[cid]] || P.find((x) => x.cat === cid);
              const n = count((x) => x.cat === cid);
              const types = c.types.map((t) => t.name).join(', ');
              return (
                <div key={cid} className={`cat${i === 0 ? ' cat--lift' : ''}`} data-reveal>
                  <a href={url.list({ cat: cid })}>
                    <Niche
                      product={p}
                      tone="oak"
                      sizes={i === 0 ? '(max-width:960px) 90vw, 420px' : '(max-width:960px) 44vw, 230px'}
                    />
                    <div className="cat__meta">
                      <span className="cat__name">{c.name}</span>
                      <span className="cat__count">{n} chai</span>
                      {types && i === 0 && <span className="cat__types">{types}</span>}
                    </div>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TUYỂN CHỌN ----------------------------------------------------- */}
      <section className="section feat" aria-labelledby="featTitle">
        <div className="wrap" data-reveal-group>
          <div className="feat__head">
            <div>
              <h2 id="featTitle" data-reveal>
                Tuyển chọn của BM
              </h2>
              <p className="soft prose" data-reveal>
                Tám chai chúng tôi muốn giới thiệu trước. Giá thay đổi theo lô hàng — liên hệ để nhận báo giá và tình trạng hàng.
              </p>
            </div>
            <a className="btn btn--ghost" href="san-pham.html" data-reveal>
              Xem toàn bộ catalog
            </a>
          </div>
          <div className="feat__grid" id="featGrid">
            {featuredProducts.map((p, i) => (
              <a key={p.id} className="tag-card" href={url.product(p)} data-reveal>
                <Niche product={p} tone="oak" sizes="(max-width:960px) 50vw, 25vw" />
                <div className="tag" data-pair={(i % 4) + 1}>
                  <div className="tag__row">
                    <span>{brandName(p)}</span>
                    <span>{[p.vol, fmtAbv(p.abv)].filter(Boolean).join(' · ')}</span>
                  </div>
                  <p className="tag__name">{p.name}</p>
                  <div className="tag__foot">
                    <span>{brandOrigin(p) || groupName(p)}</span>
                    <b>Liên hệ</b>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CÂU CHUYỆN ----------------------------------------------------- */}
      <section className="section story on-paper" aria-labelledby="storyTitle">
        <div className="wrap story__in">
          <figure className="story__pin" id="storyPin" ref={storyPinRef}>
            {sp0 && (
              <>
                <Niche product={sp0} tone="night" sizes="(max-width:960px) 90vw, 40vw" />
                <figcaption>
                  <b>{sp0.name}</b>
                  <span>{metaLine(sp0)}</span>
                </figcaption>
              </>
            )}
          </figure>
          <div>
            <div className="story__intro" data-reveal-group>
              <h2 id="storyTitle" data-reveal>
                Trước khi chai rượu đến tay bạn
              </h2>
              <p className="lead" data-reveal>
                BM Global Spirits là nhà nhập khẩu và phân phối rượu mạnh. Chúng tôi không bán mọi thứ — chỉ những chai mình hiểu rõ nguồn gốc và có thể đứng sau giới thiệu.
              </p>
            </div>
            <article className="chapter" data-k="0" data-reveal-group>
              <h3 data-reveal>Chọn vì người uống, không vì kệ hàng</h3>
              <p data-reveal>
                Danh mục đi từ những chai quen thuộc cho quầy bar đến các bản giới hạn cho người sưu tầm: Single Malt từ Speyside và Islay, cognac Pháp, sake Nhật và cả những chai rượu Việt thủ công như Lady Triệu hay Halong.
              </p>
            </article>
            <article className="chapter" data-k="1" data-reveal-group>
              <h3 data-reveal>Giữ chai như lúc rời nhà máy</h3>
              <p data-reveal>
                Rượu mạnh không sợ thời gian, chỉ sợ nắng và nóng. Hàng được lưu kho{' '}
                <span className="tbc">[[CẦN XÁC NHẬN: điều kiện kho]]</span>, kiểm tem, nắp và hộp trước khi xuất — chai đến tay bạn còn nguyên như ngày đóng.
              </p>
            </article>
            <article className="chapter" data-k="2" data-reveal-group>
              <h3 data-reveal>Báo giá riêng cho từng chai</h3>
              <p data-reveal>
                Nhắn tên chai qua Zalo hoặc Messenger để nhận giá theo lô hàng hiện tại. Giao tận nơi tại{' '}
                <span className="tbc">[[CẦN XÁC NHẬN: khu vực giao]]</span>; nhà hàng, quầy bar và đại lý có chính sách riêng.
              </p>
              <p data-reveal style={{ marginTop: '32px' }}>
                <a className="link" href="gioi-thieu.html">
                  Về BM Global Spirits
                  <Icon name="arrow" />
                </a>
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* XUẤT XỨ -------------------------------------------------------- */}
      <section className="section origins" aria-labelledby="originsTitle">
        <div className="wrap origins__head" data-reveal-group>
          <h2 id="originsTitle" data-reveal>
            Thương hiệu &amp; xuất xứ
          </h2>
          <p id="originLead" data-reveal>
            {realBrands.length} thương hiệu từ {countries.length} quốc gia — từ Speyside, Islay đến Cognac, Jalisco, Kyoto và Đà Lạt.
          </p>
        </div>
        <div className="origins__body">
          <div className="origins__rider" id="originRider" aria-hidden="true">
            {riderP && (
              <div className="origins__rider-in" style={{ '--glow': glow(riderP) }}>
                <span className="origins__rider-beam"></span>
                <img src={img(riderP.id, 600)} alt="" loading="lazy" width="600" height="800" />
              </div>
            )}
          </div>
          <div id="originList" ref={originListRef} data-reveal-group>
            {topOrigins.map((row) => (
              <div key={row.country} className="origin-row" data-reveal>
                <h3 className="origin-row__country">{row.country}</h3>
                <div className="origin-row__brands">
                  <span className="origin-row__count">
                    {row.totalBrands} thương hiệu · {row.totalBottles} chai
                  </span>
                  {row.shown.map(([k], idx) => (
                    <React.Fragment key={k}>
                      {idx > 0 && ', '}
                      <a href={url.list({ brand: k })}>{D.brands[k].name}</a>
                    </React.Fragment>
                  ))}
                  {row.extraCount > 0 ? ` và ${row.extraCount} thương hiệu khác` : ''}
                </div>
              </div>
            ))}
            {restOrigins.length > 0 && (
              <div className="origin-row" data-reveal>
                <h3 className="origin-row__country">{restOrigins.length} quốc gia khác</h3>
                <div className="origin-row__brands">
                  <span className="origin-row__count">
                    {restOrigins.reduce((s, [, v]) => s + v.n, 0)} chai
                  </span>
                  {restOrigins.map(([c]) => c).join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="brandwall" aria-labelledby="brandsTitle">
        <div className="wrap brandwall__head" data-reveal-group>
          <h2 id="brandsTitle" data-reveal>
            Những cái tên trong kho
          </h2>
          <p className="soft" data-reveal>
            Những nhà chưng cất có nhiều chai nhất trong kho. Bấm tên để xem từng chai.
          </p>
        </div>
        <div className="marquee" id="marquee1" aria-hidden="true">
          {sortedBrands.slice(0, 30).map(([k, n]) => (
            <span key={k}>{n}</span>
          ))}
        </div>
        <div className="wrap brandwall__foot">
          <ul className="brand-top" id="brandTop" aria-label="Thương hiệu có nhiều chai nhất">
            {sortedBrands.slice(0, 24).map(([k, n, c, o]) => (
              <li key={k}>
                <a href={url.list({ brand: k })}>
                  <span className="brand-top__name">{n}</span>
                  <span className="brand-top__meta">
                    {c} chai{o ? ' · ' + o : ''}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <a className="btn btn--ghost" href="san-pham.html#fBrands" id="brandAll">
            Xem cả {realBrands.length} thương hiệu
          </a>
        </div>
      </section>

      {/* LIÊN HỆ -------------------------------------------------------- */}
      <section className="coupon-wrap" aria-labelledby="contactTitle">
        <div className="wrap" data-reveal-group>
          <div className="coupon">
            <div className="coupon__left" data-reveal>
              <h2 id="contactTitle">Hỏi giá một chai hay cả thùng</h2>
              <p>
                Gửi tên chai bạn cần. Chúng tôi trả lời giá và tình trạng hàng qua kênh bạn chọn, thường trong giờ làm việc{' '}
                <span className="tbc">[[CẦN XÁC NHẬN]]</span>.
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
              <form
                ref={formRef}
                className={`form form--2${sent ? ' is-sent' : ''}`}
                data-fake
                noValidate
                onSubmit={onSubmit}
              >
                <div className="field">
                  <input id="cName" name="name" placeholder=" " required autoComplete="name" />
                  <label htmlFor="cName">Tên của bạn</label>
                </div>
                <div className="field">
                  <input id="cPhone" name="phone" type="tel" placeholder=" " required autoComplete="tel" inputMode="tel" />
                  <label htmlFor="cPhone">Số điện thoại</label>
                </div>
                <div className="field full">
                  <input id="cWant" name="want" placeholder=" " />
                  <label htmlFor="cWant">Chai quan tâm (nếu có)</label>
                </div>
                <button className="btn btn--block full" type="submit" disabled={submitting}>
                  {submitting ? 'Đang gửi…' : 'Gửi yêu cầu báo giá'}
                </button>
                <div ref={okRef} className="form__ok full" role="status">
                  <Icon name="check" />
                  <div>
                    <b>Đã nhận yêu cầu.</b>
                    <br />
                    Chúng tôi sẽ gọi lại cho bạn sớm. (Bản mockup — form chưa gửi dữ liệu.)
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
