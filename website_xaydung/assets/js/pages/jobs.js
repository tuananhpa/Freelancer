/* Tuyển dụng: hero có khối 3D xếp chồng theo cuộn · quyền lợi · danh sách vị trí (lọc đang tuyển/tất cả) */
import { $, $$, esc, icon, pageHero, href, onScrub, reduce } from '../main.js';
import { jobRow } from './index.js';

const CUBES = [[0, 0, 0, '#C84B0E'], [70, 0, 0, '#F27A36'], [140, 0, 0, '#C84B0E'], [0, 70, 0, '#F27A36'], [70, 70, 0, '#FFC233'], [140, 70, 0, '#5B9BFF'],
  [0, 0, 70, '#F27A36'], [70, 0, 70, '#5B9BFF'], [0, 70, 70, '#C84B0E'], [0, 0, 140, '#FFC233']];

export function render({ docs, collections }) {
  const pg = docs.pages.jobs, site = docs.site, jobs = collections.jobs, open = jobs.filter((j) => j.status === 'open');
  const art = `<div class="jobs-hero-art" aria-hidden="true"><div class="iso">${CUBES.map(([x, y, z, c], i) => `<div class="cube" style="--x:${x}px;--y:${y}px;--z:${z}px;--c:${c}" data-i="${i}"><i class="t"></i><i class="s1"></i><i class="s2"></i></div>`).join('')}</div></div>`;
  return pageHero(pg, ['Tuyển dụng']).replace('</section>', art + '</section>') + `
  <section class="section grid-paper"><div class="container">
    <div class="sec-head"><div><span class="eyebrow">Vì sao làm việc tại ${esc(site.name)}</span><h2>Quyền lợi dành cho bạn</h2></div></div>
    <div class="perks" data-stagger="flip">${pg.perks.map((p) => `<div class="perk"><span class="ico">${icon(p.icon)}</span><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div>`).join('')}</div>
  </div></section>
  <section class="section alt" id="vi-tri"><div class="container">
    <div class="sec-head"><div><span class="eyebrow">Vị trí tuyển dụng</span><h2>${open.length} vị trí đang tuyển</h2><p class="lead">Nhấn vào vị trí để xem mô tả công việc và nộp hồ sơ trực tuyến.</p></div>
      <div class="filters" role="group" aria-label="Lọc vị trí" style="margin:0"><button class="chip-btn" type="button" data-f="open" aria-pressed="true">Đang tuyển</button><button class="chip-btn" type="button" data-f="" aria-pressed="false">Tất cả</button></div></div>
    <div class="job-list" id="jobList" data-stagger="flip">${jobs.map((j) => jobRow(j).replace('<a class="job"', `<a class="job" data-status="${j.status}"${j.status === 'open' ? '' : ' hidden'}`)).join('')}</div>
    ${open.length ? '' : '<p class="empty">Hiện chưa có vị trí đang tuyển. Bạn vẫn có thể gửi hồ sơ để chúng tôi liên hệ khi có nhu cầu.</p>'}
    <div class="area-note" style="margin-top:28px">${icon('phone')}<span><b>Liên hệ tuyển dụng:</b> <a href="${href('tel', { phone: site.recruitPhone })}">${esc(site.recruitPhone)}</a> · Zalo cùng số · Email <a href="mailto:${esc(site.recruitEmail)}">${esc(site.recruitEmail)}</a></span></div>
  </div></section>`;
}

export function init() {
  $('.filters')?.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    $$('.filters button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $$('#jobList .job').forEach((j) => { j.hidden = !!b.dataset.f && j.dataset.status !== b.dataset.f; });
  });
  const cubes = $$('.cube'); if (!cubes.length) return;
  const set = (p) => cubes.forEach((c, i) => c.style.setProperty('--k', Math.min(1, Math.max(0, p * 1.6 * cubes.length - i)).toFixed(3)));
  if (reduce) return set(1);
  // khối rơi lần lượt khi mở trang, rồi tách ra khi cuộn hero đi
  let t0 = performance.now(); const intro = (t) => { const p = Math.min(1, (t - t0) / 1800); set(p); if (p < 1) requestAnimationFrame(intro); }; requestAnimationFrame(intro);
  onScrub($('.page-hero'), (p) => { if (performance.now() - t0 > 1800) set(1 - p * 0.9); });
}
