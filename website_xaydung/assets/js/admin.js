/* Trang quản trị: mọi nội dung website (ảnh, chữ, logo, menu, SEO, chatbot) sửa qua schema dưới đây.
   Thêm trường mới = thêm một dòng vào COLS/DOCS. Sửa vào bản NHÁP; bấm "Xuất bản" để website công khai cập nhật. */
import { api, ApiError, fold, slugify, compressImage } from './api.js';
import { CONFIG } from './config.js';
import { ICONS } from './icons.js';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const get = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
const set = (o, p, v) => { const ks = p.split('.'); let t = o; ks.slice(0, -1).forEach((k) => { t = t[k] ??= {}; }); t[ks.at(-1)] = v; };
const fmtTime = (d) => (d ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(d)) : '');
const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600); };
const fail = (e) => toast(e instanceof ApiError ? e.message : 'Có lỗi xảy ra. Thử lại.');

/* ---------- Khai báo trường ---------- */
const T = (k, l, x = {}) => ({ k, l, t: 'text', ...x });
const A = (k, l, x = {}) => ({ k, l, t: 'textarea', ...x });
const IMG = (k, l = 'Ảnh', x = {}) => ({ k, l, t: 'image', ...x });
const B = (k, l) => ({ k, l, t: 'bool' });
const LN = (k, l) => ({ k, l, t: 'lines', hint: 'Mỗi dòng một mục' });
const H = (l) => ({ t: 'h', l });
const ICON = { k: 'icon', l: 'Biểu tượng', t: 'select', options: ICONS };
const PUB = B('published', 'Hiển thị trên website');
const LINK_HINT = 'Tên trang (vd: lien-he.html, cong-trinh.html) hoặc gõ tel / zalo / facebook để dùng thông tin liên hệ chung';
const LEAD_ST = [['new', 'Mới'], ['contacted', 'Đã liên hệ'], ['done', 'Hoàn tất']];
const APP_ST = [['new', 'Mới'], ['reviewing', 'Đang xem xét'], ['interview', 'Hẹn phỏng vấn'], ['rejected', 'Không phù hợp']];
const cats = () => site.projectCategories || [];
let site = {};

