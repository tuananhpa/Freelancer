/* ESER Admin — trình chỉnh nội dung dựa trên schema, không thư viện */
(() => {
  'use strict';
  const d = document;
  const $ = (s, c = d) => c.querySelector(s), $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const h = (tag, attrs = {}, ...kids) => {
    const el = d.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach((c) => c != null && c !== false && el.append(c.nodeType ? c : d.createTextNode(String(c))));
    return el;
  };
  const money = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
  const uid = (p = 'id') => p + '-' + Math.random().toString(36).slice(2, 8);
  const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
  const fmtDate = (iso) => { const t = new Date(iso); return t.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }); };

  /* ---------- API ---------- */
  async function api(path, opt = {}) {
    const r = await fetch(path, { credentials: 'same-origin', ...opt, headers: { 'Content-Type': 'application/json', 'X-Eser-Admin': '1', ...(opt.headers || {}) } });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && path !== '/api/login') { showLogin(); throw new Error('Phiên đăng nhập đã hết hạn'); }
    if (!r.ok) throw new Error(j.error || 'Lỗi ' + r.status);
    return j;
  }

  /* ---------- toast ---------- */
  let tT;
  function toast(msg, err) { const t = $('#toast'); t.textContent = msg; t.classList.toggle('err', !!err); t.classList.add('show'); clearTimeout(tT); tT = setTimeout(() => t.classList.remove('show'), 2800); }

  /* ---------- state ---------- */
  let C = null;            // content
  let dirty = false;
  let current = 'dashboard';
  let inquiries = [];
  let mediaCache = null;

  function setDirty(v = true) {
    dirty = v;
    $('#save').disabled = !v;
    const s = $('#status');
    s.className = 'top__status mono' + (v ? ' dirty' : '');
    s.textContent = v ? '● Chưa lưu' : '';
  }
  async function save() {
    if (!dirty) return;
    const btn = $('#save'); btn.disabled = true; btn.textContent = 'Đang lưu…';
    try {
      await api('/api/content', { method: 'PUT', body: JSON.stringify(C) });
      setDirty(false);
      const s = $('#status'); s.className = 'top__status mono ok'; s.textContent = '✓ Đã lưu ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      toast('Đã lưu — website đã cập nhật');
    } catch (e) { toast(e.message, true); btn.disabled = false; }
    btn.textContent = 'Lưu thay đổi';
  }
  $('#save').addEventListener('click', save);
  d.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } });
  addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- schema ---------- */
  const RICH = 'Bọc chữ trong *dấu sao* để in nghiêng màu nhấn. Enter để xuống dòng.';
  const catOpts = () => (C.categories || []).map((c) => [c.id, c.name]);
  const SECTIONS = [
    { grp: 'Tổng quan' },
    { id: 'dashboard', icon: '◎', title: 'Bảng điều khiển', desc: 'Tóm tắt nhanh website của bạn', custom: renderDashboard },
    { id: 'inquiries', icon: '✉', title: 'Đơn hàng & liên hệ', desc: 'Khách gửi từ website (giỏ hàng và form liên hệ)', custom: renderInquiries },
    { grp: 'Nội dung trang chủ' },
    { id: 'hero', icon: '▲', title: 'Banner đầu trang', desc: 'Phần khách nhìn thấy đầu tiên', path: 'hero', fields: [
      { k: 'tagline', label: 'Dòng chữ nghiêng phía trên', t: 'text', help: RICH },
      { k: 'wordmark', label: 'Chữ lớn (wordmark)', t: 'text', help: 'Nên ngắn: 3–6 ký tự, ví dụ ESER' },
      { k: 'pitch', label: 'Câu giới thiệu (góc trái dưới)', t: 'textarea', full: true, help: RICH },
      { k: 'ctaText', label: 'Chữ trên nút', t: 'text' },
      { k: 'ctaLink', label: 'Nút dẫn tới', t: 'select', opts: () => LINKS },
      { k: 'labels', label: '3 nhãn nhỏ phía trên', t: 'strings', max: 3, full: true },
      { k: 'images', label: '3 ảnh vòm (trái · giữa · phải)', t: 'images', max: 3, full: true, help: 'Ảnh dọc, người mẫu ở giữa khung. Ảnh giữa hiển thị lớn nhất.' },
    ] },
    { id: 'marquee', icon: '↔', title: 'Dải chữ chạy', desc: 'Dải màu tối với chữ chạy ngang dưới banner', path: 'marquee', fields: [
      { k: 'items', label: 'Các cụm chữ', t: 'strings', full: true, help: 'Nhấn Enter sau mỗi cụm. 4–8 cụm là đẹp.' },
    ] },
    { id: 'about', icon: '❝', title: 'Giới thiệu thương hiệu', desc: 'Câu tuyên ngôn lớn + số liệu', path: 'about', fields: [
      { k: 'eyebrow', label: 'Nhãn nhỏ', t: 'text' },
      { k: 'headline', label: 'Câu tuyên ngôn (hiện dần khi cuộn)', t: 'textarea', full: true, help: RICH },
      { k: 'body', label: 'Đoạn mô tả', t: 'textarea', full: true },
      { k: 'stats', label: 'Số liệu (tối đa 4)', t: 'list', full: true, max: 4, itemTitle: (s) => `${s.value || '—'} · ${s.label || ''}`, newItem: () => ({ value: '100+', label: 'Mô tả' }), item: [
        { k: 'value', label: 'Con số', t: 'text', help: 'Ví dụ: 2020, 30K, 200+, 07 (số sẽ chạy từ 0 khi cuộn tới)' },
        { k: 'label', label: 'Mô tả', t: 'text' },
      ] },
    ] },
    { grp: 'Sản phẩm' },
    { id: 'products', icon: '✦', title: 'Sản phẩm', desc: 'Thêm, sửa, ẩn/hiện, sắp xếp sản phẩm', path: '', fields: [
      { k: 'products', t: 'list', full: true, filter: true, addLabel: '+ Thêm sản phẩm',
        thumb: (p) => (p.images || [])[0],
        itemTitle: (p) => p.name || '(chưa đặt tên)',
        itemSub: (p) => `${(C.categories.find((c) => c.id === p.category) || {}).name || 'Chưa chọn danh mục'} · ${Number(p.price) ? money(p.price) : 'Liên hệ'}`,
        itemTags: (p) => [p.visible === false && ['Đang ẩn', 'off'], p.badge && [p.badge, 'red']].filter(Boolean),
        newItem: () => ({ id: uid('sp'), name: 'Sản phẩm mới', category: (C.categories[0] || {}).id || '', price: 0, oldPrice: 0, badge: '', sizes: ['S', 'M', 'L', 'XL'], description: '', details: '', images: [], visible: true }),
        item: [
          { k: 'name', label: 'Tên sản phẩm', t: 'text' },
          { k: 'category', label: 'Danh mục', t: 'select', opts: catOpts },
          { k: 'price', label: 'Giá bán', t: 'money', help: 'Để 0 nếu muốn hiển thị "Liên hệ"' },
          { k: 'oldPrice', label: 'Giá gốc (gạch ngang, nếu giảm giá)', t: 'money' },
          { k: 'badge', label: 'Nhãn nổi bật', t: 'text', help: 'Ví dụ: Mới, Bán chạy, -20%. Để trống nếu không cần' },
          { k: 'visible', label: 'Hiển thị trên website', t: 'toggle' },
          { k: 'sizes', label: 'Size có sẵn', t: 'strings', full: true, help: 'Nhấn Enter sau mỗi size' },
          { k: 'description', label: 'Mô tả ngắn', t: 'textarea', full: true },
          { k: 'details', label: 'Chi tiết (mỗi dòng một ý)', t: 'textarea', full: true, help: 'Chất liệu, dáng, lưu ý…' },
          { k: 'images', label: 'Ảnh sản phẩm', t: 'images', full: true, help: 'Ảnh đầu tiên là ảnh bìa; ảnh thứ 2 hiện khi rê chuột. Nên dùng ảnh dọc tỉ lệ 2:3.' },
        ] },
    ] },
    { id: 'categories', icon: '▤', title: 'Danh mục', desc: 'Nhóm sản phẩm & thứ tự hiển thị trong bộ sưu tập', path: '', fields: [
      { k: 'categories', t: 'list', full: true, addLabel: '+ Thêm danh mục', itemTitle: (c) => c.name || '(chưa đặt tên)',
        itemSub: (c) => `${(C.products || []).filter((p) => p.category === c.id).length} sản phẩm`,
        newItem: () => ({ id: uid('dm'), name: 'Danh mục mới', short: 'Mới' }),
        onRemove: (c) => { const n = (C.products || []).filter((p) => p.category === c.id).length; return !n || confirm(`Danh mục này đang có ${n} sản phẩm. Các sản phẩm đó sẽ hiển thị ở nhóm "Khác". Vẫn xoá?`); },
        item: [
          { k: 'name', label: 'Tên danh mục', t: 'text' },
          { k: 'short', label: 'Tên viết tắt (hiện trên thẻ, VD: ĐẦM)', t: 'text' },
        ] },
      { k: 'collection', t: 'group', full: true, label: 'Tiêu đề khu bộ sưu tập', fields: [
        { k: 'eyebrow', label: 'Nhãn nhỏ', t: 'text' },
        { k: 'title', label: 'Tiêu đề lớn', t: 'text' },
        { k: 'intro', label: 'Câu giới thiệu', t: 'textarea', full: true },
      ] },
    ] },
    { id: 'lines', icon: '≡', title: 'Chọn theo dịp', desc: 'Danh sách dòng sản phẩm có hiệu ứng tô màu khi rê chuột', path: 'lines', fields: [
      { k: 'eyebrow', label: 'Nhãn nhỏ', t: 'text' },
      { k: 'title', label: 'Tiêu đề', t: 'text', help: RICH },
      { k: 'items', label: 'Các dòng', t: 'list', full: true, itemTitle: (l) => `${l.name} — ${l.price}`, newItem: () => ({ name: 'Dòng mới', qualifier: 'mô tả ngắn', price: 'từ 500K', category: '' }), item: [
        { k: 'name', label: 'Tên', t: 'text' },
        { k: 'qualifier', label: 'Chữ nghiêng phía sau', t: 'text' },
        { k: 'price', label: 'Giá hiển thị', t: 'text', help: 'Ví dụ: từ 590K' },
        { k: 'category', label: 'Bấm vào sẽ lọc danh mục', t: 'select', opts: () => [['', '— Không lọc —'], ...catOpts()] },
      ] },
    ] },
    { grp: 'Các phần khác' },
    { id: 'process', icon: '①', title: 'Mua sắm & chính sách', desc: 'Dải tối 4 bước + hộp lưu ý', path: 'process', fields: [
      { k: 'eyebrow', label: 'Nhãn nhỏ', t: 'text' },
      { k: 'title', label: 'Tiêu đề', t: 'textarea', help: RICH },
      { k: 'steps', label: 'Các bước', t: 'list', full: true, itemTitle: (s) => s.title, newItem: () => ({ title: 'Bước mới', text: '' }), item: [
        { k: 'title', label: 'Tên bước', t: 'text' }, { k: 'text', label: 'Mô tả', t: 'textarea', full: true },
      ] },
      { k: 'noticeTitle', label: 'Tiêu đề hộp lưu ý', t: 'text' },
      { k: 'noticeCta', label: 'Chữ nút Zalo', t: 'text' },
      { k: 'noticeText', label: 'Nội dung lưu ý (để trống để ẩn hộp)', t: 'textarea', full: true },
    ] },
    { id: 'lookbook', icon: '▦', title: 'Lookbook', desc: 'Dải ảnh trượt ngang khi cuộn + câu trích dẫn', path: 'lookbook', fields: [
      { k: 'eyebrow', label: 'Nhãn nhỏ', t: 'text' },
      { k: 'title', label: 'Tiêu đề', t: 'text', help: RICH },
      { k: 'items', label: 'Ảnh lookbook', t: 'list', full: true, thumb: (x) => x.image, itemTitle: (x) => x.caption || '(không chú thích)', newItem: () => ({ image: '', caption: '( Chú thích )' }), item: [
        { k: 'image', label: 'Ảnh', t: 'image' }, { k: 'caption', label: 'Chú thích', t: 'text' },
      ] },
      { k: 'quote', label: 'Câu trích dẫn — phần đậm', t: 'text', full: true },
      { k: 'quoteMuted', label: 'Câu trích dẫn — phần mờ', t: 'text', full: true },
    ] },
    { id: 'cta', icon: '➜', title: 'Kêu gọi hành động', desc: 'Khối chữ lớn trước phần liên hệ', path: 'cta', fields: [
      { k: 'eyebrow', label: 'Nhãn nhỏ', t: 'text' },
      { k: 'line1', label: 'Dòng chữ lớn', t: 'text' },
      { k: 'line2', label: 'Dòng chữ nghiêng', t: 'text' },
      { k: 'buttonText', label: 'Chữ trên nút', t: 'text' },
      { k: 'text', label: 'Câu mô tả', t: 'textarea', full: true },
      { k: 'buttonLink', label: 'Nút dẫn tới', t: 'select', opts: () => LINKS },
    ] },
    { id: 'contact', icon: '☎', title: 'Liên hệ & mạng xã hội', desc: 'Số điện thoại, email, địa chỉ, bản đồ, Zalo, Facebook…', path: 'contact', fields: [
      { k: 'phone', label: 'Hotline', t: 'text' },
      { k: 'zalo', label: 'Số Zalo', t: 'text', help: 'Tạo link zalo.me/<số>. Để trống để ẩn nút Zalo' },
      { k: 'email', label: 'Email', t: 'text' },
      { k: 'hours', label: 'Giờ mở cửa', t: 'text', help: 'Ví dụ: 9:00 – 21:30 hằng ngày (để trống để ẩn)' },
      { k: 'address', label: 'Địa chỉ', t: 'text', full: true },
      { k: 'mapQuery', label: 'Địa chỉ trên bản đồ Google', t: 'text', full: true, help: 'Ghi càng chi tiết càng chính xác (số nhà, tên toà nhà). Để trống để ẩn bản đồ' },
      { k: 'facebook', label: 'Link Facebook', t: 'text', help: 'https://facebook.com/…' },
      { k: 'instagram', label: 'Link Instagram', t: 'text' },
      { k: 'tiktok', label: 'Link TikTok', t: 'text' },
      { k: 'eyebrow', label: 'Nhãn nhỏ', t: 'text' },
      { k: 'headline', label: 'Tiêu đề', t: 'textarea', help: RICH },
      { k: 'formTitle', label: 'Tiêu đề form', t: 'text' },
      { k: 'formNote', label: 'Ghi chú dưới tiêu đề form', t: 'text', full: true },
    ] },
    { id: 'site', icon: '⚙', title: 'Thông tin chung & SEO', desc: 'Tên thương hiệu, logo, tiêu đề hiển thị trên Google', path: 'site', fields: [
      { k: 'name', label: 'Tên đầy đủ', t: 'text' },
      { k: 'shortName', label: 'Tên ngắn (logo chữ trên menu)', t: 'text' },
      { k: 'slogan', label: 'Slogan (tiếng Anh)', t: 'text' },
      { k: 'sloganVi', label: 'Slogan (tiếng Việt)', t: 'text' },
      { k: 'logo', label: 'Logo (vuông)', t: 'image' },
      { k: 'ogImage', label: 'Ảnh khi chia sẻ link (Facebook/Zalo)', t: 'image' },
      { k: 'seoTitle', label: 'Tiêu đề trang (Google)', t: 'text', full: true, help: 'Khoảng 50–60 ký tự' },
      { k: 'seoDescription', label: 'Mô tả trang (Google)', t: 'textarea', full: true, help: 'Khoảng 140–160 ký tự' },
      { k: 'footer', t: 'group', full: true, label: 'Chân trang', fields: [{ k: 'blurb', label: 'Đoạn giới thiệu ở chân trang', t: 'textarea', full: true }], root: true },
    ] },
    { grp: 'Hệ thống' },
    { id: 'media', icon: '▣', title: 'Thư viện ảnh', desc: 'Tải lên & quản lý ảnh dùng trên website', custom: renderMedia },
    { id: 'settings', icon: '⚿', title: 'Cài đặt', desc: 'Mật khẩu, sao lưu & khôi phục nội dung', custom: renderSettings },
  ];
  const LINKS = [['#collection', 'Bộ sưu tập'], ['#about', 'Giới thiệu'], ['#lines', 'Chọn theo dịp'], ['#process', 'Mua sắm & chính sách'], ['#lookbook', 'Lookbook'], ['#contact', 'Liên hệ']];

  /* ---------- field renderers ---------- */
  function renderFields(obj, fields) {
    const wrap = h('div', { class: 'fields' });
    fields.forEach((f) => wrap.append(field(obj, f)));
    return wrap;
  }
  function field(obj, f) {
    const box = h('div', { class: 'f' + (f.full || ['list', 'images', 'group'].includes(f.t) ? ' f--full' : '') });
    const lab = f.label ? h('span', {}, f.label) : null;
    const help = f.help ? h('p', { class: 'hint' }) : null;
    if (help) help.innerHTML = f.help.replace(/\*([^*]+)\*/g, '<code>*$1*</code>');
    const set = (v) => { obj[f.k] = v; setDirty(); };
    let ctrl;
    switch (f.t) {
      case 'text': ctrl = h('input', { type: 'text', value: obj[f.k] ?? '', oninput: (e) => set(e.target.value) }); break;
      case 'textarea': ctrl = h('textarea', { rows: 3, oninput: (e) => set(e.target.value) }); ctrl.value = obj[f.k] ?? ''; break;
      case 'select': {
        ctrl = h('select', { onchange: (e) => set(e.target.value) });
        const opts = typeof f.opts === 'function' ? f.opts() : f.opts;
        let found = false;
        opts.forEach(([v, l]) => { const o = h('option', { value: v }, l); if (v === (obj[f.k] ?? '')) { o.selected = true; found = true; } ctrl.append(o); });
        if (!found && obj[f.k]) ctrl.append(h('option', { value: obj[f.k], selected: true }, obj[f.k]));
        break;
      }
      case 'money': {
        const inp = h('input', { type: 'text', inputmode: 'numeric', value: obj[f.k] ? String(obj[f.k]).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '0' });
        inp.addEventListener('input', () => { const n = parseInt(inp.value.replace(/\D/g, ''), 10) || 0; set(n); });
        inp.addEventListener('blur', () => { inp.value = String(obj[f.k] || 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); });
        ctrl = h('div', { class: 'money' }, inp);
        break;
      }
      case 'toggle': {
        const cb = h('input', { type: 'checkbox' }); cb.checked = obj[f.k] !== false;
        const txt = h('span', {}, cb.checked ? 'Đang hiển thị' : 'Đang ẩn');
        cb.addEventListener('change', () => { set(cb.checked); txt.textContent = cb.checked ? 'Đang hiển thị' : 'Đang ẩn'; });
        ctrl = h('label', { class: 'toggle' }, cb, txt);
        break;
      }
      case 'strings': ctrl = chipsInput(obj, f); break;
      case 'image': ctrl = imageField(obj, f); break;
      case 'images': ctrl = imagesField(obj, f); break;
      case 'list': ctrl = listField(obj, f); break;
      case 'group': {
        const target = C; // nhóm luôn trỏ vào khoá cấp gốc của nội dung
        if (!target[f.k] || typeof target[f.k] !== 'object') target[f.k] = {};
        const card = h('div', { class: 'card', style: 'margin:8px 0 0;background:#fff' }, h('h2', {}, f.label), renderFields(target[f.k], f.fields));
        return card;
      }
    }
    if (lab) box.append(lab);
    box.append(ctrl);
    if (help) box.append(help);
    return box;
  }

  function chipsInput(obj, f) {
    if (!Array.isArray(obj[f.k])) obj[f.k] = [];
    const arr = obj[f.k];
    const box = h('div', { class: 'chipsin' });
    const inp = h('input', { type: 'text', placeholder: arr.length >= (f.max || 99) ? '' : 'Gõ rồi nhấn Enter…' });
    const draw = () => {
      $$('span', box).forEach((s) => s.remove());
      arr.forEach((v, i) => box.insertBefore(h('span', {}, v, h('button', { type: 'button', 'aria-label': 'Xoá ' + v, onclick: () => { arr.splice(i, 1); setDirty(); draw(); } }, '✕')), inp));
      inp.disabled = arr.length >= (f.max || 99);
    };
    const add = () => { const v = inp.value.trim(); if (v && arr.length < (f.max || 99)) { arr.push(v); inp.value = ''; setDirty(); draw(); } };
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
      if (e.key === 'Backspace' && !inp.value && arr.length) { arr.pop(); setDirty(); draw(); }
    });
    inp.addEventListener('blur', add);
    box.append(inp); draw();
    box.addEventListener('click', (e) => { if (e.target === box) inp.focus(); });
    return box;
  }

  function imageField(obj, f) {
    const box = h('div', { class: 'imgf' });
    const draw = () => {
      box.innerHTML = '';
      const t = h('div', { class: 'thumb' }); if (obj[f.k]) t.append(h('img', { src: obj[f.k], alt: '' }));
      box.append(t, h('div', { class: 'imgf__side' },
        h('button', { type: 'button', class: 'b b--line b--sm', onclick: () => pickMedia(false, (urls) => { obj[f.k] = urls[0]; setDirty(); draw(); refreshListHeads(); }) }, obj[f.k] ? 'Đổi ảnh' : 'Chọn ảnh'),
        obj[f.k] ? h('button', { type: 'button', class: 'b b--red b--sm', onclick: () => { obj[f.k] = ''; setDirty(); draw(); refreshListHeads(); } }, 'Bỏ ảnh') : null,
      ));
    };
    draw();
    return box;
  }
  function imagesField(obj, f) {
    if (!Array.isArray(obj[f.k])) obj[f.k] = [];
    const arr = obj[f.k];
    const box = h('div', { class: 'imgf' });
    const draw = () => {
      box.innerHTML = '';
      arr.forEach((u, i) => {
        box.append(h('div', { class: 'thumb' }, h('img', { src: u, alt: '' }), h('span', { class: 'thumb__n' }, i + 1),
          h('div', { class: 'thumb__tools' },
            h('button', { type: 'button', title: 'Đưa lên trước', 'aria-label': 'Đưa lên trước', onclick: () => { if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; setDirty(); draw(); refreshListHeads(); } } }, '←'),
            h('button', { type: 'button', title: 'Xoá', 'aria-label': 'Xoá ảnh', onclick: () => { arr.splice(i, 1); setDirty(); draw(); refreshListHeads(); } }, '✕'),
            h('button', { type: 'button', title: 'Đưa ra sau', 'aria-label': 'Đưa ra sau', onclick: () => { if (i < arr.length - 1) { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; setDirty(); draw(); refreshListHeads(); } } }, '→'))));
      });
      if (arr.length < (f.max || 12)) box.append(h('button', { type: 'button', class: 'thumb thumb--add', onclick: () => pickMedia(true, (urls) => { arr.push(...urls.slice(0, (f.max || 12) - arr.length)); setDirty(); draw(); refreshListHeads(); }) }, '+ Thêm ảnh'));
    };
    draw();
    return box;
  }

  let listHeadRefreshers = [];
  function refreshListHeads() { listHeadRefreshers.forEach((fn) => fn()); }

  function listField(obj, f) {
    if (!Array.isArray(obj[f.k])) obj[f.k] = [];
    const arr = obj[f.k];
    const box = h('div');
    const list = h('div', { class: 'list' });
    const open = new Set();
    let q = '', fc = '';
    if (f.filter) {
      const search = h('input', { class: 'inp', type: 'search', placeholder: 'Tìm theo tên…', oninput: (e) => { q = e.target.value.toLowerCase(); draw(); } });
      const sel = h('select', { class: 'inp', onchange: (e) => { fc = e.target.value; draw(); } }, h('option', { value: '' }, 'Tất cả danh mục'), ...catOpts().map(([v, l]) => h('option', { value: v }, l)));
      box.append(h('div', { class: 'list__bar' }, search, sel, h('span', { class: 'hint' }, `${arr.length} mục · bấm vào để sửa`)));
    }
    const draw = () => {
      list.innerHTML = '';
      listHeadRefreshers = listHeadRefreshers.filter((fn) => fn.alive && fn.alive());
      arr.forEach((it, i) => {
        if (q && !String(it.name || '').toLowerCase().includes(q)) return;
        if (fc && it.category !== fc) return;
        const li = h('div', { class: 'li' + (open.has(it) ? ' open' : '') + (it.visible === false ? ' is-hidden-item' : '') });
        const head = h('div', { class: 'li__head', role: 'button', tabindex: 0, 'aria-expanded': open.has(it) });
        const paintHead = () => {
          head.innerHTML = '';
          head.append(h('span', { class: 'li__chev' }, '›'), h('span', { class: 'li__n' }, String(i + 1).padStart(2, '0')));
          if (f.thumb) { const u = f.thumb(it); head.append(u ? h('img', { class: 'li__thumb', src: u, alt: '' }) : h('span', { class: 'li__thumb' })); }
          const tt = h('div', { class: 'li__t' }, h('b', {}, f.itemTitle ? f.itemTitle(it) : 'Mục ' + (i + 1)));
          if (f.itemSub) tt.append(h('span', {}, f.itemSub(it)));
          if (f.itemTags) f.itemTags(it).forEach(([t, c]) => tt.querySelector('b').append(h('i', { class: 'tag tag--' + c, style: 'font-style:normal' }, t)));
          head.append(tt, h('div', { class: 'li__tools' },
            h('button', { type: 'button', class: 'ib', title: 'Lên', 'aria-label': 'Di chuyển lên', onclick: (e) => { e.stopPropagation(); if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; setDirty(); draw(); } } }, '↑'),
            h('button', { type: 'button', class: 'ib', title: 'Xuống', 'aria-label': 'Di chuyển xuống', onclick: (e) => { e.stopPropagation(); if (i < arr.length - 1) { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; setDirty(); draw(); } } }, '↓'),
            (!f.max || arr.length < f.max) ? h('button', { type: 'button', class: 'ib', title: 'Nhân bản', 'aria-label': 'Nhân bản', onclick: (e) => { e.stopPropagation(); const c = JSON.parse(JSON.stringify(it)); if ('id' in c) c.id = uid(f.k === 'products' ? 'sp' : 'dm'); if (c.name) c.name += ' (bản sao)'; arr.splice(i + 1, 0, c); open.add(c); setDirty(); draw(); } }, '⧉') : null,
            h('button', { type: 'button', class: 'ib ib--red', title: 'Xoá', 'aria-label': 'Xoá', onclick: (e) => { e.stopPropagation(); if (f.onRemove ? !f.onRemove(it) : !confirm('Xoá mục này?')) return; arr.splice(i, 1); setDirty(); draw(); } }, '✕')));
        };
        paintHead();
        paintHead.alive = () => d.body.contains(head);
        listHeadRefreshers.push(paintHead);
        const body = h('div', { class: 'li__body' });
        const toggle = () => {
          if (open.has(it)) { open.delete(it); li.classList.remove('open'); head.setAttribute('aria-expanded', false); }
          else { open.add(it); li.classList.add('open'); head.setAttribute('aria-expanded', true); if (!body.firstChild) body.append(renderFields(it, f.item)); }
        };
        head.addEventListener('click', toggle);
        head.addEventListener('keydown', (e) => { if (e.target === head && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(); } });
        // cập nhật tiêu đề khi gõ
        body.addEventListener('input', () => paintHead());
        body.addEventListener('change', () => { paintHead(); li.classList.toggle('is-hidden-item', it.visible === false); });
        if (open.has(it)) body.append(renderFields(it, f.item));
        li.append(head, body);
        list.append(li);
      });
      if (!list.children.length) list.append(h('p', { class: 'empty' }, arr.length ? 'Không có mục phù hợp bộ lọc.' : 'Chưa có mục nào.'));
    };
    draw();
    box.append(list);
    if (!f.max || arr.length < f.max) box.append(h('button', { type: 'button', class: 'b b--line list__add', onclick: () => {
      if (f.max && arr.length >= f.max) return toast('Tối đa ' + f.max + ' mục', true);
      const n = f.newItem(); arr.push(n); open.add(n); q = ''; fc = ''; setDirty(); draw();
      setTimeout(() => { const last = list.lastElementChild; last && last.scrollIntoView({ behavior: 'smooth', block: 'center' }); const i = last && last.querySelector('input'); i && i.focus(); }, 50);
    } }, f.addLabel || '+ Thêm mục'));
    return box;
  }

  /* ---------- media picker ---------- */
  const mm = $('#media-modal');
  let mmMulti = false, mmCb = null, mmSel = [];
  async function loadMedia(force) { if (!mediaCache || force) mediaCache = await api('/api/media'); return mediaCache; }
  async function pickMedia(multi, cb) {
    mmMulti = multi; mmCb = cb; mmSel = [];
    $('#mm-t').textContent = multi ? 'Chọn một hoặc nhiều ảnh' : 'Chọn ảnh';
    $('#mm-ok').disabled = true;
    mm.hidden = false;
    await drawMM();
  }
  async function drawMM() {
    const g = $('#mm-grid'); g.innerHTML = '<p class="hint">Đang tải…</p>';
    const items = await loadMedia();
    g.innerHTML = '';
    items.forEach((m) => {
      const b = h('button', { type: 'button', class: 'gm', 'aria-pressed': mmSel.includes(m.url), title: m.url },
        h('img', { src: m.url, alt: '', loading: 'lazy' }), h('span', { class: 'gm__sz' }, Math.round(m.size / 1024) + 'KB'));
      b.addEventListener('click', () => {
        if (mmMulti) { const i = mmSel.indexOf(m.url); i >= 0 ? mmSel.splice(i, 1) : mmSel.push(m.url); }
        else mmSel = [m.url];
        $$('.gm', g).forEach((x) => x.setAttribute('aria-pressed', mmSel.includes(x.title)));
        $('#mm-ok').disabled = !mmSel.length;
        $('#mm-ok').textContent = mmSel.length > 1 ? `Chọn (${mmSel.length})` : 'Chọn';
      });
      b.addEventListener('dblclick', () => { if (!mmMulti) finishMM(); });
      g.append(b);
    });
  }
  function finishMM() { if (mmSel.length && mmCb) mmCb([...mmSel]); mm.hidden = true; }
  $('#mm-ok').addEventListener('click', finishMM);
  mm.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) mm.hidden = true; });
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mm.hidden) mm.hidden = true; });
  $('#mm-file').addEventListener('change', async (e) => { const ups = await uploadFiles([...e.target.files]); e.target.value = ''; ups.forEach((u) => { if (mmMulti) mmSel.push(u); else mmSel = [u]; }); await drawMM(); $('#mm-ok').disabled = !mmSel.length; });
  const grid = $('#mm-grid');
  grid.addEventListener('dragover', (e) => { e.preventDefault(); grid.classList.add('drag'); });
  grid.addEventListener('dragleave', () => grid.classList.remove('drag'));
  grid.addEventListener('drop', async (e) => { e.preventDefault(); grid.classList.remove('drag'); const ups = await uploadFiles([...e.dataTransfer.files]); ups.forEach((u) => { if (mmMulti) mmSel.push(u); else mmSel = [u]; }); await drawMM(); $('#mm-ok').disabled = !mmSel.length; });

  /* nén ảnh trên trình duyệt rồi tải lên */
  function compress(file) {
    return new Promise((resolve, reject) => {
      if (!/^image\//.test(file.type)) return reject(new Error(file.name + ' không phải ảnh'));
      const keep = file.type === 'image/gif' || (file.type === 'image/png' && file.size < 400e3);
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Không đọc được ' + file.name));
      reader.onload = () => {
        if (keep) return resolve(reader.result);
        const img = new Image();
        img.onload = () => {
          const max = 1600, s = Math.min(1, max / Math.max(img.width, img.height));
          const c = d.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          const x = c.getContext('2d');
          const png = file.type === 'image/png';
          if (!png) { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); }
          x.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.84));
        };
        img.onerror = () => reject(new Error('Ảnh lỗi: ' + file.name));
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
  async function uploadFiles(files) {
    const out = [];
    for (const [i, f] of files.entries()) {
      try {
        toast(`Đang tải ảnh ${i + 1}/${files.length}…`);
        const data = await compress(f);
        const r = await api('/api/upload', { method: 'POST', body: JSON.stringify({ filename: f.name, data }) });
        out.push(r.url);
      } catch (e) { toast(e.message, true); }
    }
    if (out.length) { toast(`Đã tải lên ${out.length} ảnh`); await loadMedia(true); }
    return out;
  }

  /* ---------- custom sections ---------- */
  function renderDashboard(el) {
    const prods = C.products || [];
    const newInq = inquiries.filter((x) => x.status === 'new');
    el.append(h('div', { class: 'kpis' },
      h('div', { class: 'kpi' }, h('span', { class: 'mono' }, 'Sản phẩm đang hiện'), h('b', {}, prods.filter((p) => p.visible !== false).length)),
      h('div', { class: 'kpi' }, h('span', { class: 'mono' }, 'Đang ẩn'), h('b', {}, prods.filter((p) => p.visible === false).length)),
      h('div', { class: 'kpi' }, h('span', { class: 'mono' }, 'Tin mới chưa xử lý'), h('b', { style: newInq.length ? 'color:var(--rouge)' : '' }, newInq.length)),
      h('div', { class: 'kpi' }, h('span', { class: 'mono' }, 'Tổng đơn & liên hệ'), h('b', {}, inquiries.length)),
    ));
    el.append(h('div', { class: 'card' }, h('h2', {}, 'Thao tác nhanh'), h('p', { class: 'hint', style: 'margin-bottom:14px' }, 'Sửa xong nhớ bấm "Lưu thay đổi" (hoặc Ctrl/⌘ + S). Website cập nhật ngay sau khi lưu.'),
      h('div', { class: 'quick' },
        h('button', { class: 'b b--dark', onclick: () => { go('products'); } }, '+ Thêm / sửa sản phẩm'),
        h('button', { class: 'b b--line', onclick: () => go('hero') }, 'Đổi ảnh banner'),
        h('button', { class: 'b b--line', onclick: () => go('contact') }, 'Sửa thông tin liên hệ'),
        h('button', { class: 'b b--line', onclick: () => go('inquiries') }, 'Xem đơn hàng'),
        h('a', { class: 'b b--line', href: '/', target: '_blank' }, '↗ Mở website'))));
    const recent = inquiries.slice(0, 5);
    const card = h('div', { class: 'card' }, h('h2', {}, 'Tin gần đây'));
    if (!recent.length) card.append(h('p', { class: 'hint' }, 'Chưa có đơn hàng hay tin nhắn nào.'));
    recent.forEach((x) => card.append(h('p', { style: 'margin:10px 0;display:flex;gap:10px;flex-wrap:wrap;align-items:center' },
      h('span', { class: 'tag' + (x.status === 'new' ? ' tag--red' : '') , style: 'margin:0' }, x.type === 'order' ? 'Đơn hàng' : 'Liên hệ'),
      h('b', {}, x.name), h('a', { href: 'tel:' + x.phone }, x.phone), h('span', { class: 'hint' }, fmtDate(x.createdAt)),
      x.total ? h('span', {}, money(x.total)) : null)));
    el.append(card);
  }

  let inqFilter = 'all';
  function renderInquiries(el) {
    const counts = { all: inquiries.length, new: 0, contacted: 0, done: 0 };
    inquiries.forEach((x) => counts[x.status]++);
    const tabs = h('div', { class: 'tabs' });
    [['all', 'Tất cả'], ['new', 'Mới'], ['contacted', 'Đã liên hệ'], ['done', 'Hoàn tất']].forEach(([k, l]) => tabs.append(h('button', { type: 'button', 'aria-pressed': inqFilter === k, onclick: () => { inqFilter = k; go('inquiries'); } }, `${l} (${counts[k]})`)));
    tabs.append(h('button', { type: 'button', onclick: exportCSV, style: 'margin-left:auto' }, '⤓ Xuất Excel (CSV)'), h('button', { type: 'button', onclick: async () => { await loadInq(); go('inquiries'); toast('Đã làm mới'); } }, '↻ Làm mới'));
    el.append(tabs);
    const list = inquiries.filter((x) => inqFilter === 'all' || x.status === inqFilter);
    if (!list.length) return el.append(h('div', { class: 'empty' }, 'Chưa có mục nào ở đây.'));
    list.forEach((x) => {
      const status = h('select', { class: 'inp', style: 'width:auto;height:36px;padding:4px 10px', onchange: async (e) => { try { await api('/api/inquiries/' + x.id, { method: 'PATCH', body: JSON.stringify({ status: e.target.value }) }); x.status = e.target.value; paintNav(); go('inquiries'); } catch (er) { toast(er.message, true); } } },
        ...[['new', '● Mới'], ['contacted', '◐ Đã liên hệ'], ['done', '✓ Hoàn tất']].map(([v, l]) => h('option', { value: v, selected: x.status === v }, l)));
      const phoneDigits = String(x.phone).replace(/\D/g, '');
      const card = h('article', { class: 'inq inq--' + x.status },
        h('div', { class: 'inq__h' }, h('div', {}, h('span', { class: 'tag' + (x.type === 'order' ? ' tag--red' : ''), style: 'margin:0 8px 0 0' }, x.type === 'order' ? 'Đơn hàng' : 'Liên hệ'), h('span', { class: 'inq__who' }, x.name)), status),
        h('div', { class: 'inq__meta' },
          h('span', {}, '☎ ', h('a', { href: 'tel:' + phoneDigits }, x.phone)),
          h('a', { href: 'https://zalo.me/' + phoneDigits, target: '_blank', rel: 'noopener' }, 'Nhắn Zalo ↗'),
          h('span', {}, '🕑 ' + fmtDate(x.createdAt)),
          x.address ? h('span', {}, '⌂ ' + x.address) : null,
          x.interest ? h('span', {}, '♡ ' + x.interest) : null),
        x.message ? h('p', { class: 'inq__msg' }, x.message) : null);
      if (x.items && x.items.length) {
        card.append(h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Sản phẩm'), h('th', {}, 'Size'), h('th', {}, 'SL'), h('th', {}, 'Thành tiền'))),
          h('tbody', {}, ...x.items.map((i) => h('tr', {}, h('td', {}, i.name), h('td', {}, i.size), h('td', {}, i.qty), h('td', {}, money(i.price * i.qty)))),
            h('tr', {}, h('td', { colspan: 3 }, h('b', {}, 'Tổng tạm tính')), h('td', {}, h('b', {}, money(x.total)))))));
      }
      const note = h('input', { class: 'inp', type: 'text', placeholder: 'Ghi chú nội bộ (VD: đã chốt, giao chiều mai)…', value: x.note || '' });
      card.append(h('div', { class: 'inq__foot' }, note,
        h('button', { type: 'button', class: 'b b--line b--sm', onclick: async () => { try { await api('/api/inquiries/' + x.id, { method: 'PATCH', body: JSON.stringify({ note: note.value }) }); x.note = note.value; toast('Đã lưu ghi chú'); } catch (e) { toast(e.message, true); } } }, 'Lưu ghi chú'),
        h('button', { type: 'button', class: 'b b--red b--sm', onclick: async () => { if (!confirm('Xoá vĩnh viễn mục này?')) return; await api('/api/inquiries/' + x.id, { method: 'DELETE' }); inquiries = inquiries.filter((y) => y !== x); paintNav(); go('inquiries'); } }, 'Xoá')));
      el.append(card);
    });
  }
  function exportCSV() {
    const rows = [['Thời gian', 'Loại', 'Trạng thái', 'Họ tên', 'Điện thoại', 'Địa chỉ', 'Quan tâm', 'Lời nhắn', 'Sản phẩm', 'Tổng', 'Ghi chú']];
    inquiries.forEach((x) => rows.push([fmtDate(x.createdAt), x.type === 'order' ? 'Đơn hàng' : 'Liên hệ', { new: 'Mới', contacted: 'Đã liên hệ', done: 'Hoàn tất' }[x.status], x.name, x.phone, x.address, x.interest, x.message, (x.items || []).map((i) => `${i.name} (${i.size}) x${i.qty}`).join('; '), x.total || '', x.note || '']));
    const csv = '﻿' + rows.map((r) => r.map((v) => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const a = h('a', { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), download: `eser-don-hang-${new Date().toISOString().slice(0, 10)}.csv` });
    d.body.append(a); a.click(); a.remove();
  }

  async function renderMedia(el) {
    const used = new Set(JSON.stringify(C).match(/\/(?:uploads|images)\/[\w.-]+/g) || []);
    el.append(h('div', { class: 'card' }, h('h2', {}, 'Tải ảnh mới'), h('p', { class: 'hint', style: 'margin-bottom:12px' }, 'Ảnh sẽ được nén còn tối đa 1600px để website tải nhanh. Nên dùng ảnh dọc tỉ lệ 2:3 hoặc 3:4 cho sản phẩm.'),
      h('label', { class: 'b b--dark' }, h('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true, onchange: async (e) => { await uploadFiles([...e.target.files]); go('media'); } }), '⤒ Chọn ảnh từ máy')));
    const items = await loadMedia(true);
    const lib = h('div', { class: 'media-lib' });
    items.forEach((m) => {
      const name = m.url.split('/').pop();
      lib.append(h('div', { class: 'ml' }, h('img', { src: m.url, alt: '', loading: 'lazy' }), h('div', {}, h('span', { title: m.url }, (used.has(m.url) ? '● ' : '○ ') + name),
        m.deletable ? h('button', { class: 'ib ib--red', title: 'Xoá ảnh', 'aria-label': 'Xoá ảnh', onclick: async () => {
          if (used.has(m.url) && !confirm('Ảnh này đang được dùng trên website. Vẫn xoá?')) return;
          if (!used.has(m.url) && !confirm('Xoá ảnh này?')) return;
          await api('/api/media?file=' + encodeURIComponent(m.url), { method: 'DELETE' }); toast('Đã xoá'); go('media');
        } }, '✕') : null)));
    });
    el.append(h('div', { class: 'card' }, h('h2', {}, `Tất cả ảnh (${items.length})`), h('p', { class: 'hint', style: 'margin-bottom:14px' }, '● đang được dùng trên website · ○ chưa dùng. Ảnh gốc trong thư mục /images không xoá được từ đây.'), lib));
  }

  function renderSettings(el) {
    const cur = h('input', { type: 'password', autocomplete: 'current-password' }), nx = h('input', { type: 'password', autocomplete: 'new-password' }), nx2 = h('input', { type: 'password', autocomplete: 'new-password' });
    el.append(h('div', { class: 'card' }, h('h2', {}, 'Đổi mật khẩu'),
      h('div', { class: 'fields', style: 'margin-top:12px' }, h('label', { class: 'f' }, h('span', {}, 'Mật khẩu hiện tại'), cur), h('span'), h('label', { class: 'f' }, h('span', {}, 'Mật khẩu mới (tối thiểu 6 ký tự)'), nx), h('label', { class: 'f' }, h('span', {}, 'Nhập lại mật khẩu mới'), nx2)),
      h('button', { class: 'b b--dark', style: 'margin-top:16px', onclick: async () => {
        if (nx.value !== nx2.value) return toast('Hai mật khẩu mới không khớp', true);
        try { await api('/api/password', { method: 'POST', body: JSON.stringify({ current: cur.value, next: nx.value }) }); toast('Đã đổi mật khẩu'); cur.value = nx.value = nx2.value = ''; } catch (e) { toast(e.message, true); }
      } }, 'Đổi mật khẩu')));
    const file = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { const j = JSON.parse(await f.text()); if (!j.site) throw new Error('File không đúng định dạng'); if (!confirm('Thay toàn bộ nội dung hiện tại bằng bản sao lưu này?')) return; C = j; setDirty(); go(current); toast('Đã nạp bản sao lưu — bấm Lưu để áp dụng'); }
      catch (er) { toast(er.message, true); }
    } });
    el.append(h('div', { class: 'card' }, h('h2', {}, 'Sao lưu & khôi phục'),
      h('p', { class: 'hint', style: 'margin:6px 0 14px' }, 'Máy chủ tự giữ 30 bản sao lưu gần nhất mỗi lần bạn lưu (thư mục data/backups). Bạn cũng có thể tải một bản về máy.'),
      h('div', { class: 'quick' },
        h('button', { class: 'b b--line', onclick: () => { const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(C, null, 2)], { type: 'application/json' })), download: `eser-noi-dung-${new Date().toISOString().slice(0, 10)}.json` }); d.body.append(a); a.click(); a.remove(); } }, '⤓ Tải bản sao lưu'),
        h('label', { class: 'b b--line' }, file, '⤒ Khôi phục từ file'),
        h('button', { class: 'b b--red', onclick: async () => { if (!confirm('Đưa toàn bộ nội dung về mẫu ban đầu? (Chỉ áp dụng khi bạn bấm Lưu)')) return; C = await api('/api/content/default'); setDirty(); go(current); toast('Đã nạp nội dung mẫu — bấm Lưu để áp dụng'); } }, 'Về nội dung mẫu'))));
  }

  /* ---------- navigation ---------- */
  function paintNav() {
    const nav = $('#side-nav'); nav.innerHTML = '';
    const nNew = inquiries.filter((x) => x.status === 'new').length;
    SECTIONS.forEach((s) => {
      if (s.grp) return nav.append(h('div', { class: 'side__grp' }, s.grp));
      nav.append(h('button', { type: 'button', 'aria-current': current === s.id ? 'page' : null, onclick: () => go(s.id) }, h('i', {}, s.icon), s.title, s.id === 'inquiries' && nNew ? h('span', { class: 'badge' }, nNew) : null));
    });
  }
  async function go(id) {
    current = id;
    const s = SECTIONS.find((x) => x.id === id) || SECTIONS[1];
    $('#sec-title').textContent = s.title; $('#sec-desc').textContent = s.desc || '';
    paintNav();
    $('#side').classList.remove('open');
    const el = $('#content'); el.innerHTML = '';
    listHeadRefreshers = [];
    if (s.custom) { await s.custom(el); }
    else {
      const obj = s.path ? (C[s.path] = C[s.path] || {}) : C;
      el.append(h('div', { class: 'card' }, renderFields(obj, s.fields)));
    }
    try { history.replaceState(null, '', '#' + id); } catch {}
    if (!el.dataset.keepScroll) scrollTo(0, 0);
  }
  $('#menu-btn').addEventListener('click', () => $('#side').classList.toggle('open'));
  d.addEventListener('click', (e) => { const side = $('#side'); if (side.classList.contains('open') && !e.target.closest('#side') && !e.target.closest('#menu-btn')) side.classList.remove('open'); });

  /* ---------- auth flow ---------- */
  function showLogin() { $('#app').hidden = true; $('#login').hidden = false; setTimeout(() => $('#login input').focus(), 30); }
  async function loadInq() { inquiries = await api('/api/inquiries'); }
  async function boot() {
    try {
      C = await api('/api/content');
      await loadInq();
      $('#login').hidden = true; $('#app').hidden = false;
      setDirty(false);
      const want = location.hash.slice(1);
      go(SECTIONS.some((s) => s.id === want) ? want : 'dashboard');
      setInterval(async () => { try { const before = inquiries.filter((x) => x.status === 'new').length; await loadInq(); const after = inquiries.filter((x) => x.status === 'new').length; if (after > before) { toast(`Có ${after - before} tin mới từ website`); paintNav(); if (current === 'dashboard') go('dashboard'); } } catch {} }, 60000);
    } catch { showLogin(); }
  }
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('.login__err'); err.textContent = '';
    try { await api('/api/login', { method: 'POST', body: JSON.stringify({ password: e.target.password.value }) }); e.target.reset(); boot(); }
    catch (er) { err.textContent = er.message; }
  });
  $('#logout').addEventListener('click', async () => { if (dirty && !confirm('Bạn có thay đổi chưa lưu. Vẫn đăng xuất?')) return; await api('/api/logout', { method: 'POST' }).catch(() => {}); setDirty(false); showLogin(); });

  (async () => { const me = await fetch('/api/me').then((r) => r.json()).catch(() => ({})); me.authed ? boot() : showLogin(); })();
})();
