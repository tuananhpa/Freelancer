/* Giới thiệu: câu chuyện · dòng thời gian 3D (đường hầm theo cuộn) · lĩnh vực & khu vực · đội ngũ · chứng chỉ & đối tác */
import { $, $$, esc, icon, paras, pageHero, onScrub, reduce } from '../main.js';

export function render({ docs, collections: c }) {
  const a = docs.pages.about, home = docs.home, ms = c.milestones;
  return pageHero(a, ['Giới thiệu']) + `
  <section class="section grid-paper"><div class="container split">
    <div data-reveal="up"><span class="eyebrow">Về ${esc(docs.site.name)}</span><h2>${esc(a.storyTitle)}</h2>${paras(a.story)}
      <ul class="fields">${home.intro.fields.map((f) => `<li>${icon('check')}${esc(f)}</li>`).join('')}</ul></div>
    <div class="collage tilt-wrap" data-tilt="0.6" data-reveal="rise3d">
      <div class="c1"><img src="${esc(home.intro.image1)}" alt="Kỹ sư làm việc tại công trường" width="1200" height="900" loading="lazy"></div>
      <div class="c2"><img src="assets/img/photos/team-workers.webp" alt="Đội thi công" width="1200" height="800" loading="lazy"></div>
      <div class="badge"><b>${esc(home.intro.badgeValue)}</b><span>${esc(home.intro.badgeLabel)}</span></div></div>
  </div></section>
  <section class="section"><div class="container"><p class="statement" data-words>${esc(a.statement)}</p></div></section>
  ${ms.length ? `<section class="tunnel blueprint" style="height:${(ms.length + 1) * 75}vh" aria-label="Mốc phát triển"><div class="tunnel-stage">
    <div class="tunnel-head container"><span class="eyebrow">Hành trình phát triển</span><h2 style="color:#fff;margin:0">Những cột mốc đáng nhớ</h2></div>
    ${ms.map((m) => `<div class="tunnel-item"><div class="tunnel-card"><div class="yr">${esc(m.year)}</div><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p></div></div>`).join('')}
    <div class="tunnel-progress container"><ol>${ms.map((m) => `<li>${esc(m.year)}</li>`).join('')}</ol></div>
  </div></section>` : ''}
  <section class="section why"><div class="why-bg" data-parallax="0.1"><img src="${esc(home.capability.image)}" alt="" loading="lazy" width="1600" height="900"></div><div class="container on-dark">
    <div class="sec-head"><div><span class="eyebrow">Năng lực & thế mạnh</span><h2 style="color:#fff">${esc(home.capability.title)}</h2></div></div>
    <div class="stats" data-stagger>${home.stats.map((s) => `<div class="stat"><b><span data-count="${+s.value}">${+s.value}</span><sup>${esc(s.suffix)}</sup></b><span>${esc(s.label)}</span></div>`).join('')}</div>
    <div class="grid c3" data-stagger="flip">${home.capability.strengths.map((s) => `<div class="feature"><span class="ico">${icon(s.icon)}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join('')}</div>
  </div></section>
  <section class="section"><div class="container">
    <div class="sec-head"><div><span class="eyebrow">Đội ngũ</span><h2>Con người phía sau mỗi công trình</h2><p class="lead">Kỹ sư, kiến trúc sư và đội thi công lành nghề phối hợp trong một quy trình thống nhất.</p></div></div>
    <div class="grid c3" data-stagger="rise3d">${c.team.map((t) => `<div class="team-card" data-tilt="0.6"><img src="${esc(t.image)}" alt="${esc(t.title)}" width="1200" height="800" loading="lazy"><div class="info"><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p></div></div>`).join('')}</div>
  </div></section>
  <section class="section alt grid-paper"><div class="container split" style="align-items:start">
    <div><span class="eyebrow">${esc(a.areasTitle)}</span><h2>Nhận thi công tại</h2><ul class="fields">${a.areas.map((x) => `<li>${icon('pin')}${esc(x)}</li>`).join('')}</ul></div>
    <div><span class="eyebrow">Hồ sơ năng lực</span><h2>Chứng chỉ & giấy phép</h2><div class="grid" data-stagger>${c.certs.map((k) => `<div class="cert"><span class="ico">${icon(k.icon)}</span><span><b>${esc(k.title)}</b><small>${esc(k.text)}</small></span></div>`).join('')}</div></div>
  </div>
  ${c.partners.length ? `<div class="container" style="margin-top:56px"><span class="eyebrow">Đối tác & nhà cung cấp</span></div><div class="marquee"><div class="marquee-track">${c.partners.map((p) => p.image ? `<span><img src="${esc(p.image)}" alt="${esc(p.name)}" style="height:40px;width:auto"></span>` : `<span>${esc(p.name)}</span>`).join('')}</div></div>` : ''}
  </section>`;
}

export function init() {
  const sec = $('.tunnel'); if (!sec || reduce) return;
  const items = $$('.tunnel-item', sec), marks = $$('.tunnel-progress li', sec), n = items.length, gap = 1100;
  onScrub(sec, (p) => {
    const at = p * (n - 1) * 1.08;                          // vượt nhẹ để thẻ cuối kịp lướt qua
    items.forEach((el, i) => {
      const z = (at - i) * gap, side = i % 2 ? 1 : -1;
      const x = side * Math.min(1, Math.max(0, -z / 1800)) * Math.min(340, innerWidth * 0.28);
      const o = z > 0 ? 1 - z / 500 : 1 + z / (innerWidth < 700 ? 900 : 3200);   // màn hẹp: thẻ sau mờ nhanh, không chồng chữ
      el.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${(-x / 40).toFixed(1)}deg)`;
      el.style.opacity = Math.max(0, Math.min(1, o)).toFixed(3);
      el.style.visibility = o <= 0 ? 'hidden' : 'visible';
    });
    marks.forEach((m, i) => m.classList.toggle('on', i <= Math.round(at)));
  }, 'pin');
}