const COLS = {
  services: { label: 'Dịch vụ', title: 'name', cols: [['image', '', 'img'], ['name', 'Tên dịch vụ'], ['featured', 'Ở trang chủ', 'bool'], ['published', 'Hiển thị', 'bool']], fields: [
    T('name', 'Tên dịch vụ', { req: 1 }), T('slug', 'Đường dẫn (tự tạo nếu để trống)'), ICON, IMG('image'), A('summary', 'Mô tả ngắn (hiện trên thẻ)'), A('description', 'Mô tả chi tiết'), LN('scope', 'Phạm vi thực hiện'),
    B('featured', 'Hiện ở mục "Dịch vụ nổi bật" trang chủ'), PUB] },
  projects: { label: 'Công trình', title: 'name', cols: [['cover', '', 'img'], ['name', 'Tên công trình'], ['category', 'Nhóm'], ['status', 'Trạng thái', 'status'], ['featured', 'Tiêu biểu', 'bool'], ['published', 'Hiển thị', 'bool']], fields: [
    T('name', 'Tên công trình', { req: 1 }), T('slug', 'Đường dẫn (tự tạo nếu để trống)'), { k: 'category', l: 'Nhóm công trình', t: 'select', options: cats },
    { k: 'status', l: 'Trạng thái', t: 'select', options: [['done', 'Đã hoàn thành'], ['ongoing', 'Đang thi công']] }, T('location', 'Địa điểm'), T('type', 'Loại công trình'), T('scale', 'Quy mô'), T('client', 'Chủ đầu tư'), T('time', 'Thời gian thực hiện'),
    LN('items', 'Hạng mục doanh nghiệp đảm nhận'), A('summary', 'Mô tả ngắn'), A('description', 'Mô tả chi tiết (cách đoạn bằng 1 dòng trống)'),
    IMG('cover', 'Ảnh đại diện'), { k: 'gallery', l: 'Album ảnh thực tế', t: 'gallery' }, T('video', 'Video (link YouTube hoặc link file .mp4)'),
    B('featured', 'Công trình tiêu biểu (hiện ở trang chủ & vòng quay 3D)'), PUB] },
  jobs: { label: 'Tin tuyển dụng', title: 'title', cols: [['title', 'Vị trí'], ['quantity', 'SL'], ['deadline', 'Hạn nộp', 'date'], ['status', 'Trạng thái', 'status'], ['published', 'Hiển thị', 'bool']], fields: [
    T('title', 'Tên vị trí', { req: 1 }), T('slug', 'Đường dẫn (tự tạo nếu để trống)'), T('quantity', 'Số lượng cần tuyển', { type: 'number' }), T('location', 'Địa điểm làm việc'), T('salary', 'Mức lương / thoả thuận'), T('type', 'Hình thức'),
    T('postedAt', 'Ngày đăng', { type: 'date' }), T('deadline', 'Hạn nộp hồ sơ', { type: 'date' }), { k: 'status', l: 'Trạng thái tuyển', t: 'select', options: [['open', 'Đang tuyển'], ['closed', 'Đã đóng']] },
    A('description', 'Mô tả công việc'), LN('requirements', 'Yêu cầu ứng viên'), T('experience', 'Kinh nghiệm cần có'), LN('benefits', 'Quyền lợi & chế độ'), T('contact', 'Người/bộ phận liên hệ'), PUB] },
  team: { label: 'Đội ngũ', title: 'title', cols: [['image', '', 'img'], ['title', 'Nhóm'], ['published', 'Hiển thị', 'bool']], fields: [T('title', 'Tên nhóm', { req: 1 }), A('text', 'Mô tả'), IMG('image'), PUB] },
  milestones: { label: 'Mốc phát triển', title: 'title', cols: [['year', 'Năm'], ['title', 'Tiêu đề'], ['published', 'Hiển thị', 'bool']], fields: [T('year', 'Năm', { req: 1 }), T('title', 'Tiêu đề', { req: 1 }), A('text', 'Mô tả'), PUB] },
  certs: { label: 'Chứng chỉ & hồ sơ', title: 'title', cols: [['title', 'Tên'], ['text', 'Ghi chú'], ['published', 'Hiển thị', 'bool']], fields: [T('title', 'Tên chứng chỉ / giấy phép', { req: 1 }), T('text', 'Số hiệu, hạng, ghi chú'), ICON, PUB] },
  partners: { label: 'Đối tác', title: 'name', cols: [['image', '', 'img'], ['name', 'Tên'], ['published', 'Hiển thị', 'bool']], fields: [T('name', 'Tên đối tác', { req: 1 }), IMG('image', 'Logo đối tác'), PUB] },
  media: { label: 'Thư viện ảnh', title: 'name', cols: [['url', '', 'img'], ['name', 'Tên ảnh'], ['url', 'Đường dẫn', 'path']], fields: [T('name', 'Tên ảnh', { req: 1 }), IMG('url', 'Ảnh', { req: 1 })] },
  leads: { label: 'Yêu cầu tư vấn', inbox: 1, title: 'name', cols: [['createdAt', 'Thời gian', 'time'], ['name', 'Khách hàng'], ['phone', 'Điện thoại'], ['service', 'Nhu cầu'], ['status', 'Trạng thái', 'status']], fields: [
    { k: 'status', l: 'Trạng thái xử lý', t: 'select', options: LEAD_ST }, T('name', 'Họ tên'), T('phone', 'Điện thoại'), T('email', 'Email'), T('service', 'Nhu cầu'), A('message', 'Nội dung'), T('source', 'Gửi từ trang'), A('note', 'Ghi chú nội bộ')] },
  applications: { label: 'Hồ sơ ứng tuyển', inbox: 1, title: 'name', cols: [['createdAt', 'Thời gian', 'time'], ['jobTitle', 'Vị trí'], ['name', 'Ứng viên'], ['phone', 'Điện thoại'], ['status', 'Trạng thái', 'status']], fields: [
    { k: 'status', l: 'Trạng thái xử lý', t: 'select', options: APP_ST }, T('jobTitle', 'Vị trí ứng tuyển'), T('name', 'Họ tên'), T('phone', 'Điện thoại'), T('email', 'Email'), A('note', 'Giới thiệu của ứng viên'), { k: 'cvData', l: 'Hồ sơ CV', t: 'download', name: 'cvName' }, A('hrNote', 'Ghi chú nội bộ')] },
};
const STATUS = { open: 'Đang tuyển', closed: 'Đã đóng', done: 'Hoàn thành', ongoing: 'Đang thi công', ...Object.fromEntries([...LEAD_ST, ...APP_ST]) };

