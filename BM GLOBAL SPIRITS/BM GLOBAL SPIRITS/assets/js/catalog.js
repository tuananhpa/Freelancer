/* BM Global Spirits — catalog (san-pham.html)
   Lọc theo danh mục / loại / thương hiệu / dung tích, tìm kiếm, sắp xếp, "Xem thêm".
   Toàn bộ trạng thái lọc nằm trên URL (?cat=&type=&brand=&vol=&q=&sort=). */
document.addEventListener('bm:ready', () => {
  const B = window.BM;
  const { P, D, CAT, TYPE, esc, url, card, count, brandName, fold, ic } = B;
  const PER = 24;
  const VOLS = [
    ['mini', 'Mini (đến 200 ml)', (ml) => ml <= 200],
    ['half', '300 – 500 ml', (ml) => ml > 200 && ml < 700],
    ['std', '700 – 750 ml', (ml) => ml >= 700 && ml <= 750],
    ['litre', '1 lít', (ml) => ml > 750 && ml <= 1000],
    ['big', 'Trên 1 lít', (ml) => ml > 1000],
    ['na', 'Chưa ghi dung tích', (ml) => !ml],
  ];
  const CAT_ORDER = ['whisky', 'cognac-brandy', 'spirits', 'japanese-spirits', 'liqueurs-aperitifs', 'vietnamese-spirits'];
  const brandCount = {};
  P.forEach((p) => { brandCount[p.brand] = (brandCount[p.brand] || 0) + 1; });

  /* ---------- trạng thái <-> URL ---------- */
  const qs = new URLSearchParams(location.search);
  const list = (k) => (qs.get(k) ? qs.get(k).split(',').filter(Boolean) : []);
  const st = { cat: list('cat'), type: list('type'), brand: list('brand'), vol: list('vol'), q: qs.get('q') || '', sort: qs.get('sort') || '', shown: PER };
  // type đã chọn thì không cần cat cha
  function toURL() {
    const o = new URLSearchParams();
    ['cat', 'type', 'brand', 'vol'].forEach((k) => { if (st[k].length) o.set(k, st[k].join(',')); });
    if (st.q) o.set('q', st.q);
    if (st.sort) o.set('sort', st.sort);
    const s = o.toString().replace(/%2C/g, ',');
    history.replaceState(null, '', s ? `?${s}` : location.pathname);
  }

  /* ---------- lọc ---------- */
  const IDX = P.map((p) => fold(`${p.name} ${brandName(p)} ${p.type ? TYPE[p.type].name : ''} ${CAT[p.cat].name} ${p.vol || ''}`));
  function pass(p, i, skip) {
    if (skip !== 'cat' && (st.cat.length || st.type.length)) {
      const ok = st.cat.includes(p.cat) || (p.type && st.type.includes(p.type));
      if (!ok) return false;
    }
    if (skip !== 'brand' && st.brand.length && !st.brand.includes(p.brand)) return false;
    if (skip !== 'vol' && st.vol.length && !st.vol.some((v) => VOLS.find((x) => x[0] === v)[2](p.ml))) return false;
    if (st.q) {
      const terms = fold(st.q).split(' ').filter(Boolean);
      if (!terms.every((t) => IDX[i].includes(t))) return false;
    }
    return true;
  }
  function results() {
    const r = P.filter((p, i) => pass(p, i));
    const by = {
      '': (a, b) => CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b.cat) || (rank(a) - rank(b)) || brandCount[b.brand] - brandCount[a.brand] || a.name.localeCompare(b.name),
      name: (a, b) => a.name.localeCompare(b.name, 'vi'),
      'name-desc': (a, b) => b.name.localeCompare(a.name, 'vi'),
      brand: (a, b) => brandName(a).localeCompare(brandName(b), 'vi') || a.name.localeCompare(b.name),
      vol: (a, b) => (a.ml || 1e9) - (b.ml || 1e9),
      'vol-desc': (a, b) => (b.ml || 0) - (a.ml || 0),
    }[st.sort] || ((a, b) => 0);
    r.sort(by);
    if (st.sort) return r;
    // "Nổi bật": trong mỗi danh mục, xen kẽ thương hiệu để đầu trang đa dạng
    const out = [];
    CAT_ORDER.forEach((cid) => {
      const groups = {};
      r.filter((p) => p.cat === cid).forEach((p) => { (groups[p.brand] ||= []).push(p); });
      const g = Object.values(groups).sort((a, b) => b.length - a.length || rank(a[0]) - rank(b[0]));
      for (let i = 0; g.some((x) => x[i]); i++) g.forEach((x) => { if (x[i]) out.push(x[i]); });
    });
    // giữ ảnh cần xem lại ở cuối mỗi danh mục
    return out.sort((a, b) => CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b.cat) || (rank(a) === 3) - (rank(b) === 3));
  }
  // chai đứng một mình lên trước, hộp/nhiều chai sau, ảnh cần xem lại cuối cùng
  function rank(p) { const f = p.flags || []; return f.includes('review') ? 3 : (f.includes('wide') || (p.ratio || 0) > 0.55) ? 1 : 0; }
  const facet = (skip) => P.filter((p, i) => pass(p, i, skip));

  /* ---------- render bộ lọc ---------- */
  const fCats = document.getElementById('fCats');
  const fBrands = document.getElementById('fBrands');
  const fVols = document.getElementById('fVols');
  const fBrandSearch = document.getElementById('fBrandSearch');
  let allBrands = location.hash === '#fBrands';
  const chk = (name, val, label, n, on, sub) => `<label class="fcheck${sub ? ' fcheck--sub' : ''}"><input type="checkbox" name="${name}" value="${val}"${on ? ' checked' : ''}${n === 0 && !on ? ' disabled' : ''}><span>${esc(label)}</span><span class="num">${n}</span></label>`;

  function renderFilters() {
    const fc = facet('cat');
    fCats.innerHTML = CAT_ORDER.map((cid) => {
      const c = CAT[cid];
      const n = fc.filter((p) => p.cat === cid).length;
      return chk('cat', cid, c.name, n, st.cat.includes(cid)) +
        c.types.map((t) => chk('type', t.id, t.name, fc.filter((p) => p.type === t.id).length, st.type.includes(t.id) || st.cat.includes(cid), true)).join('');
    }).join('');
    const fb = facet('brand');
    const bc = {};
    fb.forEach((p) => { bc[p.brand] = (bc[p.brand] || 0) + 1; });
    const term = fold(fBrandSearch.value || '');
    const brands = Object.entries(D.brands)
      .map(([k, b]) => [k, b.name + (k.startsWith('other') ? ` (${CAT[k.replace('other-', '')]?.name || ''})` : ''), bc[k] || 0])
      .filter(([k, n, c]) => (c > 0 || st.brand.includes(k)) && (!term || fold(n).includes(term)))
      .sort((a, b) => (st.brand.includes(b[0]) - st.brand.includes(a[0])) || fold(a[1].replace(/^the /i, '')).localeCompare(fold(b[1].replace(/^the /i, ''))));
    // gọn: thương hiệu đang chọn + 10 thương hiệu nhiều chai nhất; tìm kiếm hoặc "xem tất cả" thì hiện đủ
    let shown = brands;
    if (!term && !allBrands && brands.length > 12) {
      const top = new Set(brands.slice().sort((a, b) => b[2] - a[2]).slice(0, 10).map((x) => x[0]));
      shown = brands.filter(([k]) => st.brand.includes(k) || top.has(k)).sort((a, b) => b[2] - a[2]);
    }
    fBrands.innerHTML = (shown.map(([k, n, c]) => chk('brand', k, n, c, st.brand.includes(k))).join('') || '<p class="small soft">Không có thương hiệu phù hợp.</p>') +
      (!term && brands.length > 12 ? `<button type="button" class="fmore link" data-all-brands>${allBrands ? 'Thu gọn' : `Xem tất cả ${brands.length} thương hiệu`}</button>` : '');
    const fv = facet('vol');
    fVols.innerHTML = VOLS.map(([id, label, fn]) => chk('vol', id, label, fv.filter((p) => fn(p.ml)).length, st.vol.includes(id))).join('');
    const nf = st.cat.length + st.type.length + st.brand.length + st.vol.length;
    document.getElementById('fCount').textContent = nf ? `(${nf})` : '';
  }

  function onCheck(e) {
    const i = e.target;
    if (i.type !== 'checkbox') return;
    const k = i.name, v = i.value;
    const arr = st[k];
    if (i.checked) arr.push(v); else st[k] = arr.filter((x) => x !== v);
    if (k === 'cat') { // chọn/bỏ cả danh mục thì bỏ các loại con riêng lẻ
      const types = CAT[v].types.map((t) => t.id);
      st.type = st.type.filter((t) => !types.includes(t));
    }
    if (k === 'type' && !i.checked) { // bỏ một loại khi đang chọn cả danh mục cha -> tách thành các loại còn lại
      const parent = TYPE[v].cat;
      if (st.cat.includes(parent)) {
        st.cat = st.cat.filter((c) => c !== parent);
        st.type = st.type.concat(CAT[parent].types.map((t) => t.id).filter((t) => t !== v));
      }
    }
    st.shown = PER;
    update();
  }
  document.getElementById('filters').addEventListener('change', onCheck);
  fBrandSearch.addEventListener('input', renderFilters);
  fBrands.addEventListener('click', (e) => { if (e.target.closest('[data-all-brands]')) { allBrands = !allBrands; renderFilters(); } });

  /* ---------- chips ---------- */
  const chipsEl = document.getElementById('chips');
  function renderChips() {
    const items = [];
    st.cat.forEach((v) => items.push(['cat', v, CAT[v].name]));
    st.type.forEach((v) => items.push(['type', v, TYPE[v].name]));
    st.brand.forEach((v) => items.push(['brand', v, D.brands[v] ? D.brands[v].name : v]));
    st.vol.forEach((v) => items.push(['vol', v, VOLS.find((x) => x[0] === v)[1]]));
    if (st.q) items.push(['q', st.q, `“${st.q}”`]);
    chipsEl.innerHTML = items.map(([k, v, l]) => `<button class="chip" type="button" data-k="${k}" data-v="${esc(v)}" aria-label="Bỏ lọc ${esc(l)}">${esc(l)}${ic('x')}</button>`).join('') +
      (items.length > 1 ? '<button class="chip chip--clear" type="button" data-clear>Xoá tất cả</button>' : '');
  }
  chipsEl.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-clear')) { st.cat = []; st.type = []; st.brand = []; st.vol = []; st.q = ''; qInput.value = ''; }
    else if (b.dataset.k === 'q') { st.q = ''; qInput.value = ''; }
    else st[b.dataset.k] = st[b.dataset.k].filter((x) => x !== b.dataset.v);
    st.shown = PER;
    update();
  });

  /* ---------- lưới + xem thêm ---------- */
  const grid = document.getElementById('grid');
  const moreBtn = document.getElementById('moreBtn');
  let res = [];
  function renderGrid(append) {
    const from = append ? grid.children.length : 0;
    const slice = res.slice(from, st.shown);
    const html = slice.map((p, k) => card(p, from + k, { cls: 'is-new', style: `--i:${k}` })).join('');
    if (append) grid.insertAdjacentHTML('beforeend', html); else grid.innerHTML = html;
    if (!res.length) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3 class="h3">Chưa có chai nào khớp bộ lọc</h3><p>Thử bỏ bớt điều kiện, hoặc nhắn Zalo — chúng tôi có thể đặt hàng theo yêu cầu.</p><p style="margin-top:24px"><button class="btn btn--ghost" type="button" data-reset>Xoá bộ lọc</button></p></div>`;
    }
    const shown = Math.min(st.shown, res.length);
    document.getElementById('more').style.display = res.length ? '' : 'none';
    document.getElementById('moreText').textContent = `Đang xem ${shown} / ${res.length} chai`;
    document.getElementById('moreBar').style.width = res.length ? `${(shown / res.length) * 100}%` : '0';
    moreBtn.style.display = shown < res.length ? '' : 'none';
    moreBtn.textContent = `Xem thêm ${Math.min(PER, res.length - shown)} chai`;
  }
  moreBtn.addEventListener('click', () => { st.shown += PER; renderGrid(true); });
  grid.addEventListener('click', (e) => { if (e.target.closest('[data-reset]')) { st.cat = []; st.type = []; st.brand = []; st.vol = []; st.q = ''; qInput.value = ''; update(); } });

  /* ---------- tiêu đề trang theo bộ lọc ---------- */
  function renderHead() {
    const title = document.getElementById('catTitle');
    const lead = document.getElementById('catLead');
    let t = 'Bộ sưu tập rượu nhập khẩu';
    if (st.brand.length === 1 && !st.cat.length && !st.type.length) t = D.brands[st.brand[0]].name;
    else if (st.type.length === 1 && !st.cat.length) t = TYPE[st.type[0]].name;
    else if (st.cat.length === 1 && !st.type.length) t = CAT[st.cat[0]].name;
    title.textContent = t;
    document.getElementById('crumbCur').textContent = t === 'Bộ sưu tập rượu nhập khẩu' ? 'Bộ sưu tập' : t;
    document.title = `${t} — BM Global Spirits`;
    const nb = new Set(res.map((p) => p.brand).filter((b) => !b.startsWith('other'))).size;
    lead.textContent = `${res.length} chai từ ${nb} thương hiệu. Giá theo từng lô hàng — bấm vào chai để hỏi giá.`;
    document.getElementById('resCount').innerHTML = `<b>${res.length}</b> sản phẩm`;
    // lối tắt danh mục
    document.getElementById('headCats').innerHTML = CAT_ORDER.map((cid) => {
      const on = st.cat.length === 1 && st.cat[0] === cid && !st.type.length;
      return `<a href="${url.list({ cat: cid })}" data-cat="${cid}"${on ? ' aria-current="true"' : ''}>${esc(CAT[cid].name)}<span class="num">${count((p) => p.cat === cid)}</span></a>`;
    }).join('');
  }
  document.getElementById('headCats').addEventListener('click', (e) => {
    const a = e.target.closest('a[data-cat]');
    if (!a) return;
    e.preventDefault();
    const cid = a.dataset.cat;
    const same = st.cat.length === 1 && st.cat[0] === cid && !st.type.length;
    st.cat = same ? [] : [cid]; st.type = []; st.brand = []; st.vol = []; st.q = ''; qInput.value = ''; st.shown = PER;
    update();
  });

  function update() {
    res = results();
    toURL();
    renderFilters();
    renderChips();
    renderHead();
    renderGrid(false);
  }

  /* ---------- tìm kiếm & sắp xếp ---------- */
  const qInput = document.getElementById('q');
  const sortSel = document.getElementById('sort');
  qInput.value = st.q;
  sortSel.value = st.sort;
  let tq;
  qInput.addEventListener('input', () => { clearTimeout(tq); tq = setTimeout(() => { st.q = qInput.value.trim(); st.shown = PER; update(); }, 180); });
  sortSel.addEventListener('change', () => { st.sort = sortSel.value; st.shown = PER; update(); });

  /* ---------- drawer bộ lọc (mobile) ---------- */
  const filters = document.getElementById('filters');
  const scrim = document.getElementById('scrim');
  const mobile = () => window.matchMedia('(max-width: 960px)').matches;
  let untrapF = null;
  const openBtn = document.getElementById('openFilters');
  const openF = () => { B.pop(filters, true); B.pop(scrim, true); document.body.classList.add('is-locked'); openBtn.setAttribute('aria-expanded', 'true'); untrapF = B.trap(filters); setTimeout(() => filters.querySelector('[data-close-filters]').focus(), 60); };
  const closeF = () => { if (!filters.classList.contains('is-open')) return; B.pop(filters, false); B.pop(scrim, false); document.body.classList.remove('is-locked'); openBtn.setAttribute('aria-expanded', 'false'); if (untrapF) { untrapF(); untrapF = null; } openBtn.focus(); };
  document.getElementById('openFilters').addEventListener('click', openF);
  document.querySelectorAll('[data-close-filters]').forEach((b) => b.addEventListener('click', closeF));
  const applyBtn = document.getElementById('applyBtn');
  const _upd = update;

  /* ---------- xem nhanh ---------- */
  const modal = document.getElementById('quick');
  const box = document.getElementById('quickBox');
  let lastFocus, untrapQ = null;
  function openQuick(p) {
    lastFocus = document.activeElement;
    const rows = [['Thương hiệu', brandName(p)], ['Danh mục', p.type ? `${CAT[p.cat].name} · ${TYPE[p.type].name}` : CAT[p.cat].name], ['Dung tích', p.vol], ['Nồng độ', B.fmtAbv(p.abv)], ['Xuất xứ', B.brandOrigin(p)]].filter((r) => r[1]);
    box.innerHTML = `${B.niche(p, { tone: 'oak', sizes: '480px' })}
      <div class="modal__body">
        <h2 id="quickTitle" class="h2">${esc(p.name)}</h2>
        <p class="pd__price"><b>Giá liên hệ</b> — báo theo lô hàng hiện tại.</p>
        <table class="specs" style="margin-top:0"><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>
        <div class="pd__cta" style="margin-top:auto">
          <a class="btn" href="${B.SITE.zalo}" target="_blank" rel="noopener" data-ask="${p.id}">${ic('zalo')}Hỏi giá qua Zalo</a>
          <a class="btn btn--ghost" href="${url.product(p)}">Xem chi tiết${ic('arrow')}</a>
        </div>
      </div>
      <button class="icon-btn modal__close" type="button" data-close-quick aria-label="Đóng">${ic('x')}</button>`;
    B.pop(modal, true);
    untrapQ = B.trap(modal);
    document.body.classList.add('is-locked');
    box.querySelector('[data-close-quick]').focus();
  }
  const closeQuick = () => { if (untrapQ) { untrapQ(); untrapQ = null; } B.pop(modal, false); document.body.classList.remove('is-locked'); lastFocus && lastFocus.focus(); };
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-quick]');
    if (b) { e.preventDefault(); openQuick(B.byId[b.dataset.quick]); }
  });
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('[data-close-quick]')) closeQuick(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (modal.classList.contains('is-open')) closeQuick(); closeF(); } });

  update();
  applyBtn.textContent = `Xem ${res.length} kết quả`;
  // cập nhật nhãn nút áp dụng
  const origRender = renderHead;
  const obs = new MutationObserver(() => { applyBtn.textContent = `Xem ${res.length} kết quả`; });
  obs.observe(document.getElementById('resCount'), { childList: true, subtree: true });
});
