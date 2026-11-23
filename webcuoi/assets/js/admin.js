/* Quản trị nội dung Mì Studio. Có Worker: đăng nhập + lưu + ảnh qua /api (worker.js).
   Chạy bằng server tĩnh (phát triển): không có máy chủ để kiểm tra mật khẩu, dữ liệu lưu trong trình duyệt. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { esc, fromEl } = window.MiStore;
  const TITLES = { albums: 'Album ảnh', texts: 'Chữ trên trang', images: 'Hình ảnh', films: 'Phim cưới', prices: 'Bảng giá', reviews: 'Cảm nhận', contact: 'Liên hệ', backup: 'Sao lưu' };
  const GROUPS = { nav: 'Thanh menu', hero: 'Ảnh bìa đầu trang', story: 'Câu chuyện', values: 'Tiêu chí', day: 'Một ngày cưới', stats: 'Con số', albums: 'Album', book: 'Layout & photobook', films: 'Phim cưới', process: 'Quy trình', price: 'Bảng giá', reviews: 'Cảm nhận', contact: 'Liên hệ', footer: 'Chân trang' };
  const TAGS = { H1: 'Tiêu đề chính', H2: 'Tiêu đề', H3: 'Tiêu đề nhỏ', P: 'Đoạn chữ', UL: 'Danh sách (mỗi dòng một mục)', A: 'Chữ trên nút', SPAN: 'Chữ', B: 'Con số' };

  let C, DEF_TEXTS = [], DEF_IMGS = [], DEF_SEO = {}, view = { tab: 'albums', edit: null }, q = '', pickTarget = null;

  /* ---------- đăng nhập ---------- */
  const Store = window.MiStore;
  let token = null, pendingSave = false;
  try { token = sessionStorage.getItem('mi-token'); } catch (_) { /* bỏ qua */ }
  const ready = Store.load().then((c) => { C = c; }, () => { C = null; });

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target, err = $('.login__err'), btn = f.querySelector('button');
    err.textContent = ''; btn.disabled = true;
    try {
      await ready;
      if (Store.mode() === 'api') {
        token = await Store.login(f.user.value.trim(), f.pass.value);
        try { sessionStorage.setItem('mi-token', token); } catch (_) { /* chỉ giữ trong phiên */ }
      }
      f.pass.value = '';
      if ($('#app').hidden) start();
      else { $('#login').hidden = true; if (pendingSave) dirty(); }
    } catch (ex) {
      err.textContent = ex.status === 401 ? 'Sai tài khoản hoặc mật khẩu.' : 'Không kết nối được máy chủ, thử lại sau.';
      f.pass.select();
    } finally { btn.disabled = false; }
  });
  $('#logout').addEventListener('click', () => { try { sessionStorage.removeItem('mi-token'); } catch (_) { /* bỏ qua */ } location.reload(); });
  function needLogin(msg) { // phiên hết hạn: hiện lại form, giữ nguyên dữ liệu đang sửa
    $('.login__err').textContent = msg; $('#login').hidden = false; $('#loginForm [name=user]').focus();
  }

  async function start() {
    await ready;
    if (!C) { needLogin('Không tải được nội dung từ máy chủ.'); return; }
    $('#login').hidden = true; $('#app').hidden = false;
    $('.demo-note').innerHTML = Store.mode() === 'api'
      ? 'Thay đổi được lưu lên máy chủ tự động và hiện cho mọi người khi tải lại trang. Nên <b>xuất file sao lưu</b> trước khi sửa nhiều.'
      : 'Đang chạy cục bộ không có máy chủ: thay đổi chỉ lưu trong trình duyệt này.';
    try { await readIndex(); } catch (_) { status('Không đọc được index.html: hãy mở admin qua máy chủ (không mở file trực tiếp).', 'is-err'); }
    render();
  }

  /* đọc chữ/ảnh mặc định ngay từ index.html: thêm data-edit vào trang là admin tự có ô chỉnh */
  async function readIndex() {
    const doc = new DOMParser().parseFromString(await (await fetch('index.html', { cache: 'no-store' })).text(), 'text/html');
    const seen = new Set();
    DEF_TEXTS = $$('[data-edit],[data-edit-list]', doc).map((el) => {
      const list = !!el.dataset.editList, key = el.dataset.edit || el.dataset.editList;
      return { key, list, tag: el.tagName, def: list ? [...el.children].map((li) => fromEl(li).trim()).join('\n') : fromEl(el).trim() };
    }).filter((t) => !seen.has(t.key) && seen.add(t.key));
    DEF_IMGS = $$('[data-edit-img]', doc).map((el) => ({ key: el.dataset.editImg, def: el.getAttribute('src'), alt: el.getAttribute('alt') }));
    DEF_SEO = { title: doc.title, desc: (doc.querySelector('meta[name=description]') || {}).content || '' };
  }

  /* ---------- lưu tự động ---------- */
  let timer;
  function status(t, cls = '') { const s = $('#status'); s.textContent = t; s.className = 'top__status ' + cls; }
  function dirty() {
    status('Đang lưu…', 'is-dirty'); clearTimeout(timer);
    timer = setTimeout(async () => {
      try { await Store.save(C, token); pendingSave = false; status('Đã lưu lúc ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })); }
      catch (ex) {
        if (ex.status === 401) { pendingSave = true; status('Chưa lưu: cần đăng nhập lại', 'is-err'); needLogin('Phiên đăng nhập đã hết hạn, đăng nhập lại để lưu tiếp.'); }
        else status('Không lưu được: ' + (ex.message || 'lỗi không rõ'), 'is-err');
      }
    }, 400);
  }
  const get = (p) => p.split('|').reduce((o, k) => (o == null ? o : o[k]), C);
  const set = (p, v) => { const ks = p.split('|'), last = ks.pop(); ks.reduce((o, k) => o[k], C)[last] = v; };
  const driveId = (v) => { const m = v.match(/\/d\/([\w-]{15,})/) || v.match(/[?&]id=([\w-]{15,})/); return m ? m[1] : v.trim(); };

  /* ---------- ảnh tải lên: nén về 1600px + bản nhỏ 640px, rồi đưa lên máy chủ ---------- */
  const toBlob = (c, q) => new Promise((res) => c.toBlob((b) => (b && b.type === 'image/webp' ? res(b) : c.toBlob(res, 'image/jpeg', q)), 'image/webp', q));
  const toUrl = (b) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });
  async function compress(file) {
    if (!file.type.startsWith('image/')) throw new Error('not image');
    const bmp = await createImageBitmap(file);
    const draw = (max, q) => {
      const k = Math.min(1, max / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas');
      c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return toBlob(c, q).then((b) => ({ b, w: c.width, h: c.height }));
    };
    const big = await draw(1600, .82), sm = await draw(640, .75);
    const put = (b) => (Store.mode() === 'api' ? Store.upload(b, token) : toUrl(b));
    return { src: await put(big.b), sm: await put(sm.b), w: big.w, h: big.h };
  }

  /* ---------- các màn hình ---------- */
  const sw = (path, on, label = 'Hiện trên trang') => `<label class="switch"><input type="checkbox" data-bind="${path}" ${on ? 'checked' : ''}>${label}</label>`;
  const mv = (path) => `<button class="abtn abtn--icon abtn--sm" data-act="move" data-path="${path}" data-dir="-1" aria-label="Lên trên">↑</button><button class="abtn abtn--icon abtn--sm" data-act="move" data-path="${path}" data-dir="1" aria-label="Xuống dưới">↓</button>`;
  const del = (path) => `<button class="abtn abtn--sm abtn--danger" data-act="del" data-path="${path}">Xoá</button>`;
  const fld = (label, path, val, attrs = '') => `<label class="field">${label}<input data-bind="${path}" value="${esc(val ?? '')}" ${attrs}></label>`;
  const cover = (a) => { const p = a.photos[a.cover] || a.photos[0]; return p ? (p.sm || p.src) : ''; };

  const VIEWS = {
    albums() {
      if (view.edit != null && C.albums[view.edit]) return albumEdit(view.edit);
      const on = C.albums.filter((a) => a.visible).length;
      return `<section class="card"><div class="card__head"><h2>${on}/${C.albums.length} album đang hiện trên trang</h2><button class="abtn abtn--pri" data-act="addAlbum">+ Thêm album</button></div>
        <p class="hint" style="margin:-.4rem 0 1rem">Tắt công tắc để ẩn album khỏi trang (không mất dữ liệu). Thứ tự ở đây là thứ tự hiển thị.</p>
        <div class="alist">${C.albums.map((a, i) => `
          <div class="arow${a.visible ? '' : ' is-off'}">
            ${cover(a) ? `<img src="${esc(cover(a))}" alt="">` : '<img alt="">'}
            <div class="arow__t"><b>${esc(a.title || '(chưa đặt tên)')}</b><span>${esc(a.type || '')}${a.date ? ' · ' + esc(a.date) : ''} · ${a.photos.length} ảnh${a.photos.length ? '' : ' (chưa có ảnh nên chưa hiện)'}</span></div>
            <div class="arow__act">${sw(`albums|${i}|visible`, a.visible)}${mv(`albums|${i}`)}<button class="abtn abtn--sm" data-act="editAlbum" data-i="${i}">Sửa</button>${del(`albums|${i}`)}</div>
          </div>`).join('')}</div></section>`;
    },
    texts() {
      return `<section class="card"><div class="toolbar"><input class="search" type="search" placeholder="Tìm chữ cần sửa…" data-q value="${esc(q)}" aria-label="Tìm chữ"></div>
        <p class="hint">Viết <code>*chữ nghiêng*</code>, <code>**chữ đậm**</code>; xuống dòng để ngắt dòng. Ô có viền xanh là đã sửa so với bản gốc.</p></section>
        <section class="card"><div class="card__head"><h2>SEO (Google, chia sẻ link)</h2></div><div class="grid2">
          <label class="field">Tiêu đề trang<input data-bind="seo|title" value="${esc(C.seo.title || '')}" placeholder="${esc(DEF_SEO.title || '')}"></label>
          <label class="field">Mô tả<input data-bind="seo|desc" value="${esc(C.seo.desc || '')}" placeholder="${esc(DEF_SEO.desc || '')}"></label></div>
          <p class="hint">Để trống là dùng nội dung gốc.</p></section>
        <div id="textList" class="group">${textList()}</div>`;
    },
    images() {
      const imgs = DEF_IMGS.map((d) => {
        const cur = C.imgs[d.key], g = GROUPS[d.key.split('.')[0]] || d.key;
        return `<div class="iitem"><img src="${esc(cur || d.def)}" alt=""><div class="iitem__b"><b>${esc(g)}</b><code>${esc(d.key)}</code>
          <div class="iitem__act"><label class="abtn abtn--sm">Tải ảnh<input type="file" accept="image/*" data-upload="imgs|${d.key}" hidden></label>
          <button class="abtn abtn--sm" data-act="pick" data-path="imgs|${d.key}">Chọn từ album</button>
          ${cur ? `<button class="abtn abtn--sm" data-act="resetImg" data-key="${esc(d.key)}">Khôi phục</button>` : ''}</div></div></div>`;
      }).join('');
      const lays = C.layouts.map((l, i) => `<div class="iitem${l.visible ? '' : ' is-off'}"><img src="${esc(l.src)}" alt="" style="object-fit:contain"><div class="iitem__b">
        ${sw(`layouts|${i}|visible`, l.visible)}<div class="iitem__act">${mv(`layouts|${i}`)}${del(`layouts|${i}`)}</div></div></div>`).join('');
      return `<section class="card"><div class="card__head"><h2>Ảnh cố định trên trang</h2></div><div class="igrid">${imgs}</div></section>
        <section class="card"><div class="card__head"><h2>Trang layout / photobook (${C.layouts.filter((l) => l.visible).length} đang hiện)</h2></div>
        <div class="igrid">${lays}<label class="upload">+ Thêm trang layout<br><small>chọn được nhiều ảnh</small><input type="file" accept="image/*" multiple data-upload-add="layouts"></label></div></section>`;
    },
    films() {
      return `<section class="card"><div class="card__head"><h2>Phim cưới</h2><button class="abtn abtn--pri" data-act="addFilm">+ Thêm phim</button></div>
        <p class="hint" style="margin:-.4rem 0 1rem">Dán link Google Drive của video (để chế độ "Bất kỳ ai có đường liên kết"). Phim đầu tiên đang bật là ô lớn. Bấm ảnh để đổi ảnh bìa.</p>
        <div class="rows">${C.films.map((f, i) => `<div class="erow erow--film${f.visible ? '' : ' is-off'}">
          <img src="${esc(f.poster || '')}" alt="Đổi ảnh bìa" data-act="pick" data-path="films|${i}|poster" title="Bấm để đổi ảnh bìa">
          ${fld('Tiêu đề', `films|${i}|title`, f.title)}${fld('Dòng nhỏ', `films|${i}|sub`, f.sub)}${fld('Link / ID Google Drive', `films|${i}|drive`, f.drive)}
          <div class="erow__act">${sw(`films|${i}|visible`, f.visible, 'Hiện')}${mv(`films|${i}`)}${del(`films|${i}`)}</div></div>`).join('')}</div></section>`;
    },
    prices() {
      return `<section class="card"><div class="card__head"><h2>In ảnh &amp; album</h2><button class="abtn abtn--pri" data-act="add" data-path="print">+ Thêm dòng</button></div>
        <div class="rows">${C.print.map((p, i) => `<div class="erow erow--print">${fld('Sản phẩm', `print|${i}|name`, p.name)}${fld('Giá', `print|${i}|price`, p.price)}<div class="erow__act">${mv(`print|${i}`)}${del(`print|${i}`)}</div></div>`).join('')}</div></section>
        <section class="card"><div class="card__head"><h2>Ảnh treo tường</h2><button class="abtn abtn--pri" data-act="add" data-path="wall">+ Thêm dòng</button></div>
        <div class="rows">${C.wall.map((w, i) => `<div class="erow erow--wall">${fld('Kích thước', `wall|${i}|size`, w.size)}${fld('Tráng gương viền Titan', `wall|${i}|glass`, w.glass)}${fld('Ép gỗ không viền', `wall|${i}|wood`, w.wood)}<div class="erow__act">${mv(`wall|${i}`)}${del(`wall|${i}`)}</div></div>`).join('')}</div></section>
        <p class="hint">Tên, giá và các dòng của "Gói quay chụp phóng sự" sửa ở mục <b>Chữ trên trang</b> → Bảng giá.</p>`;
    },
    reviews() {
      return `<section class="card"><div class="card__head"><h2>Cảm nhận khách hàng</h2><button class="abtn abtn--pri" data-act="add" data-path="reviews">+ Thêm cảm nhận</button></div>
        <div class="rows">${C.reviews.map((r, i) => `<div class="erow erow--rev${r.visible ? '' : ' is-off'}">
          <label class="field">Nội dung<textarea data-bind="reviews|${i}|text" rows="3">${esc(r.text)}</textarea></label>${fld('Tên · album', `reviews|${i}|name`, r.name)}
          <div class="erow__act">${sw(`reviews|${i}|visible`, r.visible, 'Hiện')}${mv(`reviews|${i}`)}${del(`reviews|${i}`)}</div></div>`).join('')}</div>
        <p class="hint">Tắt hết cảm nhận thì mục này tự ẩn khỏi trang.</p></section>`;
    },
    contact() {
      const c = C.contact;
      return `<section class="card"><div class="card__head"><h2>Thông tin liên hệ</h2></div><div class="grid2">
        ${fld('Số điện thoại (hiển thị & nút gọi)', 'contact|phone', c.phone, 'inputmode="tel"')}${fld('Link Zalo', 'contact|zalo', c.zalo)}
        ${fld('Link Facebook', 'contact|fb', c.fb)}${fld('Tên hiển thị Facebook', 'contact|fbName', c.fbName)}
        ${fld('Link Messenger', 'contact|msg', c.msg)}${fld('Link Instagram', 'contact|ig', c.ig)}
        ${fld('Tên hiển thị Instagram', 'contact|igName', c.igName)}${fld('Link YouTube', 'contact|yt', c.yt)}
        ${fld('Khu vực / địa chỉ', 'contact|area', c.area)}</div>
        <p class="hint">Áp cho mọi chỗ trên trang: menu, phần liên hệ, chân trang, nút nổi, form Zalo.</p></section>`;
    },
    backup() {
      const kb = Math.round(JSON.stringify(C).length / 1024);
      return `<section class="card"><div class="card__head"><h2>Sao lưu &amp; chuyển máy</h2></div>
        <div class="toolbar"><button class="abtn abtn--pri" data-act="export">Xuất file nội dung (.json)</button>
        <label class="abtn">Nhập file nội dung<input type="file" accept="application/json,.json" data-import hidden></label></div>
        <p class="hint">Dung lượng nội dung hiện tại: khoảng ${kb.toLocaleString('vi-VN')} KB (ảnh tải lên chiếm phần lớn).</p></section>
        <section class="card"><div class="card__head"><h2>Đặt lại về nội dung gốc</h2></div>
        <p class="hint" style="margin:0 0 .8rem">Xoá mọi thay đổi trong trình duyệt này, quay về nội dung ban đầu của website. Nên xuất file trước.</p>
        <button class="abtn abtn--danger" data-act="resetAll">Đặt lại toàn bộ</button></section>`;
    },
  };

  function albumEdit(i) {
    const a = C.albums[i];
    return `<div class="toolbar"><button class="abtn" data-act="back">← Danh sách album</button></div>
      <section class="card"><div class="card__head"><h2>Thông tin album</h2>${sw(`albums|${i}|visible`, a.visible)}</div>
        <div class="grid4">${fld('Tên cặp đôi / album', `albums|${i}|title`, a.title)}${fld('Loại lễ', `albums|${i}|type`, a.type)}
        ${fld('Ngày (vd 27.09.2025)', `albums|${i}|date`, a.date)}${fld('Số ảnh đã bàn giao', `albums|${i}|total`, a.total, 'type="number" min="0"')}</div></section>
      <section class="card"><div class="card__head"><h2>Ảnh trong album (${a.photos.length})</h2></div>
        <p class="hint" style="margin:-.4rem 0 1rem">Ảnh có viền xanh là ảnh bìa. Ảnh tải lên được nén về 1600px.</p>
        <div class="pgrid">${a.photos.map((p, j) => `<div class="pitem${j === a.cover ? ' is-cover' : ''}"><img src="${esc(p.sm || p.src)}" alt="Ảnh ${j + 1}" loading="lazy">
          ${j === a.cover ? '<span class="pitem__badge">Ảnh bìa</span>' : ''}
          <div class="pitem__act"><button class="abtn abtn--sm" data-act="cover" data-i="${i}" data-j="${j}">Bìa</button>
          <button class="abtn abtn--sm" data-act="move" data-path="albums|${i}|photos|${j}" data-dir="-1" aria-label="Sang trái">←</button>
          <button class="abtn abtn--sm" data-act="move" data-path="albums|${i}|photos|${j}" data-dir="1" aria-label="Sang phải">→</button>
          ${del(`albums|${i}|photos|${j}`)}</div></div>`).join('')}
          <label class="upload">+ Tải ảnh lên<br><small>chọn được nhiều ảnh</small><input type="file" accept="image/*" multiple data-upload-add="albums|${i}|photos"></label></div></section>`;
  }

  function textList() {
    const k = q.trim().toLowerCase();
    const items = DEF_TEXTS.filter((t) => !k || (t.key + ' ' + t.def + ' ' + (C.texts[t.key] || '')).toLowerCase().includes(k));
    const byG = {};
    items.forEach((t) => (byG[t.key.split('.')[0]] ||= []).push(t));
    if (!items.length) return '<section class="card"><p class="hint">Không tìm thấy.</p></section>';
    return Object.entries(byG).map(([g, list]) => `<section class="card"><div class="card__head"><h2>${esc(GROUPS[g] || g)}</h2></div><div class="group">
      ${list.map((t) => {
        const ch = C.texts[t.key] != null, v = ch ? C.texts[t.key] : t.def;
        return `<div class="tfield${ch ? ' is-changed' : ''}"><div class="tfield__lab">${TAGS[t.tag] || 'Chữ'} <code>${esc(t.key)}</code>
          ${ch ? `<button class="abtn abtn--sm" data-act="resetText" data-key="${esc(t.key)}">Khôi phục</button>` : ''}</div>
          <textarea data-text="${esc(t.key)}" rows="${Math.min(6, Math.max(1, Math.ceil(v.length / 90) + (v.match(/\n/g) || []).length))}">${esc(v)}</textarea></div>`;
      }).join('')}</div></section>`).join('');
  }

  function render() {
    $$('.side__nav button').forEach((b) => (b.dataset.tab === view.tab ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
    $('#tabTitle').textContent = TITLES[view.tab];
    $('#panel').innerHTML = VIEWS[view.tab]();
  }

  /* ---------- sự kiện ---------- */
  $('.side__nav').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    view = { tab: b.dataset.tab, edit: null }; q = ''; render(); scrollTo(0, 0);
  });

  const NEW = {
    print: () => ({ name: 'Sản phẩm mới', price: '' }),
    wall: () => ({ size: '', glass: '', wood: '' }),
    reviews: () => ({ text: '', name: '', visible: true }),
  };

  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act, path = b.dataset.path;
    if (act === 'move') {
      const ks = path.split('|'), j = +ks.pop(), arr = get(ks.join('|')), k = j + +b.dataset.dir;
      if (k < 0 || k >= arr.length) return;
      [arr[j], arr[k]] = [arr[k], arr[j]];
      if (ks[0] === 'albums' && ks[2] === 'photos') { const a = C.albums[+ks[1]]; if (a.cover === j) a.cover = k; else if (a.cover === k) a.cover = j; }
      if (ks.length === 1 && ks[0] === 'albums' && view.edit != null) view.edit = null;
    } else if (act === 'del') {
      if (!b.classList.contains('is-armed')) { // bấm 2 lần mới xoá
        b.classList.add('is-armed'); b.textContent = 'Bấm lần nữa để xoá';
        setTimeout(() => { if (b.isConnected) { b.classList.remove('is-armed'); b.textContent = 'Xoá'; } }, 3000);
        return;
      }
      const ks = path.split('|'), j = +ks.pop(), arr = get(ks.join('|'));
      arr.splice(j, 1);
      if (ks[0] === 'albums' && ks[2] === 'photos') { const a = C.albums[+ks[1]]; if (a.cover === j) a.cover = 0; else if (a.cover > j) a.cover--; }
      if (ks.length === 1 && ks[0] === 'albums') view.edit = null;
    } else if (act === 'editAlbum') { view.edit = +b.dataset.i; render(); scrollTo(0, 0); return; }
    else if (act === 'back') { view.edit = null; render(); return; }
    else if (act === 'addAlbum') {
      C.albums.unshift({ id: 'u' + Date.now(), title: 'Album mới', type: 'Lễ cưới', date: '', total: 0, visible: true, cover: 0, photos: [] });
      view.edit = 0;
    } else if (act === 'cover') C.albums[+b.dataset.i].cover = +b.dataset.j;
    else if (act === 'resetText') delete C.texts[b.dataset.key];
    else if (act === 'resetImg') delete C.imgs[b.dataset.key];
    else if (act === 'add') get(path).push(NEW[path]());
    else if (act === 'addFilm') C.films.push({ drive: '', sub: 'Phóng sự', title: 'Phim mới', poster: cover(C.albums[0] || { photos: [] }), visible: true });
    else if (act === 'pick') { openPicker(path); return; }
    else if (act === 'closePicker') { $('#picker').hidden = true; return; }
    else if (act === 'pickImg') {
      set(pickTarget, pickTarget.endsWith('poster') ? b.dataset.sm : b.dataset.src);
      $('#picker').hidden = true;
    } else if (act === 'export') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(C)], { type: 'application/json' }));
      a.download = `mistudio-noidung-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000); return;
    } else if (act === 'resetAll') {
      if (!b.classList.contains('is-armed')) { b.classList.add('is-armed'); b.textContent = 'Bấm lần nữa để đặt lại'; return; }
      try { await Store.reset(token); C = await Store.load(); status('Đã đặt lại về nội dung gốc'); }
      catch (ex) { if (ex.status === 401) needLogin('Đăng nhập lại để đặt lại nội dung.'); else status('Không đặt lại được: ' + ex.message, 'is-err'); }
      render(); return;
    } else return;
    dirty(); render();
  });

  function openPicker(path) {
    pickTarget = path;
    $('#pickerGrid').innerHTML = C.albums.filter((a) => a.photos.length).map((a) => `<div><h3>${esc(a.title)}</h3><div class="picker__row">
      ${a.photos.map((p) => `<button data-act="pickImg" data-src="${esc(p.src)}" data-sm="${esc(p.sm || p.src)}"><img src="${esc(p.sm || p.src)}" alt="" loading="lazy"></button>`).join('')}</div></div>`).join('');
    $('#picker').hidden = false; $('#picker .abtn').focus();
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#picker').hidden) $('#picker').hidden = true; });

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.matches('[data-q]')) { q = t.value; $('#textList').innerHTML = textList(); return; }
    if (t.matches('[data-text]')) {
      const k = t.dataset.text, d = DEF_TEXTS.find((x) => x.key === k);
      if (d && t.value === d.def) delete C.texts[k]; else C.texts[k] = t.value;
      t.closest('.tfield').classList.toggle('is-changed', C.texts[k] != null);
      dirty(); return;
    }
    if (t.matches('[data-bind]') && t.type !== 'checkbox') {
      let v = t.type === 'number' ? Math.max(0, +t.value || 0) : t.value;
      if (t.dataset.bind.endsWith('|drive')) v = driveId(v);
      set(t.dataset.bind, v); dirty();
    }
  });

  document.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.matches('[data-bind][type=checkbox]')) { set(t.dataset.bind, t.checked); dirty(); render(); return; }
    if (t.matches('[data-upload],[data-upload-add]') && t.files.length) {
      status('Đang xử lý ảnh…', 'is-dirty');
      const out = [];
      let fail = '';
      for (const f of t.files) {
        try { out.push(await compress(f)); }
        catch (ex) { fail = ex.status === 401 ? 'login' : (ex.message === 'not image' ? 'File không phải ảnh.' : 'Tải ảnh lỗi: ' + ex.message); }
      }
      t.value = '';
      if (fail === 'login') needLogin('Phiên đăng nhập đã hết hạn, đăng nhập lại rồi tải ảnh lần nữa.');
      if (!out.length) { status(fail === 'login' ? 'Chưa tải được ảnh' : fail || 'Không có ảnh', 'is-err'); return; }
      if (t.dataset.upload) set(t.dataset.upload, out[0].src);
      else {
        const arr = get(t.dataset.uploadAdd);
        out.forEach((p) => arr.push(t.dataset.uploadAdd === 'layouts' ? { src: p.src, w: p.w, h: p.h, visible: true } : p));
      }
      dirty(); render(); return;
    }
    if (t.matches('[data-import]') && t.files[0]) {
      try {
        const obj = JSON.parse(await t.files[0].text());
        if (!obj || !Array.isArray(obj.albums) || typeof obj.texts !== 'object') throw new Error('sai định dạng');
        await Store.save(obj, token); C = await Store.load(); status('Đã nhập file nội dung'); render();
      } catch (ex) {
        if (ex.status === 401) needLogin('Đăng nhập lại để nhập file.');
        else status(ex.status ? 'Máy chủ từ chối: ' + ex.message : 'File không đúng định dạng nội dung Mì Studio.', 'is-err');
      }
      t.value = '';
    }
  });

  if (token) start();
  else ready.then(() => { if (Store.mode() === 'local') $('.login__note').textContent = 'Đang chạy cục bộ (không có máy chủ): bấm Đăng nhập để vào, dữ liệu chỉ lưu trong trình duyệt.'; });
})();