const DOCS = {
  home: { label: 'Trang chủ', doc: 'home', view: 'index.html', fields: [
    { k: 'sections', l: 'Các khối nội dung', hint: 'Bật/tắt và dùng ↑ ↓ để đổi thứ tự hiển thị', t: 'list', fixed: 1, compact: 1, of: [{ k: 'label', t: 'hidden' }, B('enabled', 'Hiển thị'), { k: 'key', t: 'hidden' }] },
    { k: 'slides', l: 'Banner đầu trang (slider)', t: 'list', item: 'banner', of: [IMG('image', 'Ảnh banner'), T('eyebrow', 'Dòng nhỏ phía trên'), T('title', 'Tiêu đề', { req: 1 }), A('text', 'Mô tả'), T('btn1', 'Nút chính'), T('btn1Href', 'Liên kết nút chính', { hint: LINK_HINT }), T('btn2', 'Nút phụ'), T('btn2Href', 'Liên kết nút phụ', { hint: LINK_HINT })] },
    H('Giới thiệu doanh nghiệp'), T('intro.eyebrow', 'Nhãn'), T('intro.title', 'Tiêu đề'), A('intro.text', 'Nội dung'), IMG('intro.image1', 'Ảnh lớn'), IMG('intro.image2', 'Ảnh nhỏ'), T('intro.badgeValue', 'Số nổi bật (vd 12+)'), T('intro.badgeLabel', 'Chú thích số'), LN('intro.fields', 'Lĩnh vực hoạt động'),
    H('Quy trình thi công (3D)'), T('process.title', 'Tiêu đề'), T('process.text', 'Mô tả'), { k: 'process.steps', l: '5 giai đoạn (khớp với mô hình 3D)', t: 'list', fixed: 1, of: [T('title', 'Tên giai đoạn'), A('text', 'Mô tả')] }, T('process.finalTitle', 'Tiêu đề khi hoàn thành'), A('process.finalText', 'Lời kêu gọi khi hoàn thành'),
    H('Năng lực & kinh nghiệm'), T('capability.title', 'Tiêu đề'), A('capability.text', 'Mô tả'), IMG('capability.image', 'Ảnh nền'),
    { k: 'stats', l: 'Số liệu nổi bật', t: 'list', item: 'số liệu', of: [T('value', 'Con số', { type: 'number' }), T('suffix', 'Hậu tố (+, %)'), T('label', 'Chú thích')] },
    { k: 'capability.strengths', l: 'Thế mạnh', t: 'list', item: 'thế mạnh', of: [ICON, T('title', 'Tiêu đề'), A('text', 'Mô tả')] },
    H('Khu vực liên hệ cuối trang'), T('cta.title', 'Tiêu đề'), A('cta.text', 'Mô tả')] },
  site: { label: 'Thông tin doanh nghiệp', doc: 'site', view: 'lien-he.html', fields: [
    H('Thương hiệu'), T('legalName', 'Tên pháp lý', { req: 1 }), T('name', 'Tên thương hiệu (ngắn)', { req: 1 }), T('tagline', 'Khẩu hiệu'), IMG('logo', 'Logo (dùng trên nền sáng)'), IMG('logoLight', 'Logo (dùng trên nền tối)'), A('footerAbout', 'Giới thiệu ngắn ở chân trang'), T('taxCode', 'Mã số thuế'),
    H('Liên hệ'), T('hotline', 'Hotline'), T('phone', 'Số điện thoại'), T('email', 'Email'), T('zalo', 'Số Zalo'), T('address', 'Địa chỉ'), T('mapEmbed', 'Link nhúng Google Maps', { hint: 'Google Maps → Chia sẻ → Nhúng bản đồ → sao chép phần src="…"' }), T('workingHours', 'Giờ làm việc'), T('areas', 'Khu vực hoạt động'),
    H('Mạng xã hội'), T('facebook', 'Fanpage Facebook'), T('tiktok', 'TikTok'), T('youtube', 'YouTube'),
    H('Tuyển dụng'), T('recruitPhone', 'Hotline / Zalo tuyển dụng'), T('recruitEmail', 'Email nhận hồ sơ'),
    H('Khác'), B('showDemoRibbon', 'Hiện dải thông báo "bản mockup" trên website')] },
  ui: { label: 'Menu, SEO & phân loại', doc: 'site', view: 'index.html', fields: [
    { k: 'menu', l: 'Menu điều hướng', t: 'list', item: 'mục menu', of: [T('label', 'Tên hiển thị'), T('href', 'Liên kết'), B('visible', 'Hiển thị')] },
    LN('projectCategories', 'Nhóm công trình (bộ lọc trang Công trình)'),
    ...[['home', 'Trang chủ'], ['about', 'Giới thiệu'], ['services', 'Dịch vụ'], ['projects', 'Công trình'], ['jobs', 'Tuyển dụng'], ['contact', 'Liên hệ']].flatMap(([k, l]) => [H('SEO – ' + l), T(`seo.${k}.title`, 'Tiêu đề trang (≤ 60 ký tự)'), A(`seo.${k}.description`, 'Mô tả (140–160 ký tự)')])] },
  pages: { label: 'Banner & nội dung trang con', doc: 'pages', view: 'gioi-thieu.html', fields: [
    ...[['about', 'Giới thiệu'], ['services', 'Dịch vụ'], ['projects', 'Công trình'], ['jobs', 'Tuyển dụng'], ['contact', 'Liên hệ']].flatMap(([k, l]) => [H('Trang ' + l), T(`${k}.title`, 'Tiêu đề banner'), A(`${k}.lead`, 'Mô tả banner'), IMG(`${k}.image`, 'Ảnh banner'),
      ...(k === 'about' ? [T('about.storyTitle', 'Tiêu đề câu chuyện'), A('about.story', 'Quá trình hình thành (cách đoạn bằng 1 dòng trống)'), A('about.statement', 'Câu tuyên bố (chữ sáng dần)'), LN('about.areas', 'Khu vực nhận thi công')] : []),
      ...(k === 'jobs' ? [{ k: 'jobs.perks', l: 'Quyền lợi', t: 'list', item: 'quyền lợi', of: [ICON, T('title', 'Tiêu đề'), A('text', 'Mô tả')] }] : [])])] },
  chatbot: { label: 'Chatbot', doc: 'chatbot', view: 'index.html', fields: [
    B('enabled', 'Bật chatbot trên website'), T('name', 'Tên trợ lý'), A('greeting', 'Lời chào'), A('fallback', 'Câu trả lời khi không hiểu', { hint: 'Dùng {phone}, {recruitPhone}, {workingHours} để chèn thông tin liên hệ' }),
    { k: 'options', l: 'Kịch bản hỏi – đáp', t: 'list', item: 'kịch bản', of: [T('label', 'Nút lựa chọn'), T('keywords', 'Từ khoá nhận diện (cách nhau dấu phẩy, không cần dấu)'), A('answer', 'Câu trả lời'),
      { k: 'links', l: 'Nút dẫn link', t: 'list', item: 'nút', compact: 0, of: [T('label', 'Chữ trên nút'), T('href', 'Liên kết', { hint: LINK_HINT })] }] }] },
};
const NAV = [['', [['dash', 'Tổng quan']]], ['Trang & giao diện', [['home'], ['site'], ['pages'], ['ui']]], ['Nội dung', [['services'], ['projects'], ['jobs'], ['team'], ['milestones'], ['certs'], ['partners']]],
  ['Khách hàng', [['leads'], ['applications']]], ['Khác', [['chatbot'], ['media']]]];
