/* Chi tiết tin tuyển dụng ?vt=<slug> + form ứng tuyển (gửi vào hộp thư "applications") */
import { $, esc, icon, paras, href, wireForm, field, fmtDate } from '../main.js';

const MAX_CV = 5 * 1024 * 1024;
const cur = (cols) => cols.jobs.find((j) => j.slug === new URLSearchParams(location.search).get('vt'));

export function render({ docs, collections }) {
  const j = cur(collections), site = docs.site;
  if (!j) return `<section class="page-hero" style="min-height:420px"><div class="container"><h1>Không tìm thấy tin tuyển dụng</h1><a class="btn btn-light" href="tuyen-dung.html">Xem các vị trí khác</a></div></section>`;
  document.title = `Tuyển ${j.title} – ${site.name}`;
  const open = j.status === 'open';
  const list = (t, a) => (a?.length ? `<h2>${t}</h2><ul class="items">${a.map((x) => `<li>${icon('check')}${esc(x)}</li>`).join('')}</ul>` : '');
  const rows = [['Số lượng', j.quantity + ' người'], ['Địa điểm', j.location], ['Mức lương', j.salary], ['Hình thức', j.type], ['Kinh nghiệm', j.experience], ['Ngày đăng', fmtDate(j.postedAt)], ['Hạn nộp', fmtDate(j.deadline)]];
  return `<section class="page-hero" data-scrub style="min-height:440px"><div class="bg"><img src="${esc(docs.pages.jobs.image)}" alt="" width="1600" height="900"></div><div class="container">
    <ol class="crumbs"><li><a href="index.html">Trang chủ</a></li><li><a href="tuyen-dung.html">Tuyển dụng</a></li><li>${esc(j.title)}</li></ol>
    <span class="status${open ? '' : ' closed'}" style="margin-bottom:14px">${open ? 'Đang tuyển' : 'Đã đóng'}</span><h1>${esc(j.title)}</h1><p class="lead">${esc(j.salary)} · ${esc(j.location)}</p></div></section>
  <section class="section"><div class="container detail">
    <div class="prose"><h2 style="margin-top:0">Mô tả công việc</h2>${paras(j.description)}${list('Yêu cầu ứng viên', j.requirements)}<h2>Kinh nghiệm</h2><p>${esc(j.experience)}</p>${list('Quyền lợi & chế độ', j.benefits)}
      <h2>Liên hệ tuyển dụng</h2><p>${esc(j.contact)} · <a href="${href('tel', { phone: site.recruitPhone })}">${esc(site.recruitPhone)}</a> (gọi/Zalo) · <a href="mailto:${esc(site.recruitEmail)}">${esc(site.recruitEmail)}</a></p>
      <div class="form-card" id="ung-tuyen" style="margin-top:32px">${open ? `<h2 style="margin-top:0">Ứng tuyển vị trí này</h2>
        <form class="form" novalidate><div class="row2">${field('name', 'Họ và tên', { req: 1, ac: 'name' })}${field('phone', 'Số điện thoại', { req: 1, type: 'tel', ac: 'tel' })}</div>
          ${field('email', 'Email', { type: 'email', ac: 'email' })}${field('note', 'Giới thiệu ngắn về kinh nghiệm', { type: 'textarea' })}
          <label class="field">Hồ sơ CV (PDF, Word hoặc ảnh, tối đa 5 MB)<input type="file" name="cv" accept=".pdf,.doc,.docx,image/*"><span class="hint">Không bắt buộc với vị trí công nhân – có thể gọi trực tiếp.</span><span class="err" aria-live="polite"></span></label>
          <button class="btn btn-primary" type="submit">Gửi hồ sơ ${icon('send')}</button><p class="form-msg" hidden role="status"></p></form>`
      : `<h2 style="margin-top:0">Vị trí đã đóng</h2><p>Vị trí này đã ngừng nhận hồ sơ. <a href="tuyen-dung.html">Xem các vị trí đang tuyển</a>.</p>`}</div>
    </div>
    <aside><div class="spec"><table><caption>Thông tin tuyển dụng</caption><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>
      <div class="acts">${open ? '<a class="btn btn-primary" href="#ung-tuyen">Ứng tuyển ngay</a>' : ''}<a class="btn btn-ghost" href="${href('zalo', { zalo: site.recruitPhone })}" target="_blank" rel="noopener">${icon('zalo')} Zalo tuyển dụng</a></div></div></aside>
  </div></section>`;
}

export function init({ collections }) {
  const j = cur(collections), form = $('#ung-tuyen form'); if (!form) return;
  const cv = form.elements.cv;
  // shortcut: bản mock lưu CV dạng data URL trong trình duyệt; backend thật tải file lên kho lưu trữ (R2/S3)
  wireForm(form, 'applications', () => new Promise((res, rej) => {
    const f = cv.files[0], err = $('.err', cv.closest('.field'));
    const base = { jobId: j.id, jobTitle: j.title, cv: undefined, cvName: f?.name || '', cvData: '' };
    if (!f) return res(base);
    if (f.size > MAX_CV) { err.textContent = 'File vượt quá 5 MB.'; return rej(new Error('cv')); }
    const r = new FileReader(); r.onload = () => res({ ...base, cvData: r.result }); r.onerror = rej; r.readAsDataURL(f);
  }));
}
