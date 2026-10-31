/* Chatbot theo kịch bản (bản cơ bản theo đề xuất). Nội dung sửa trong quản trị > Chatbot.
   shortcut: khớp từ khoá không dấu, không hiểu câu tự nhiên; nâng cấp bằng chatbot AI khi doanh nghiệp cần. */
import { icon } from './icons.js';

const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
/** Trả về lựa chọn có nhiều từ khoá trùng nhất với câu gõ, hoặc null */
export function match(text, options) {
  const t = ` ${fold(text).replace(/[^a-z0-9]+/g, ' ')} `; let best = null, score = 0;   // khớp nguyên từ: "tho" không khớp "thoi tiet"
  for (const o of options) {
    const n = String(o.keywords || '').split(',').map((k) => fold(k).trim()).filter((k) => k && t.includes(` ${k} `)).length;
    if (n > score) { best = o; score = n; }
  }
  return best;
}

export function mountChatbot(cb, site) {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fill = (s) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => site[k] ?? '');
  const tel = 'tel:+84' + String(site.hotline || site.phone).replace(/\D/g, '').replace(/^0/, '');
  const link = (h) => ({ tel, zalo: 'https://zalo.me/' + String(site.zalo).replace(/\D/g, ''), facebook: site.facebook }[h] || h);

  document.body.insertAdjacentHTML('beforeend', `
    <button class="cb-launch" type="button" aria-label="Mở hỗ trợ trực tuyến" aria-expanded="false" aria-controls="cbPanel">${icon('chat')}<span class="dot"></span></button>
    <section class="cb-panel" id="cbPanel" role="dialog" aria-label="${esc(cb.name)}" hidden>
      <div class="cb-head"><span class="av">${icon('hardhat')}</span><div><b>${esc(cb.name)}</b><small>● Trả lời tự động</small></div><button type="button" aria-label="Đóng">×</button></div>
      <div class="cb-body" aria-live="polite"></div>
      <form class="cb-form"><input aria-label="Nhập câu hỏi" placeholder="Nhập câu hỏi…" autocomplete="off"><button aria-label="Gửi">${icon('send')}</button></form>
      <p class="cb-note">Trợ lý trả lời theo kịch bản có sẵn.</p>
    </section>`);
  const btn = document.querySelector('.cb-launch'), panel = document.getElementById('cbPanel'), body = panel.querySelector('.cb-body');
  const say = (html, who = 'bot') => { body.insertAdjacentHTML('beforeend', `<div class="cb-msg ${who}">${html}</div>`); body.scrollTop = body.scrollHeight; };
  const menu = () => { body.insertAdjacentHTML('beforeend', `<div class="cb-opts">${cb.options.map((o, i) => `<button type="button" data-i="${i}">${esc(o.label)}</button>`).join('')}</div>`); body.scrollTop = body.scrollHeight; };
  const answer = (o) => {
    say(esc(fill(o.answer)) + (o.links?.length ? `<div class="cb-links">${o.links.map((l) => `<a href="${esc(link(l.href))}"${/^https?:/.test(link(l.href)) ? ' target="_blank" rel="noopener"' : ''}>${esc(l.label)}</a>`).join('')}</div>` : ''));
    menu();
  };
  let started = false;
  const toggle = (v) => {
    panel.hidden = !v; btn.setAttribute('aria-expanded', String(v)); btn.querySelector('.dot')?.remove();
    if (v && !started) { started = true; say(esc(fill(cb.greeting))); menu(); }
    if (v) panel.querySelector('input').focus();
  };
  btn.addEventListener('click', () => toggle(panel.hidden));
  panel.querySelector('.cb-head button').addEventListener('click', () => { toggle(false); btn.focus(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { toggle(false); btn.focus(); } });
  body.addEventListener('click', (e) => {
    const b = e.target.closest('.cb-opts button'); if (!b) return;
    const o = cb.options[+b.dataset.i]; say(esc(o.label), 'me'); answer(o);
  });
  panel.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault(); const inp = e.target.querySelector('input'); const t = inp.value.trim(); if (!t) return;
    say(esc(t), 'me'); inp.value = '';
    const o = match(t, cb.options);
    if (o) answer(o); else { say(esc(fill(cb.fallback))); menu(); }
  });
}