const labelOf = (k) => COLS[k]?.label || DOCS[k]?.label;

/* ---------- Trường động: dựng HTML & đọc lại ---------- */
const REG = [];                                     // định nghĩa trường list, để nút "+ Thêm" dựng mục mới
const opts = (f) => (typeof f.options === 'function' ? f.options() : f.options).map((o) => (Array.isArray(o) ? o : [o, o]));
function fieldsHTML(fields, o = {}) {
  return fields.map((f) => {
    if (f.t === 'h') return `<div class="grp-title">${esc(f.l)}</div>`;
    const v = get(o, f.k), head = `<span>${esc(f.l || '')}${f.req ? ' *' : ''}</span>${f.hint ? `<span class="hint">${esc(f.hint)}</span>` : ''}`;
    const wrap = (inner) => `<div class="f ${f.t}" data-k="${f.k}" data-t="${f.t}">${inner}</div>`;
    switch (f.t) {
      case 'textarea': return wrap(`<label>${head}<textarea data-v ${f.req ? 'required' : ''}>${esc(v)}</textarea></label>`);
      case 'lines': return wrap(`<label>${head}<textarea data-v>${esc((v || []).join('\n'))}</textarea></label>`);
      case 'select': return wrap(`<label>${head}<select data-v>${opts(f).map(([a, b]) => `<option value="${esc(a)}"${a === v ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select></label>`);
      case 'bool': return wrap(`<label><input type="checkbox" data-v ${(v ?? f.k !== 'featured') ? 'checked' : ''}> ${esc(f.l)}</label>`);
      case 'hidden': return wrap(`<input type="hidden" data-v value="${esc(v)}">`);
      case 'download': return wrap(`<span>${esc(f.l)}</span> ${v ? `<a class="btn sm" href="${esc(v)}" download="${esc(get(o, f.name) || 'cv')}">Tải về: ${esc(get(o, f.name) || 'CV')}</a>` : '<em>Không đính kèm</em>'}`);
      case 'image': return wrap(`<span>${head}</span><div class="img-field"><img src="${esc(v)}" alt=""><input type="hidden" data-v value="${esc(v)}">
        <label class="btn sm">Tải ảnh lên<input type="file" accept="image/*" hidden data-up></label><button type="button" class="btn sm" data-lib>Chọn từ thư viện</button><button type="button" class="btn sm" data-clear>Bỏ ảnh</button></div>`);
      case 'gallery': return wrap(`<span>${head}</span><div class="gal">${(v || []).map(galItem).join('')}</div>
        <div class="row" style="justify-content:flex-start;margin-top:8px"><label class="btn sm">Tải ảnh lên<input type="file" accept="image/*" multiple hidden data-upg></label><button type="button" class="btn sm" data-libg>Thêm từ thư viện</button></div>`);
      case 'list': { const id = REG.push(f) - 1; return wrap(`<span>${head}</span><div class="items">${(v || []).map((it) => itemHTML(f, it)).join('')}</div>${f.fixed ? '' : `<button type="button" class="btn sm" data-add="${id}">+ Thêm ${esc(f.item || 'mục')}</button>`}`); }
      default: return wrap(`<label>${head}<input data-v type="${f.type || 'text'}" value="${esc(v)}" ${f.req ? 'required' : ''}></label>`);
    }
  }).join('');
}
const galItem = (src) => `<figure data-src="${esc(src)}"><img src="${esc(src)}" alt=""><div><button type="button" data-gl aria-label="Sang trái">‹</button><button type="button" data-gr aria-label="Sang phải">›</button><button type="button" data-gx aria-label="Bỏ ảnh">×</button></div></figure>`;
const itemHTML = (f, it) => `<div class="item${f.compact ? ' compact' : ''}"><div class="item-bar"><b>${esc(it.label || it.title || it.name || '')}</b>
  <button type="button" class="btn sm" data-mv="-1" aria-label="Lên">↑</button><button type="button" class="btn sm" data-mv="1" aria-label="Xuống">↓</button>${f.fixed ? '' : '<button type="button" class="btn sm danger" data-del aria-label="Xoá mục">×</button>'}</div>
  <div class="fields">${fieldsHTML(f.of, it)}</div></div>`;

/** Đọc form về object; base giữ các khoá không có trong form */
function readFields(box, fields, base = {}) {
  const out = structuredClone(base);
  for (const f of fields) {
    if (f.t === 'h' || f.t === 'download') continue;
    const el = box.querySelector(`:scope > .f[data-k="${f.k}"]`), inp = el.querySelector('[data-v]');
    let v;
    if (f.t === 'bool') v = inp.checked;
    else if (f.t === 'lines') v = inp.value.split('\n').map((s) => s.trim()).filter(Boolean);
    else if (f.t === 'gallery') v = $$('.gal figure', el).map((x) => x.dataset.src);
    else if (f.t === 'list') v = $$(':scope > .items > .item', el).map((it) => readFields(it.querySelector(':scope > .fields'), f.of));
    else v = f.type === 'number' ? Number(inp.value) : inp.value.trim();
    if (f.req && v === '') throw new ApiError(`Vui lòng điền "${f.l}".`);
    set(out, f.k, v);
  }
  return out;
}

/** Sự kiện chung cho mọi form trường động (danh sách, ảnh, album) */
function wireFields(box) {
  box.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const item = b.closest('.item'), f = b.closest('.f');
    if (b.dataset.add) { const def = REG[b.dataset.add]; $(':scope > .items', f).insertAdjacentHTML('beforeend', itemHTML(def, {})); return; }
    if (b.dataset.mv && item) { const sib = +b.dataset.mv < 0 ? item.previousElementSibling : item.nextElementSibling; if (sib) (+b.dataset.mv < 0 ? sib.before(item) : sib.after(item)); return; }
    if ('del' in b.dataset && item) { item.remove(); return; }
    if ('lib' in b.dataset) { const url = await pick(); if (url) setImg(f, url); return; }
    if ('clear' in b.dataset) { setImg(f, ''); return; }
    if ('libg' in b.dataset) { const url = await pick(); if (url) $('.gal', f).insertAdjacentHTML('beforeend', galItem(url)); return; }
    const fig = b.closest('figure');
    if (fig) { if ('gx' in b.dataset) fig.remove(); if ('gl' in b.dataset) fig.previousElementSibling?.before(fig); if ('gr' in b.dataset) fig.nextElementSibling?.after(fig); }
  });
  box.addEventListener('change', async (e) => {
    const inp = e.target; if (!inp.files?.length) return;
    const f = inp.closest('.f');
    try {
      for (const file of inp.files) {
        const url = await upload(file);
        if ('up' in inp.dataset) setImg(f, url); else $('.gal', f).insertAdjacentHTML('beforeend', galItem(url));
      }
    } catch { toast('Không đọc được ảnh.'); }
    inp.value = '';
  });
}
const setImg = (f, url) => { $('img', f).src = url; $('[data-v]', f).value = url; };
/** Nén ảnh rồi lưu luôn vào thư viện để dùng lại */
async function upload(file) {
  const url = await compressImage(file);
  await api.save('media', { name: file.name.replace(/\.\w+$/, ''), url });
  return url;
}
function pick() {
  return new Promise(async (res) => {
    const dlg = $('#lib'), grid = $('#libGrid');
    grid.innerHTML = (await api.list('media')).map((m) => `<button type="button" data-u="${esc(m.url)}"><img src="${esc(m.url)}" alt=""><span>${esc(m.name)}</span></button>`).join('') || '<p class="empty">Thư viện trống.</p>';
    grid.onclick = (e) => { const b = e.target.closest('button'); if (b) { dlg.close(); res(b.dataset.u); } };
    $('#libClose').onclick = () => { dlg.close(); res(''); };
    dlg.onclose = () => res('');
    dlg.showModal();
  });
}

/* ---------- Khung ---------- */
let tab = 'dash', q = '';
async function boot() {
  $('#demoNote').textContent = CONFIG.mode === 'mock' ? `Chế độ demo · tài khoản: ${CONFIG.mockAdmin.username} / ${CONFIG.mockAdmin.password}` : '';
  try { await api.me(); show(); } catch { $('#login').hidden = false; }
}
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault(); const f = new FormData(e.target);
  try { await api.login(f.get('u'), f.get('p')); $('#login').hidden = true; show(); } catch (err) { $('#loginErr').textContent = err.message; }
});
$('#logoutBtn').addEventListener('click', async () => { await api.logout(); location.reload(); });
$('#search').addEventListener('input', (e) => { q = fold(e.target.value); render(); });
$('#addBtn').addEventListener('click', () => edit({}));
wireFields($('#fields'));

async function show() {
  $('#app').hidden = false;
  tab = location.hash.slice(1); if (!COLS[tab] && !DOCS[tab]) tab = 'dash';
  await nav(); render();
  $('#tabs').onclick = (e) => { const b = e.target.closest('button'); if (b) { tab = b.dataset.t; q = ''; $('#search').value = ''; history.replaceState(null, '', '#' + tab); render(); } };
}
async function nav() {
  const st = await api.status();
  const badge = { leads: st.newLeads, applications: st.newApplications };
  $('#tabs').innerHTML = NAV.map(([g, items]) => (g ? `<div class="grp">${g}</div>` : '') + items.map(([k, l]) => `<button data-t="${k}" aria-current="${k === tab}">${esc(l || labelOf(k))}${badge[k] ? `<span class="badge">${badge[k]}</span>` : ''}</button>`).join('')).join('');
}
async function pubbar() {
  const st = await api.status(), bar = $('#pubbar'), view = DOCS[tab]?.view || 'index.html';
  bar.className = 'pubbar' + (st.dirty ? ' dirty' : '');
  bar.innerHTML = st.dirty
    ? `<span>Có thay đổi chưa xuất bản – website công khai vẫn hiển thị bản cũ.</span><a class="btn sm" href="${view}?preview=1" target="_blank">Xem trước</a><button class="btn sm primary" id="pubBtn">Xuất bản</button><button class="btn sm danger" id="discardBtn">Huỷ thay đổi</button>`
    : `<span>Website đang hiển thị bản mới nhất${st.publishedAt ? ' · xuất bản lúc ' + fmtTime(st.publishedAt) : ''}.${CONFIG.mode === 'mock' ? ' (Demo: dữ liệu chỉ lưu trong trình duyệt này.)' : ''}</span><a class="btn sm" href="${view}" target="_blank" rel="noopener">Xem website</a>`;
  $('#pubBtn')?.addEventListener('click', async () => { try { await api.publish(); toast('Đã xuất bản lên website'); pubbar(); } catch (e) { fail(e); } });
  const d = $('#discardBtn'); if (d) twoClick(d, 'Bấm lần nữa: bỏ mọi thay đổi nháp', async () => { await api.discard(); toast('Đã huỷ thay đổi'); render(); });
}
function twoClick(btn, label, run) {
  let armed = false, t; const l0 = btn.textContent;
  const reset = () => { armed = false; btn.textContent = l0; btn.classList.remove('armed'); };
  btn.addEventListener('click', async () => {
    if (!armed) { armed = true; btn.textContent = label; btn.classList.add('armed'); t = setTimeout(reset, 3000); return; }
    clearTimeout(t); reset(); try { await run(); } catch (e) { fail(e); }
  });
}

async function render() {
  site = await api.getDoc('site');
  $$('#tabs button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.t === tab)));
  $('#title').textContent = tab === 'dash' ? 'Tổng quan' : labelOf(tab);
  const S = COLS[tab], box = $('#content'); box.onclick = null;
  $('#addBtn').hidden = !S || !!S.inbox; $('#search').hidden = !S;
  await pubbar();
  if (tab === 'dash') return dash(box);
  if (DOCS[tab]) return docForm(box, DOCS[tab]);
  let rows = await api.list(tab);
  if (q) rows = rows.filter((r) => fold(Object.values(r).filter((x) => typeof x === 'string' && !x.startsWith('data:')).join(' ')).includes(q));
  if (!rows.length) { box.innerHTML = `<p class="empty">${q ? 'Không tìm thấy kết quả.' : S.inbox ? 'Chưa có dữ liệu gửi đến.' : 'Chưa có dữ liệu. Bấm “+ Thêm mới”.'}</p>`; return; }
  const cell = (r, [k, , kind]) => {
    const v = r[k];
    if (kind === 'img') return v ? `<img class="thumb" src="${esc(v)}" alt="">` : '';
    if (kind === 'bool') return `<span class="pill${v !== false ? ' on' : ''}">${v !== false ? 'Có' : 'Không'}</span>`;
    if (kind === 'status') return `<span class="pill${['open', 'done', 'contacted'].includes(v) ? ' on' : v === 'new' ? ' new' : ''}">${esc(STATUS[v] || v)}</span>`;
    if (kind === 'time') return esc(fmtTime(v));
    if (kind === 'date') return v ? esc(new Intl.DateTimeFormat('vi-VN').format(new Date(v))) : '';
    if (kind === 'path') return `<code style="font-size:.78rem">${esc(String(v).startsWith('data:') ? '(ảnh tải lên)' : v)}</code>`;
    return esc(v);
  };
  const canMove = !S.inbox && !q;
  box.innerHTML = `<div style="overflow:auto"><table><thead><tr>${S.cols.map(([, l]) => `<th>${esc(l)}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map((r) => `<tr data-id="${esc(r.id)}">
    ${S.cols.map((c) => `<td>${cell(r, c)}</td>`).join('')}
    <td class="act">${canMove ? '<button class="btn sm" data-a="up" aria-label="Lên">↑</button> <button class="btn sm" data-a="down" aria-label="Xuống">↓</button> ' : ''}<button class="btn sm" data-a="edit">${S.inbox ? 'Xem' : 'Sửa'}</button> <button class="btn sm danger" data-a="del">Xoá</button></td></tr>`).join('')}</tbody></table></div>`;
  box.onclick = async (e) => {
    const b = e.target.closest('button[data-a]'); if (!b) return; const id = b.closest('tr').dataset.id;
    if (b.dataset.a === 'edit') return edit(rows.find((r) => r.id === id));
    if (b.dataset.a === 'up' || b.dataset.a === 'down') {
      const ids = rows.map((r) => r.id), i = ids.indexOf(id), j = i + (b.dataset.a === 'up' ? -1 : 1);
      if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]];
      try { await api.reorder(tab, ids); render(); } catch (er) { fail(er); } return;
    }
    if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = 'Xoá thật?'; b.classList.add('armed'); setTimeout(() => { delete b.dataset.armed; b.textContent = 'Xoá'; b.classList.remove('armed'); }, 3000); return; }
    try { await api.remove(tab, id); toast('Đã xoá'); render(); nav(); } catch (er) { fail(er); }
  };
}

function edit(rec) {
  const S = COLS[tab];
  $('#dlgTitle').textContent = (rec.id ? (S.inbox ? 'Chi tiết – ' : 'Sửa – ') : 'Thêm – ') + S.label.toLowerCase();
  $('#formErr').textContent = '';
  const isNew = !rec.id;
  if (isNew && 'published' in Object.fromEntries(S.fields.map((f) => [f.k, 1]))) rec = { published: true };
  $('#fields').innerHTML = fieldsHTML(S.fields, rec);
  const dlg = $('#dlg'); dlg.returnValue = ''; dlg.showModal();
  $('#form').onsubmit = async (e) => {
    if (e.submitter?.value !== 'ok') return;
    e.preventDefault();
    try {
      const out = readFields($('#fields'), S.fields, rec);
      if ('slug' in out) out.slug = slugify(out.slug || out[S.title]);
      await api.save(tab, out); dlg.close(); toast(S.inbox ? 'Đã cập nhật' : 'Đã lưu bản nháp'); render(); nav();
    } catch (er) { $('#formErr').textContent = er.message || 'Không lưu được.'; }
  };
}

async function docForm(box, D) {
  const doc = await api.getDoc(D.doc);
  box.innerHTML = `<form class="panel" id="docForm" novalidate><div class="fields">${fieldsHTML(D.fields, doc)}</div><p class="err" role="alert"></p><div class="row sticky-row"><button class="btn primary">Lưu bản nháp</button></div></form>`;
  const form = $('#docForm'); wireFields(form);
  form.onsubmit = async (e) => {
    e.preventDefault();
    try { await api.saveDoc(D.doc, readFields($('.fields', form), D.fields, await api.getDoc(D.doc))); toast('Đã lưu bản nháp – bấm "Xuất bản" để cập nhật website'); pubbar(); $('.err', form).textContent = ''; }
    catch (er) { $('.err', form).textContent = er.message || 'Không lưu được.'; }
  };
}

async function dash(box) {
  const [sv, pj, jb, ld, ap] = await Promise.all(['services', 'projects', 'jobs', 'leads', 'applications'].map((c) => api.list(c)));
  const card = (n, l, t) => `<button class="card" data-t="${t}" style="text-align:left;cursor:pointer;font:inherit"><b>${n}</b><span>${l}</span></button>`;
  box.innerHTML = `<div class="cards">${card(ld.filter((x) => x.status === 'new').length, 'Yêu cầu tư vấn mới', 'leads')}${card(ap.filter((x) => x.status === 'new').length, 'Hồ sơ ứng tuyển mới', 'applications')}
    ${card(pj.length, 'Công trình', 'projects')}${card(sv.length, 'Dịch vụ', 'services')}${card(jb.filter((x) => x.status === 'open').length, 'Vị trí đang tuyển', 'jobs')}</div>
    <div class="help"><h2>Cách cập nhật website</h2><ol>
      <li>Chọn mục ở cột trái (vd <b>Công trình</b> → <b>+ Thêm mới</b>), điền thông tin, tải ảnh lên rồi bấm <b>Lưu</b>.</li>
      <li>Thay đổi được lưu vào <b>bản nháp</b>. Bấm <b>Xem trước</b> ở thanh vàng để kiểm tra.</li>
      <li>Bấm <b>Xuất bản</b> để website công khai hiển thị nội dung mới.</li>
      <li>Logo, hotline, địa chỉ, mạng xã hội: <b>Thông tin doanh nghiệp</b>. Ảnh banner trang chủ: <b>Trang chủ</b>. Menu & SEO: <b>Menu, SEO & phân loại</b>.</li>
      <li>Ảnh tải lên được tự nén (tối đa ${CONFIG.uploadMaxWidth}px) và lưu vào <b>Thư viện ảnh</b> để dùng lại.</li>
    </ol>${CONFIG.mode === 'mock' ? '<p class="demo-note">Bản demo: dữ liệu chỉ lưu trong trình duyệt đang dùng. Khi có máy chủ thật, mọi thao tác giữ nguyên.</p>' : ''}</div>`;
  box.onclick = (e) => { const b = e.target.closest('.card'); if (b) { tab = b.dataset.t; history.replaceState(null, '', '#' + tab); render(); } };
}

$('#exportBtn').addEventListener('click', async () => {
  const blob = new Blob([JSON.stringify(await api.exportAll(), null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `sao-luu-website-${new Date().toISOString().slice(0, 10)}.json` }); a.click(); URL.revokeObjectURL(a.href);
});
$('#importFile').addEventListener('change', async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try { await api.importAll(JSON.parse(await f.text())); toast('Đã khôi phục dữ liệu'); render(); nav(); } catch (er) { fail(er instanceof SyntaxError ? new ApiError('File không phải JSON hợp lệ.') : er); }
  e.target.value = '';
});
twoClick($('#resetBtn'), 'Bấm lần nữa: xoá mọi thay đổi', async () => { await api.resetDemo(); toast('Đã đặt lại dữ liệu mẫu'); render(); nav(); });
boot();
