/* Danh sách công trình: vòng quay 3D công trình tiêu biểu theo cuộn + lưới lọc theo nhóm/trạng thái */
import { $, $$, esc, icon, pageHero, onScrub, reduce } from '../main.js';

export const projCard = (p) => `<a class="proj-card" data-tilt="0.5" href="cong-trinh-chi-tiet.html?ct=${esc(p.slug)}" data-cat="${esc(p.category)}" data-status="${esc(p.status)}">
  <img src="${esc(p.cover)}" alt="${esc(p.name)}" width="1200" height="900" loading="lazy"><span class="go" aria-hidden="true">${icon('arrow')}</span>
  <div class="info"><span class="tag">${esc(p.category)} <i class="${p.status === 'ongoing' ? 'ongoing' : ''}">${p.status === 'ongoing' ? 'Đang thi công' : 'Hoàn thành'}</i></span>
    <h3>${esc(p.name)}</h3><span class="loc">${icon('pin')}${esc(p.location)}</span></div></a>`;

export function render({ docs, collections }) {
  const list = collections.projects, feat = list.filter((p) => p.featured);
  const cats = docs.site.projectCategories.filter((c) => list.some((p) => p.category === c));
  return pageHero(docs.pages.projects, ['Công trình']) + (feat.length > 2 ? `
  <section class="ring-sec blueprint" aria-label="Công trình tiêu biểu"><div class="ring-stage">
    <div class="container"><span class="eyebrow">Công trình tiêu biểu</span><h2 style="color:#fff;margin:0">Cuộn để xoay qua từng công trình</h2></div>
    <div class="ring-view" aria-hidden="true"><div class="ring">${feat.map((p) => `<div class="ring-item"><img src="${esc(p.cover)}" alt="" width="1200" height="900"></div>`).join('')}</div></div>
    <div class="container ring-info" aria-live="polite"></div>
  </div></section>` : '') + `
  <section class="section" id="danh-sach"><div class="container">
    <div class="sec-head"><div><span class="eyebrow">Tất cả công trình</span><h2>${list.length} công trình đã và đang thực hiện</h2></div></div>
    <div class="filters" role="group" aria-label="Lọc theo nhóm"><button class="chip-btn" type="button" data-cat="" aria-pressed="true">Tất cả <small>${list.length}</small></button>${cats.map((c) => `<button class="chip-btn" type="button" data-cat="${esc(c)}" aria-pressed="false">${esc(c)} <small>${list.filter((p) => p.category === c).length}</small></button>`).join('')}</div>
    <div class="filters" role="group" aria-label="Lọc theo trạng thái">${[['', 'Mọi trạng thái'], ['done', 'Đã hoàn thành'], ['ongoing', 'Đang triển khai']].map(([v, l], i) => `<button class="chip-btn" type="button" data-status="${v}" aria-pressed="${!i}">${l}</button>`).join('')}</div>
    <div class="proj-grid all" id="projGrid">${list.map(projCard).join('')}</div>
    <p class="empty" id="projEmpty" hidden>Chưa có công trình phù hợp bộ lọc.</p>
  </div></section>`;
}

export function init({ collections }) {
  const grid = $('#projGrid'), f = { cat: '', status: '' };
  $$('.filters').forEach((g) => g.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const key = 'cat' in b.dataset ? 'cat' : 'status'; f[key] = b.dataset[key];
    $$('button', g).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    let n = 0; $$('.proj-card', grid).forEach((c) => { const show = (!f.cat || c.dataset.cat === f.cat) && (!f.status || c.dataset.status === f.status); c.hidden = !show; n += show; });
    $('#projEmpty').hidden = n > 0;
  }));
  const sec = $('.ring-sec'); if (!sec) return;
  const feat = collections.projects.filter((p) => p.featured), N = feat.length, step = 360 / N;
  const ring = $('.ring', sec), items = $$('.ring-item', sec), info = $('.ring-info', sec);
  let front = -1;
  const show = (i) => { if (i === front) return; front = i; const p = feat[i];
    items.forEach((el, k) => el.classList.toggle('front', k === i));
    info.innerHTML = `<span class="eyebrow">${esc(p.category)} · ${esc(p.location)}</span><h3>${esc(p.name)}</h3><p>${esc(p.summary)}</p><a class="btn btn-primary btn-sm" href="cong-trinh-chi-tiet.html?ct=${esc(p.slug)}">Xem chi tiết ${icon('arrow', 'arr')}</a>`; };
  const layout = () => {
    const w = Math.min(440, innerWidth * 0.62); const R = (w / 2) / Math.tan(Math.PI / N) * 1.12;
    sec.style.setProperty('--w', w + 'px'); ring.dataset.r = R;
    items.forEach((el, i) => { el.style.transform = `rotateY(${i * step}deg) translateZ(${R}px)`; });
  };
  layout(); addEventListener('resize', layout);
  if (reduce) { sec.style.height = 'auto'; show(0); return; }
  onScrub(sec, (p) => {
    const rot = p * step * (N - 1);
    ring.style.transform = `translateZ(${-ring.dataset.r}px) rotateY(${-rot}deg)`;
    show(Math.round(rot / step) % N);
  }, 'pin');
}
