/* Chi tiết công trình: ?ct=<slug> (chạy trên mọi host tĩnh, không cần rewrite URL) */
import { $, $$, esc, icon, paras, href } from '../main.js';
import { projCard } from './projects.js';

const cur = (cols) => cols.projects.find((p) => p.slug === new URLSearchParams(location.search).get('ct'));
/** YouTube -> link nhúng; file video -> thẻ <video> */
function video(url) {
  const yt = url.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/);
  if (yt) return `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="Video giới thiệu công trình" loading="lazy" allowfullscreen></iframe></div>`;
  return `<div class="video"><video src="${esc(url)}" controls preload="metadata" style="width:100%;height:100%"></video></div>`;
}

export function render({ docs, collections }) {
  const p = cur(collections), site = docs.site;
  if (!p) return `<section class="page-hero" style="min-height:420px"><div class="container"><h1>Không tìm thấy công trình</h1><a class="btn btn-light" href="cong-trinh.html">Xem danh sách công trình</a></div></section>`;
  document.title = `${p.name} – ${site.name}`;
  const related = collections.projects.filter((x) => x.id !== p.id && x.category === p.category).concat(collections.projects.filter((x) => x.id !== p.id && x.category !== p.category)).slice(0, 3);
  const rows = [['Địa điểm', p.location], ['Loại công trình', p.type], ['Nhóm', p.category], ['Quy mô', p.scale], ['Chủ đầu tư', p.client], ['Thời gian', p.time], ['Trạng thái', p.status === 'ongoing' ? 'Đang thi công' : 'Đã hoàn thành']].filter(([, v]) => v);
  return `<section class="page-hero" data-scrub><div class="bg"><img src="${esc(p.cover)}" alt="" width="1200" height="900" fetchpriority="high"></div><div class="container">
    <ol class="crumbs"><li><a href="index.html">Trang chủ</a></li><li><a href="cong-trinh.html">Công trình</a></li><li>${esc(p.name)}</li></ol>
    <span class="status${p.status === 'ongoing' ? ' closed' : ''}" style="margin-bottom:14px">${p.status === 'ongoing' ? 'Đang thi công' : 'Đã hoàn thành'}</span>
    <h1>${esc(p.name)}</h1><p class="lead">${icon('pin').replace('<svg', '<svg style="width:18px;display:inline;vertical-align:-3px"')} ${esc(p.location)} · ${esc(p.scale)}</p></div></section>
  <div class="container unfold" data-unfold><figure><img src="${esc(p.cover)}" alt="${esc(p.name)}" width="1200" height="900"></figure></div>
  <section class="section"><div class="container detail">
    <div class="prose">
      <p class="lead">${esc(p.summary)}</p>${paras(p.description)}
      <h2>Hạng mục đảm nhận</h2><ul class="items">${p.items.map((i) => `<li>${icon('check')}${esc(i)}</li>`).join('')}</ul>
      ${p.video ? `<h2>Video giới thiệu</h2>${video(p.video)}` : ''}
      <h2>Album hình ảnh (${p.gallery.length})</h2>
    </div>
    <aside><div class="spec"><table><caption>Thông tin công trình</caption><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>
      <div class="acts"><a class="btn btn-primary" href="lien-he.html?ct=${esc(p.slug)}#tu-van">Tư vấn công trình tương tự</a><a class="btn btn-ghost" href="${href('tel', site)}">${icon('phone')} Gọi ${esc(site.hotline || site.phone)}</a></div></div></aside>
    <div class="gallery" style="grid-column:1/-1">${p.gallery.map((g, i) => `<button type="button" data-i="${i}" aria-label="Phóng to ảnh ${i + 1}"><img src="${esc(g)}" alt="${esc(p.name)} – ảnh ${i + 1}" loading="lazy" width="1200" height="900"></button>`).join('')}</div>
  </div></section>
  ${related.length ? `<section class="section alt"><div class="container"><div class="sec-head"><div><span class="eyebrow">Xem thêm</span><h2>Công trình khác</h2></div><a class="link-more" href="cong-trinh.html">Tất cả công trình ${icon('arrow')}</a></div><div class="proj-grid all" data-stagger="rise3d">${related.map(projCard).join('')}</div></div></section>` : ''}
  <dialog class="lightbox" aria-label="Xem ảnh"><div class="lb"><img alt=""><button class="x" type="button" aria-label="Đóng">×</button><button class="pv" type="button" aria-label="Ảnh trước">‹</button><button class="nx" type="button" aria-label="Ảnh sau">›</button><p class="cap"></p></div></dialog>`;
}

export function init({ collections }) {
  const p = cur(collections); if (!p) return;
  const dlg = $('.lightbox'), img = $('img', dlg), cap = $('.cap', dlg); let i = 0;
  const show = (k) => { i = (k + p.gallery.length) % p.gallery.length; img.src = p.gallery[i]; img.alt = `${p.name} – ảnh ${i + 1}`; cap.textContent = `${i + 1} / ${p.gallery.length}`; };
  $$('.gallery button').forEach((b) => b.addEventListener('click', () => { show(+b.dataset.i); dlg.showModal(); }));
  $('.x', dlg).onclick = () => dlg.close(); $('.pv', dlg).onclick = () => show(i - 1); $('.nx', dlg).onclick = () => show(i + 1);
  dlg.addEventListener('click', (e) => { if (e.target.classList.contains('lb')) dlg.close(); });
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); });
}
