/* Liên hệ: các kênh liên hệ · form tư vấn (gửi vào hộp thư "leads") · bản đồ mở ra theo cuộn */
import { $, esc, icon, pageHero, href, wireForm, field } from '../main.js';

export function render({ docs, collections }) {
  const s = docs.site, q = new URLSearchParams(location.search);
  const pick = collections.services.find((x) => x.slug === q.get('dv'))?.name;
  const proj = collections.projects.find((x) => x.slug === q.get('ct'))?.name;
  const cards = [
    ['pin', 'Địa chỉ', s.address, null], ['phone', 'Hotline', s.hotline || s.phone, href('tel', s)], ['mail', 'Email', s.email, href('mail', s)],
    ['zalo', 'Zalo', s.zalo, href('zalo', s)], ['facebook', 'Fanpage Facebook', 'Nhắn tin qua Fanpage', s.facebook], ['tiktok', 'TikTok', 'Video công trình', s.tiktok],
    ['clock', 'Giờ làm việc', s.workingHours, null],
  ].filter(([, , v, h]) => v && h !== '');
  return pageHero(docs.pages.contact, ['Liên hệ']) + `
  <section class="section grid-paper"><div class="container">
    <div class="sec-head"><div><span class="eyebrow">${esc(s.legalName)}</span><h2>Kênh liên hệ chính thức</h2></div></div>
    <div class="contact-grid" data-stagger="rise3d">${cards.map(([i, l, v, h]) => `<${h ? `a href="${esc(h)}"${/^https?:/.test(h) ? ' target="_blank" rel="noopener"' : ''}` : 'div'} class="c-card" data-tilt><span class="ico">${icon(i)}</span><span><small>${l}</small><b>${esc(v)}</b></span></${h ? 'a' : 'div'}>`).join('')}</div>
  </div></section>
  <section class="section alt" id="tu-van"><div class="container contact-split">
    <div class="form-card"><span class="eyebrow">Tư vấn miễn phí</span><h2>Gửi yêu cầu tư vấn</h2><p class="lead" style="margin-bottom:20px">Kỹ sư sẽ gọi lại trong giờ làm việc để tư vấn và hẹn lịch khảo sát.</p>
      <form class="form" novalidate><div class="row2">${field('name', 'Họ và tên', { req: 1, ac: 'name' })}${field('phone', 'Số điện thoại', { req: 1, type: 'tel', ac: 'tel' })}</div>
        <div class="row2">${field('email', 'Email', { type: 'email', ac: 'email' })}${field('service', 'Dịch vụ quan tâm', { type: 'select', options: [...collections.services.map((x) => x.name), 'Khác'], value: pick })}</div>
        ${field('message', 'Nội dung', { type: 'textarea', ph: 'Diện tích đất, số tầng, khu vực, thời gian dự kiến…' })}
        <button class="btn btn-primary" type="submit">Gửi yêu cầu ${icon('send')}</button><p class="form-msg" hidden role="status"></p></form></div>
    <div class="map-wrap" data-unfold><div class="map-card">${s.mapEmbed ? `<iframe src="${esc(s.mapEmbed)}" title="Bản đồ ${esc(s.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>` : `<div class="ph-img">${icon('pin').replace('<svg', '<svg style="width:40px;height:40px;margin:0 auto 10px"')}Bản đồ Google Maps<br><small>Hiển thị khi doanh nghiệp cung cấp địa chỉ (nhập trong Quản trị → Thông tin doanh nghiệp)</small></div>`}</div></div>
  </div></section>`.replace('<textarea name="message"', proj ? `<textarea name="message" data-pre="${esc('Tôi muốn tư vấn công trình tương tự: ' + proj)}"` : '<textarea name="message"');
}

export function init() {
  const f = $('#tu-van form'), ta = f.elements.message;
  if (ta.dataset.pre) ta.value = ta.dataset.pre;
  wireForm(f, 'leads', () => ({ source: 'Trang liên hệ' }));
}
