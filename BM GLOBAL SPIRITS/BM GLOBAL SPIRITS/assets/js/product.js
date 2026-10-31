/* BM Global Spirits — chi tiết sản phẩm (chi-tiet-san-pham.html?id=…) */
document.addEventListener('bm:ready', () => {
  const B = window.BM;
  const { P, CAT, TYPE, esc, url, img, srcset, glow, brandName, brandOrigin, fmtAbv, ic, SITE } = B;
  const root = document.getElementById('pd');
  const id = new URLSearchParams(location.search).get('id');
  const p = B.byId[id] || (!id ? B.byId['0370'] : null);

  if (!p) {
    root.innerHTML = `<div class="pd-missing"><h1 class="h2">Không tìm thấy sản phẩm</h1><p class="soft" style="margin-top:16px">Mã “${esc(id)}” không có trong catalog. Có thể sản phẩm đã đổi mã.</p><p style="margin-top:32px"><a class="btn" href="san-pham.html">Về bộ sưu tập</a></p></div>`;
    return;
  }
  document.title = `${p.name}${p.vol ? ' ' + p.vol : ''} — BM Global Spirits`;
  const typeName = p.type ? TYPE[p.type].name : '';
  const ask = B.askText(p);
  const msgr = `${SITE.messenger}?text=${encodeURIComponent(ask)}`;

  const specs = [
    ['Thương hiệu', `<a href="${url.list({ brand: p.brand })}">${esc(brandName(p))}</a>`],
    ['Danh mục', `<a href="${url.list({ cat: p.cat })}">${esc(CAT[p.cat].name)}</a>`],
    ['Loại', typeName ? `<a href="${url.list({ type: p.type })}">${esc(typeName)}</a>` : ''],
    ['Dung tích', esc(p.vol || '')],
    ['Nồng độ cồn', esc(fmtAbv(p.abv))],
    ['Quy cách thùng', p.pack ? `Thùng ${p.pack} chai` : ''],
    ['Đóng gói', p.nobox ? 'Không kèm hộp' : ''],
    ['Xuất xứ thương hiệu', esc(brandOrigin(p))],
    ['Mã sản phẩm', `<span class="num">BM-${p.id}</span>`],
  ].filter((r) => r[1]);

  const views = [
    ['full', 'Toàn chai'],
    ['detail', 'Cận nhãn'],
  ];

  root.innerHTML = `
  <div class="pd">
    <div class="pd__gallery" data-reveal-group>
      <div class="pd__thumbs" role="group" aria-label="Chọn góc xem">
        ${views.map(([v, l], i) => `<button class="pd__thumb ${v === 'detail' ? 'pd__thumb--detail' : ''}" type="button" data-view="${v}" aria-pressed="${i === 0}" aria-label="${l}" style="${v === 'shelf' ? 'background:var(--c-claret-deep)' : ''}"><img src="${img(p.id, 300)}" alt="" width="300" height="400"></button>`).join('')}
      </div>
      <div class="pd__main" data-reveal>
        ${B.niche(p, { tone: 'oak', sizes: '(max-width:960px) 100vw, 55vw', eager: true })}
        <p class="pd__hint">${ic('zoom')}Bấm để phóng to</p>
      </div>
    </div>
    <div class="pd__head" data-reveal-group>
      <nav class="crumbs" aria-label="Đường dẫn" data-reveal><a href="index.html">Trang chủ</a><span aria-hidden="true">/</span><a href="${url.list({ cat: p.cat })}">${esc(CAT[p.cat].name)}</a>${typeName ? `<span aria-hidden="true">/</span><a href="${url.list({ type: p.type })}">${esc(typeName)}</a>` : ''}</nav>
      <h1 data-reveal>${esc(p.name)}</h1>
      <p class="pd__sub soft" data-reveal><a class="pd__brand" href="${url.list({ brand: p.brand })}">${esc(brandName(p))}</a> · ${esc([typeName || CAT[p.cat].name, p.vol, fmtAbv(p.abv)].filter(Boolean).join(' · '))}</p>
    </div>
    <div class="pd__info" data-reveal-group>
      <p class="pd__price" data-reveal><b>Giá liên hệ</b> — báo theo lô hàng hiện tại, trong giờ làm việc.</p>
      <div class="pd__cta" data-reveal>
        <a class="btn" href="${SITE.zalo}" target="_blank" rel="noopener" data-ask="${p.id}">${ic('zalo')}Hỏi giá qua Zalo<span>Chép sẵn tên chai</span></a>
        <a class="btn btn--ghost" href="${msgr}" target="_blank" rel="noopener">${ic('messenger')}Nhắn Messenger</a>
        <a class="btn btn--ghost" href="${SITE.hotlineHref}">${ic('phone')}Gọi Hotline<span class="num">${SITE.hotline}</span></a>
      </div>
      <div class="pd__note-bm" data-reveal>
        <h2>Ghi chú của BM</h2>
        <p>${esc(brandName(p))}${brandOrigin(p) ? ` là thương hiệu đến từ ${esc(brandOrigin(p))}` : ''}${typeName ? `, dòng ${esc(typeName)}` : ''}${p.pack ? `. Quy cách nhập: thùng ${p.pack} chai` : ''}.</p>
        <p class="soft">Ghi chú nếm, nhà chưng cất và gợi ý thưởng thức: <span class="tbc">[[CẦN XÁC NHẬN]]</span></p>
      </div>
      <div class="specs" data-reveal>
        <h2>Thông tin sản phẩm</h2>
        <table><tbody>${specs.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>
      </div>
      <p class="pd__note" data-reveal>Hình ảnh minh hoạ; bao bì, hộp và nhãn có thể thay đổi theo lô nhập. Sản phẩm dành cho người từ 18 tuổi trở lên.</p>
    </div>
  </div>`;

  /* gallery */
  const main = root.querySelector('.pd__main .niche');
  const thumbs = root.querySelectorAll('[data-view]');
  const baseGlow = glow(p);
  function setView(v) {
    thumbs.forEach((t) => t.setAttribute('aria-pressed', t.dataset.view === v));
    main.classList.remove('is-zoom', 'is-detail');
    if (v === 'detail') main.classList.add('is-detail');
  }
  thumbs.forEach((t) => t.addEventListener('click', () => setView(t.dataset.view)));
  main.style.setProperty('--glow', baseGlow);
  const im = main.querySelector('.niche__img');
  im.src = img(p.id, 1200);
  main.addEventListener('click', (e) => {
    if (main.classList.contains('is-detail')) { setView('full'); return; }
    main.classList.toggle('is-zoom');
    move(e);
  });
  function move(e) {
    if (!main.classList.contains('is-zoom')) return;
    const r = main.getBoundingClientRect();
    const ir = im.getBoundingClientRect();
    const x = ((e.clientX - ir.left) / ir.width) * 100;
    const y = ((e.clientY - ir.top) / ir.height) * 100;
    main.style.setProperty('--zx', `${Math.max(0, Math.min(100, x))}%`);
    main.style.setProperty('--zy', `${Math.max(0, Math.min(100, y))}%`);
  }
  main.addEventListener('pointermove', move);
  main.addEventListener('mouseleave', () => main.classList.remove('is-zoom'));

  /* sản phẩm liên quan: cùng thương hiệu → cùng loại → cùng danh mục */
  const seen = new Set([p.id]);
  const pick = (fn) => P.filter((x) => !seen.has(x.id) && fn(x));
  let rel = [];
  [(x) => x.brand === p.brand && !p.brand.startsWith('other'), (x) => p.type && x.type === p.type, (x) => x.cat === p.cat].forEach((fn) => {
    if (rel.length >= 5) return;
    pick(fn).sort((a, b) => (a.flags ? 1 : 0) - (b.flags ? 1 : 0)).slice(0, 5 - rel.length).forEach((x) => { rel.push(x); seen.add(x.id); });
  });
  const sec = document.getElementById('related');
  sec.hidden = false;
  document.getElementById('relGrid').innerHTML = rel.map((x, i) => B.card(x, i + 1, { quick: false })).join('');
  document.querySelectorAll('#relGrid .card').forEach((c) => c.setAttribute('data-reveal', ''));
  const more = document.getElementById('relMore');
  const sameBrand = B.count((x) => x.brand === p.brand);
  if (sameBrand > 1 && !p.brand.startsWith('other')) {
    more.href = url.list({ brand: p.brand });
    more.innerHTML = `Tất cả ${sameBrand} chai ${esc(brandName(p))}${ic('arrow')}`;
  } else {
    more.href = url.list(p.type ? { type: p.type } : { cat: p.cat });
    more.innerHTML = `Xem thêm ${esc(typeName || CAT[p.cat].name)}${ic('arrow')}`;
  }
});
