/* Dịch vụ: thẻ dính xếp chồng – thẻ phía dưới đè lên, thẻ trước lùi vào chiều sâu (3D) */
import { $$, esc, icon, pageHero, href, onScrub, reduce } from '../main.js';

export function render({ docs, collections }) {
  const site = docs.site;
  return pageHero(docs.pages.services, ['Dịch vụ']) + `
  <section class="section alt grid-paper"><div class="container">
    <div class="sec-head"><div><span class="eyebrow">${collections.services.length} nhóm dịch vụ</span><h2>Chọn đúng dịch vụ cho công trình của bạn</h2><p class="lead">Danh sách dịch vụ được điều chỉnh theo hoạt động thực tế của doanh nghiệp.</p></div></div>
    <div class="stack">${collections.services.map((s, i) => `<article class="stack-card" id="${esc(s.slug)}" style="--i:${i}">
      <div class="media"><img src="${esc(s.image)}" alt="${esc(s.name)}" width="1200" height="900" loading="${i ? 'lazy' : 'eager'}"><span class="num">${String(i + 1).padStart(2, '0')}</span></div>
      <div class="body"><span class="eyebrow">${icon(s.icon).replace('<svg', '<svg style="width:18px"')} Dịch vụ</span><h2>${esc(s.name)}</h2><p class="lead" style="margin:0">${esc(s.description || s.summary)}</p>
        <ul class="scope">${(s.scope || []).map((x) => `<li>${icon('check')}${esc(x)}</li>`).join('')}</ul>
        <div class="acts"><a class="btn btn-primary" href="lien-he.html?dv=${esc(s.slug)}#tu-van">Nhận tư vấn ${icon('arrow', 'arr')}</a><a class="btn btn-ghost" href="${href('tel', site)}">${icon('phone')} Gọi ngay</a></div></div>
    </article>`).join('')}</div>
  </div></section>`;
}

export function init() {
  const cards = $$('.stack-card'); if (reduce || cards.length < 2) return;
  onScrub(cards[0].parentElement, () => {
    const vh = innerHeight;
    cards.forEach((c, i) => {
      const next = cards[i + 1]; if (!next) return;
      const q = Math.min(1, Math.max(0, 1 - (next.getBoundingClientRect().top - c.getBoundingClientRect().top) / (vh * 0.85)));
      c.style.transform = `perspective(1400px) translateZ(${(-q * 120).toFixed(1)}px) rotateX(${(q * 6).toFixed(2)}deg)`;
      c.style.setProperty('--dim', (q * 0.45).toFixed(3));
    });
  });
}
