// Phát thanh nội bộ — app shell + pages (vanilla JS, no build step). Timeline editor lives in studio.js.
import { mountStudio } from './studio.js';

export const $ = (s, el = document) => el.querySelector(s);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const fmt = (s, dec = 0) => { s = Math.max(0, s || 0); const m = Math.floor(s / 60), x = s - m * 60; return `${String(m).padStart(2, '0')}:${x.toFixed(dec).padStart(dec ? 3 + dec : 2, '0')}`; };
const view = $('#view');

const ICONS = {
  list: 'M4 6h16M4 12h16M4 18h10', script: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7', studio: 'M3 7h18M3 12h18M3 17h18M7 5v4M15 10v4M11 15v4',
  export: 'M12 3v12m0 0-4-4m4 4 4-4M5 21h14', music: 'M9 18V6l11-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm11-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  dict: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm0 14a2 2 0 0 1 2-2h13', mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3Zm-7 9a7 7 0 0 0 14 0M12 19v3',
  play: 'M7 4l13 8-13 8z', pause: 'M7 4h4v16H7zM14 4h4v16h-4z', back: 'M19 12H5m6-6-6 6 6 6', start: 'M6 5v14M19 5 9 12l10 7z',
  undo: 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3', redo: 'M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3', split: 'M12 3v18M6 8l-3 4 3 4M18 8l3 4-3 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3', plus: 'M12 5v14M5 12h14', sync: 'M20 11a8 8 0 0 0-14.9-4M4 4v4h4M4 13a8 8 0 0 0 14.9 4M20 20v-4h-4',
  upload: 'M12 16V4m0 0-4 4m4-4 4 4M5 20h14', stop: 'M6 6h12v12H6z', check: 'M5 12l5 5 9-10', magnet: 'M6 3v8a6 6 0 0 0 12 0V3M6 7h4M14 7h4',
};
export const icon = (n, size) => `<svg viewBox="0 0 24 24" ${size ? `width="${size}" height="${size}"` : ''} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[n]}"/></svg>`;

export async function api(path, opts = {}) {
  const init = { ...opts };
  if (opts.json !== undefined) { init.body = JSON.stringify(opts.json); init.headers = { 'Content-Type': 'application/json' }; init.method ||= 'POST'; }
  const r = await fetch('/api/' + path, init);
  if (!r.ok) { let m = r.statusText; try { m = (await r.json()).error || m; } catch {} throw new Error(m); }
  return r.headers.get('content-type')?.includes('json') ? r.json() : r.blob();
}
export function toast(msg, err) {
  const t = $('#toast'); t.textContent = msg; t.className = 'show' + (err ? ' err' : '');
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.className = ''), err ? 6000 : 2600);
}
export async function busy(btn, fn) {
  btn?.classList.add('busy');
  try { return await fn(); } catch (e) { toast(e.message, true); } finally { btn?.classList.remove('busy'); }
}
export const modal = {
  open(html) { $('#modalBody').innerHTML = html; if (!$('#modal').open) $('#modal').showModal(); return $('#modalBody'); },
  close() { $('#modal').close(); },
};
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) modal.close(); });
export const waitJob = async (job, onTick) => {
  while (job.status === 'running') { onTick?.(job); await new Promise(r => setTimeout(r, 900)); job = await api('jobs/' + job.id); }
  if (job.status === 'error') throw new Error(job.error);
  return job;
};

let status = { voices: [], vieneu: 'off' };
export let assets = [];
export const reloadAssets = async () => (assets = await api('assets'));

async function refreshStatus() {
  try { status = await api('status'); } catch { return; }
  const s = status.vieneu, e = $('#engine');
  e.className = 'engine ' + (s === 'ready' ? 'ok' : s === 'loading' ? '' : 'bad');
  e.innerHTML = `<span>${s === 'ready' ? 'Giọng offline sẵn sàng' : s === 'loading' ? 'Đang nạp giọng offline' : 'Chưa có giọng offline, dùng giọng online'}</span>`;
  e.title = e.textContent;
  if (s === 'loading') setTimeout(refreshStatus, 4000);
}
const voiceLabel = v => `${v.name} (${v.gender.toLowerCase()}, miền ${v.region}, ${v.style.toLowerCase()})`;
function voiceOptions(selected, allowDefault) {
  const groups = {};
  for (const v of status.voices) (groups[v.provider] ||= []).push(v);
  let html = allowDefault ? '<option value="">Theo giọng mặc định</option>' : '';
  for (const [g, list] of Object.entries(groups))
    html += `<optgroup label="${esc(g)}">` + list.map(v => `<option value="${esc(v.id)}" ${v.id === selected ? 'selected' : ''} ${v.disabled ? 'disabled' : ''}>${esc(voiceLabel(v))}</option>`).join('') + '</optgroup>';
  return html;
}
const assetOptions = (sel, kind = 'music') => '<option value="">Chưa chọn file</option>' + assets.filter(a => !kind || (a.kind || 'music') === kind || a.id === sel).map(a => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${esc(a.name)}</option>`).join('');

export function pickFile(accept, multiple) {
  return new Promise(res => { const i = Object.assign(document.createElement('input'), { type: 'file', accept, multiple }); i.onchange = () => res([...i.files]); i.click(); });
}
export async function uploadMp3(file) {
  if (!/\.mp3$/i.test(file.name)) throw new Error(`"${file.name}" không phải file .mp3`);
  const a = await api('assets?name=' + encodeURIComponent(file.name), { method: 'POST', body: file });
  assets.unshift(a);
  return a;
}

// ---------------- recorder (microphone -> asset kind "rec")
export function recordDialog() {
  return new Promise(resolve => {
    let rec, stream, chunks = [], t0, timer, ctx, raf, result = null;
    const body = modal.open(`<h2>Ghi âm</h2>
      <p class="muted">Bản ghi được lưu vào thư viện (mục Ghi âm) và đặt vào track Lời đọc.</p>
      <div class="rec-meter"><canvas width="600" height="56"></canvas></div>
      <p class="rec-time num" id="rt">00:00</p>
      <div class="row" style="justify-content:center">
        <button class="btn primary" id="go">${icon('mic')}Bắt đầu ghi</button>
        <button class="btn" id="stop" hidden>${icon('stop')}Dừng</button></div>
      <div id="rv" style="margin-top:12px"></div>
      <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Đóng</button><button class="btn primary" id="use" disabled>${icon('check')}Lưu bản ghi</button></div>`);
    const cv = $('canvas', body), g = cv.getContext('2d');
    const cleanup = () => { cancelAnimationFrame(raf); clearInterval(timer); stream?.getTracks().forEach(t => t.stop()); ctx?.close(); };
    $('#modal').addEventListener('close', () => { cleanup(); resolve(result); }, { once: true });
    $('#go', body).onclick = async () => {
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
      catch { return toast('Không mở được micro. Kiểm tra quyền micro của máy (trên điện thoại cần HTTPS).', true); }
      ctx = new AudioContext(); const an = ctx.createAnalyser(); an.fftSize = 1024; ctx.createMediaStreamSource(stream).connect(an);
      const data = new Uint8Array(an.fftSize); let x = 0;
      g.fillStyle = '#161f0f'; g.fillRect(0, 0, cv.width, cv.height);
      const draw = () => { an.getByteTimeDomainData(data); let m = 0; for (const v of data) m = Math.max(m, Math.abs(v - 128)); const h = Math.max(2, (m / 128) * cv.height);
        g.fillStyle = '#c7684f'; g.fillRect(x, (cv.height - h) / 2, 2, h); x = (x + 3) % cv.width; g.fillStyle = '#161f0f'; g.fillRect(x, 0, 3, cv.height); raf = requestAnimationFrame(draw); };
      draw();
      rec = new MediaRecorder(stream); chunks = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => { const blob = new Blob(chunks, { type: rec.mimeType }); $('#rv', body).innerHTML = `<audio controls src="${URL.createObjectURL(blob)}" style="width:100%"></audio>`; $('#use', body).disabled = false; $('#use', body).blob = blob; };
      rec.start(); t0 = Date.now(); timer = setInterval(() => ($('#rt', body).innerHTML = `<span class="rec-dot"></span> ${fmt((Date.now() - t0) / 1000)}`), 250);
      $('#go', body).hidden = true; $('#stop', body).hidden = false;
    };
    $('#stop', body).onclick = () => { rec?.stop(); cleanup(); $('#stop', body).hidden = true; $('#go', body).hidden = false; $('#go', body).innerHTML = icon('mic') + 'Ghi lại'; };
    $('#use', body).onclick = e => busy(e.currentTarget, async () => {
      const name = `Ghi âm ${new Date().toLocaleString('vi-VN').replace(/[/:]/g, '-')}.webm`;
      result = await api(`assets?kind=rec&name=${encodeURIComponent(name)}`, { method: 'POST', body: e.currentTarget.blob });
      assets.unshift(result); toast('Đã lưu bản ghi âm'); modal.close();
    });
  });
}

// ---------------- shell: burger menu + nav
const mq = matchMedia('(max-width: 860px)');
function setNav(open) {
  if (mq.matches) { document.body.classList.toggle('nav-open', open); $('#scrim').hidden = !open; }
  else { document.body.classList.toggle('nav-mini', !open); localStorage.navMini = open ? '' : '1'; }
  $('#burger').setAttribute('aria-expanded', String(open));
}
const navOpen = () => (mq.matches ? document.body.classList.contains('nav-open') : !document.body.classList.contains('nav-mini'));
$('#burger').onclick = () => setNav(!navOpen());
$('#scrim').onclick = () => setNav(false);
if (localStorage.navMini) document.body.classList.add('nav-mini');
mq.addEventListener('change', () => { document.body.classList.remove('nav-open'); $('#scrim').hidden = true; });

let P = null; // open project
function drawNav(name, sub) {
  const on = (n, s) => (name === n && (s === undefined || s === sub) ? 'on' : '');
  const link = (href, ic, label, cls) => `<a href="${href}" class="${cls}" ${cls ? 'aria-current="page"' : ''}>${icon(ic)}<span>${label}</span></a>`;
  $('#navLinks').innerHTML = link('#/', 'list', 'Chương trình', on('home')) +
    (P && name === 'p' ? `<div class="nav-group" title="${esc(P.title)}">${esc(P.title)}</div>` +
      link(`#/p/${P.id}`, 'script', 'Kịch bản', on('p', '')) + link(`#/p/${P.id}/studio`, 'studio', 'Dựng âm thanh', on('p', 'studio')) + link(`#/p/${P.id}/export`, 'export', 'Xuất file', on('p', 'export')) : '') +
    '<div class="nav-group">Dùng chung</div>' + link('#/library', 'music', 'Thư viện âm thanh', on('library')) + link('#/dict', 'dict', 'Từ điển phát âm', on('dict'));
  $('#navLinks').title = '';
}
function crumbs(parts, actions = '') {
  $('#crumbs').innerHTML = parts.map((p, i) => i < parts.length - 1 ? `<a href="${p[1]}">${esc(p[0])}</a><span class="sep">/</span>` : `<span class="cur">${esc(p[0])}</span>`).join('');
  $('#barAct').innerHTML = actions;
}

let unmount = null;
async function route() {
  const [, name = 'home', id, sub = ''] = location.hash.replace(/^#/, '').split('/');
  unmount?.(); unmount = null;
  if (mq.matches) setNav(false);
  if (name === 'p') { if (P?.id !== id) { clearTimeout(saveT); P = await api('projects/' + id).catch(e => (toast(e.message, true), null)); } } else P = null;
  drawNav(name, sub);
  view.innerHTML = '';
  try {
    if (name === 'p' && P) await ({ '': renderScript, studio: renderStudio, export: renderExport }[sub] || renderScript)();
    else ({ library: renderLibrary, dict: renderDict }[name] || renderHome)();
  } catch (e) { view.innerHTML = `<p class="empty">${esc(e.message)}</p>`; }
  view.focus({ preventScroll: true });
}
addEventListener('hashchange', route);

// ---------------- project save (debounced)
let saveT;
export function save() {
  clearTimeout(saveT);
  const s = $('#saved'); if (s) s.textContent = 'Đang lưu…';
  saveT = setTimeout(flush, 500);
}
export async function flush() {
  clearTimeout(saveT);
  if (!P) return;
  try { await api('projects/' + P.id, { method: 'PUT', json: P }); const s = $('#saved'); if (s) s.textContent = 'Đã lưu'; }
  catch (e) { toast('Không lưu được: ' + e.message, true); }
}
export async function reloadProject() { P = await api('projects/' + P.id); return P; }

// ---------------- home
async function renderHome() {
  crumbs([['Chương trình']]);
  const list = await api('projects');
  view.innerHTML = `<div class="page">
    <h1>Chương trình phát thanh</h1>
    <p class="lead">Nạp kịch bản Word, duyệt từng đoạn, dựng âm thanh trên timeline rồi xuất file MP3 hoặc MP4.</p>
    <div class="panel">
      <div class="drop" id="drop" tabindex="0" role="button" aria-label="Chọn file kịch bản Word">
        ${icon('upload', 28)}<b>Chọn hoặc kéo thả file kịch bản Word</b>
        <span class="muted">Nhận .doc và .docx. Mỗi mục 1, 2, 3 trong phần nội dung thành một đoạn lời đọc.</span></div>
      <div class="row" style="margin-top:12px"><span class="muted grow">Viết dòng [NHẠC: tên bài] hoặc [NHẠC HIỆU] trong file Word để có sẵn chỗ chèn nhạc.</span>
        <button class="btn" id="blank">${icon('plus')}Tạo chương trình trống</button></div>
    </div>
    <h2 style="margin-top:28px">Đã lưu</h2>
    <div class="plist">${list.length ? list.map(p => `
      <div class="pitem">
        <div class="grow"><a class="t" href="#/p/${p.id}">${esc(p.title)}</a>
          <div class="muted">Sửa lúc ${new Date(p.updatedAt).toLocaleString('vi-VN')}</div></div>
        <span class="tag ${p.approved === p.voices && p.voices ? 'ok' : 'wait'}">Đã duyệt ${p.approved}/${p.voices} đoạn</span>
        <a class="btn sm" href="#/p/${p.id}/studio">${icon('studio')}Dựng</a>
        <button class="btn sm ghost danger" data-del="${p.id}" aria-label="Xóa ${esc(p.title)}">${icon('trash')}</button>
      </div>`).join('') : '<p class="empty">Chưa có chương trình. Nạp file Word ở trên để bắt đầu.</p>'}</div></div>`;
  const drop = $('#drop');
  const doImport = file => busy(drop, async () => {
    if (!/\.docx?$/i.test(file.name)) throw new Error('Chỉ nhận file Word .doc hoặc .docx');
    $('b', drop).textContent = 'Đang đọc ' + file.name;
    const p = await api('import?name=' + encodeURIComponent(file.name), { method: 'POST', body: file });
    toast(`Đã tách ${p.blocks.filter(b => b.type === 'voice').length} đoạn lời đọc`);
    location.hash = '#/p/' + p.id;
  });
  drop.onclick = async () => { const [f] = await pickFile('.doc,.docx'); if (f) doImport(f); };
  drop.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); drop.click(); } };
  drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) doImport(f); };
  $('#blank').onclick = e => busy(e.currentTarget, async () => { const p = await api('projects', { json: { title: 'Chương trình mới' } }); location.hash = '#/p/' + p.id; });
  view.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    if (!confirm('Xóa chương trình này? Không khôi phục được.')) return;
    await busy(b, () => api('projects/' + b.dataset.del, { method: 'DELETE' })); renderHome();
  });
}

// ---------------- script (segments)
const uid = () => 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const newVoice = () => ({ id: uid(), type: 'voice', title: 'Lời đọc', text: '', voice: '', rate: 1, volume: 1, approved: false });
const newMusic = () => ({ id: uid(), type: 'song', title: 'Ca khúc', assetId: null, volume: 1 });

async function renderScript() {
  await reloadAssets();
  P.bg ||= { assetId: null, volume: 0.15 };
  crumbs([['Chương trình', '#/'], [P.title]], `<span class="muted" id="saved">Đã lưu</span>`);
  view.innerHTML = `<div class="page">
    <input class="title-in" id="title" value="${esc(P.title)}" aria-label="Tên chương trình">
    <div class="panel proj-head" style="margin-top:10px">
      <label class="f">Giọng đọc mặc định<select id="defVoice">${voiceOptions(P.defaultVoice)}</select></label>
      <div class="f"><label class="f" for="bgSel">Nhạc nền dưới lời đọc</label>
        <div class="row"><select id="bgSel" class="grow">${assetOptions(P.bg.assetId)}</select><button class="btn sm" id="bgUp">${icon('upload')}Tải mp3</button></div>
        <label class="muted">Âm lượng nhạc nền <b id="bgVolV" class="num">${Math.round(P.bg.volume * 100)}%</b><input type="range" id="bgVol" min="0" max="0.6" step="0.01" value="${P.bg.volume}"></label></div>
    </div>
    <div id="blocks" style="margin-top:14px"></div></div>
    <div class="dock"><div class="in"><span class="muted grow" id="sum"></span>
      <button class="btn" id="approveAll">${icon('check')}Duyệt tất cả</button>
      <a class="btn primary" href="#/p/${P.id}/studio">${icon('studio')}Dựng âm thanh</a></div></div>`;
  $('#title').oninput = e => { P.title = e.target.value; save(); };
  $('#defVoice').onchange = e => { P.defaultVoice = e.target.value; save(); };
  $('#bgSel').onchange = e => { P.bg.assetId = e.target.value || null; save(); };
  $('#bgVol').oninput = e => { P.bg.volume = +e.target.value; $('#bgVolV').textContent = Math.round(P.bg.volume * 100) + '%'; save(); };
  $('#bgUp').onclick = e => busy(e.currentTarget, async () => { const [f] = await pickFile('.mp3,audio/mpeg'); if (!f) return; const a = await uploadMp3(f); P.bg.assetId = a.id; $('#bgSel').innerHTML = assetOptions(a.id); save(); toast('Đã thêm nhạc nền'); });
  $('#approveAll').onclick = () => { if (!confirm('Đánh dấu đã duyệt toàn bộ các đoạn lời đọc?')) return; P.blocks.forEach(b => b.type === 'voice' && (b.approved = true)); save(); drawBlocks(); };
  drawBlocks();
}

function summary() {
  const v = P.blocks.filter(b => b.type === 'voice'), ok = v.filter(b => b.approved).length;
  $('#sum').innerHTML = `${v.length} đoạn lời đọc, <b>${ok} đã duyệt</b>, ${P.blocks.filter(b => b.type !== 'voice' && b.assetId).length} bài nhạc`;
}
const insBar = i => `<div class="ins"><button class="btn sm ghost" data-ins="voice" data-at="${i}">${icon('plus')}Lời đọc</button><button class="btn sm ghost" data-ins="music" data-at="${i}">${icon('plus')}Nhạc</button></div>`;
function blockHtml(b, i) {
  const n = P.blocks.length;
  const move = `<button class="btn icon ghost sm" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="Đưa lên">↑</button><button class="btn icon ghost sm" data-act="down" ${i === n - 1 ? 'disabled' : ''} aria-label="Đưa xuống">↓</button><button class="btn icon ghost sm danger" data-act="del" aria-label="Xóa mục">${icon('trash')}</button>`;
  if (b.type === 'voice') return `
  <article class="seg ${b.approved ? 'ok' : ''}" data-i="${i}">
    <div class="seg-rail num">${i + 1}${b.approved ? icon('check', 16) : ''}</div>
    <div class="seg-body">
      <div class="seg-h"><input class="title" data-f="title" value="${esc(b.title)}" aria-label="Tên đoạn">
        <span class="tag ${b.approved ? 'ok' : 'wait'}" data-badge>${b.approved ? 'Đã duyệt' : 'Chưa duyệt'}</span>${move}</div>
      <textarea data-f="text" rows="${Math.min(10, Math.max(3, Math.ceil(b.text.length / 100)))}" aria-label="Nội dung lời đọc">${esc(b.text)}</textarea>
      <div class="ctrls">
        <label class="f">Giọng đọc<select data-f="voice">${voiceOptions(b.voice, true)}</select></label>
        <label class="f">Tốc độ <span class="muted num" data-v="rate">${(b.rate || 1).toFixed(2)}x</span><input type="range" data-f="rate" min="0.7" max="1.5" step="0.05" value="${b.rate || 1}"></label>
        <label class="f">Âm lượng <span class="muted num" data-v="volume">${Math.round((b.volume ?? 1) * 100)}%</span><input type="range" data-f="volume" min="0" max="2" step="0.05" value="${b.volume ?? 1}"></label>
      </div>
      <div class="acts">
        <span class="sp"></span>
        <button class="btn sm ${b.approved ? '' : 'primary'}" data-act="approve">${b.approved ? 'Bỏ duyệt' : icon('check') + 'Duyệt đoạn này'}</button>
        <button class="btn sm brass" data-act="play" ${b.approved ? '' : 'disabled title="Duyệt đoạn này trước khi tạo giọng đọc"'}>${icon('play')}Nghe thử</button>
      </div><div data-slot></div></div>
  </article>`;
  return `
  <article class="seg music" data-i="${i}">
    <div class="seg-rail num">${i + 1}${icon('music', 16)}</div>
    <div class="seg-body">
      <div class="seg-h"><input class="title" data-f="title" value="${esc(b.title)}" aria-label="Tên bài">${move}</div>
      <div class="ctrls">
        <label class="f">File nhạc hoặc ghi âm<span class="row"><select data-f="assetId" class="grow">${assetOptions(b.assetId, '')}</select><button class="btn sm" data-act="upload">${icon('upload')}Tải lên</button></span></label>
        <label class="f">Âm lượng <span class="muted num" data-v="volume">${Math.round((b.volume ?? 1) * 100)}%</span><input type="range" data-f="volume" min="0" max="2" step="0.05" value="${b.volume ?? 1}"></label>
      </div>
      ${b.assetId ? `<audio controls preload="none" src="/media/assets/${b.assetId}.mp3"></audio>` : '<p class="muted">Chưa chọn file nên mục này sẽ bị bỏ qua.</p>'}
    </div>
  </article>`;
}
function drawBlocks() {
  $('#blocks').innerHTML = P.blocks.map((b, i) => insBar(i) + blockHtml(b, i)).join('') + insBar(P.blocks.length);
  summary();
}
function setApproved(b, art, v) {
  b.approved = v;
  art.classList.toggle('ok', v);
  const t = $('[data-badge]', art); t.className = 'tag ' + (v ? 'ok' : 'wait'); t.textContent = v ? 'Đã duyệt' : 'Chưa duyệt';
  const ab = $('[data-act=approve]', art); ab.innerHTML = v ? 'Bỏ duyệt' : icon('check') + 'Duyệt đoạn này'; ab.classList.toggle('primary', !v);
  $('[data-act=play]', art).disabled = !v;
  $('.seg-rail', art).innerHTML = (+art.dataset.i + 1) + (v ? icon('check', 16) : '');
  summary();
}
view.addEventListener('input', e => {
  const art = e.target.closest('.seg'); const f = e.target.dataset.f; if (!art || !f || !P) return;
  const b = P.blocks[art.dataset.i];
  let v = e.target.value;
  if (f === 'rate' || f === 'volume') { v = +v; $(`[data-v=${f}]`, art).textContent = f === 'rate' ? v.toFixed(2) + 'x' : Math.round(v * 100) + '%'; }
  if (f === 'voice' || f === 'assetId') return;
  b[f] = v;
  if (f === 'text' && b.approved) setApproved(b, art, false); // edited text needs a new approval
  save();
});
view.addEventListener('change', e => {
  const art = e.target.closest('.seg'); if (!art || !P) return;
  const b = P.blocks[art.dataset.i], f = e.target.dataset.f;
  if (f === 'voice') { b.voice = e.target.value; save(); }
  if (f === 'assetId') { b.assetId = e.target.value || null; save(); drawBlocks(); }
});
view.addEventListener('click', async e => {
  const ins = e.target.closest('[data-ins]');
  if (ins && P) { P.blocks.splice(+ins.dataset.at, 0, ins.dataset.ins === 'voice' ? newVoice() : newMusic()); save(); drawBlocks(); return; }
  const btn = e.target.closest('[data-act]'), art = e.target.closest('.seg');
  if (!btn || !art || !P) return;
  const i = +art.dataset.i, b = P.blocks[i], slot = $('[data-slot]', art);
  switch (btn.dataset.act) {
    case 'up': case 'down': { const j = btn.dataset.act === 'up' ? i - 1 : i + 1; [P.blocks[i], P.blocks[j]] = [P.blocks[j], P.blocks[i]]; save(); drawBlocks(); break; }
    case 'del': if (confirm(`Xóa mục "${b.title}"?`)) { P.blocks.splice(i, 1); save(); drawBlocks(); } break;
    case 'approve': setApproved(b, art, !b.approved); save(); break;
    case 'upload': busy(btn, async () => { const [f] = await pickFile('.mp3,audio/mpeg'); if (!f) return; const a = await uploadMp3(f); b.assetId = a.id; if (/^(Ca khúc|Nhạc hiệu.*)$/.test(b.title)) b.title = a.name.replace(/\.mp3$/i, ''); save(); drawBlocks(); toast('Đã tải lên ' + a.name); }); break;
    case 'play': busy(btn, async () => {
      const wait = pct => (slot.innerHTML = `<p class="muted">Đang tạo giọng đọc${pct ? ` <b class="num">${pct}%</b>` : ''}. Đoạn dài có thể mất vài phút ở lần đầu, các lần sau phát ngay.</p>`);
      wait(0);
      try {
        const job = await waitJob(await api('tts-job', { json: { voice: b.voice || P.defaultVoice, text: b.text } }), j => wait(j.progress));
        slot.innerHTML = '<audio controls autoplay></audio>';
        const au = $('audio', slot); au.src = '/media/' + job.src; au.playbackRate = b.rate || 1; au.volume = Math.min(1, b.volume ?? 1);
      } catch (err) { slot.innerHTML = ''; throw err; }
    }); break;
  }
});
// ---------------- studio
async function renderStudio() {
  await reloadAssets();
  crumbs([['Chương trình', '#/'], [P.title, `#/p/${P.id}`], ['Dựng âm thanh']], `<span class="muted" id="saved">Đã lưu</span><a class="btn sm primary" href="#/p/${P.id}/export">${icon('export')}Xuất file</a>`);
  unmount = await mountStudio(view, { P, save, flush, reloadProject, api, toast, esc, icon, fmt, waitJob, getAssets: () => assets });
}

// ---------------- export
async function renderExport() {
  crumbs([['Chương trình', '#/'], [P.title, `#/p/${P.id}`], ['Xuất file']]);
  const pending = P.blocks.filter(b => b.type === 'voice' && b.text.trim() && !b.approved).length;
  view.innerHTML = `<div class="page"><h1>Xuất file</h1>
    <p class="lead">Ghép theo đúng thứ tự trong Kịch bản, kèm phần cắt đầu, đuôi đã chỉnh ở Dựng âm thanh.</p>
    ${pending ? `<div class="panel"><b>Còn ${pending} đoạn chưa duyệt.</b> <a href="#/p/${P.id}">Mở kịch bản để duyệt</a> trước khi xuất.</div>` : ''}
    <div class="panel" ${pending ? 'hidden' : ''} id="exp">
      <div class="choice">
        <button data-v="0">${icon('music', 26)}<b>Chỉ âm thanh</b><span class="muted">Một file MP3 để phát trên loa.</span></button>
        <button data-v="1">${icon('studio', 26)}<b>Âm thanh và video</b><span class="muted">MP3 kèm MP4 có phụ đề chạy theo lời đọc, đăng được lên nhóm, trang.</span></button>
      </div>
      <div id="prog" hidden style="margin-top:16px"><p><b id="phase">Chuẩn bị</b> <span class="muted num" id="pct"></span></p><div class="bar-p"><i id="barI" style="width:0"></i></div></div>
      <div id="res" style="margin-top:16px"></div>
    </div></div>`;
  const safeName = (P.title || 'chuong-trinh').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  view.querySelectorAll('.choice [data-v]').forEach(btn => btn.onclick = async () => {
    const video = btn.dataset.v === '1';
    view.querySelectorAll('.choice button').forEach(b => (b.disabled = true));
    $('#prog').hidden = false; $('#res').innerHTML = '';
    try {
      await flush();
      const job = await waitJob(await api('render/' + P.id, { json: { video } }), j => { $('#phase').textContent = j.phase; $('#pct').textContent = j.progress + '%'; $('#barI').style.width = j.progress + '%'; });
      await reloadProject();
      $('#prog').hidden = true;
      $('#res').innerHTML = `<p><span class="tag ok">Xong</span> Thời lượng <b class="num">${fmt(job.duration)}</b></p>
        ${job.mp4 ? `<video controls src="${job.mp4}"></video>` : `<audio controls src="${job.mp3}" style="width:100%"></audio>`}
        <div class="row" style="margin-top:12px">
          ${job.mp4 ? `<a class="btn brass" href="${job.mp4}?dl=${safeName}.mp4">${icon('export')}Tải video MP4</a>` : ''}
          <a class="btn primary" href="${job.mp3}?dl=${safeName}.mp3">${icon('export')}Tải MP3</a></div>`;
    } catch (err) { $('#prog').hidden = true; $('#res').innerHTML = `<p class="panel" style="border-color:#e6b4ae;color:var(--red)">${esc(err.message)}</p>`; }
    view.querySelectorAll('.choice button').forEach(b => (b.disabled = false));
  });
}

// ---------------- library
async function renderLibrary() {
  crumbs([['Thư viện âm thanh']], `<button class="btn sm" id="recB">${icon('mic')}Ghi âm</button><button class="btn sm primary" id="up">${icon('upload')}Tải mp3</button>`);
  await reloadAssets();
  let tab = sessionStorage.libTab || 'music';
  const draw = () => {
    const list = assets.filter(a => (a.kind || 'music') === tab);
    view.innerHTML = `<div class="page"><h1>Thư viện âm thanh</h1>
      <p class="lead">Ca khúc, nhạc hiệu, nhạc nền (mp3 tải từ máy) và các bản ghi âm. Dùng lại được cho mọi chương trình.</p>
      <div class="panel"><div class="tabs2" role="tablist"><button role="tab" data-t="music" class="${tab === 'music' ? 'on' : ''}">Nhạc (${assets.filter(a => (a.kind || 'music') === 'music').length})</button>
        <button role="tab" data-t="rec" class="${tab === 'rec' ? 'on' : ''}">Ghi âm (${assets.filter(a => a.kind === 'rec').length})</button></div>
      ${list.length ? list.map(a => `<div class="lib-item"><div><b>${esc(a.name)}</b> <span class="muted num">${a.duration ? fmt(a.duration) : ''}</span>
        <audio controls preload="none" src="/media/assets/${a.id}.mp3"></audio></div><button class="btn sm ghost danger" data-del="${a.id}" aria-label="Xóa ${esc(a.name)}">${icon('trash')}</button></div>`).join('')
        : `<p class="empty">${tab === 'rec' ? 'Chưa có bản ghi âm. Bấm Ghi âm ở góc trên.' : 'Chưa có bài nào. Bấm Tải mp3 ở góc trên.'}</p>`}</div></div>`;
    view.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = sessionStorage.libTab = b.dataset.t; draw(); });
    view.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      if (!confirm('Xóa khỏi thư viện? Chương trình nào đang dùng sẽ mất file này.')) return;
      await busy(b, () => api('assets/' + b.dataset.del, { method: 'DELETE' })); await reloadAssets(); draw();
    });
  };
  draw();
  $('#up').onclick = e => busy(e.currentTarget, async () => { const files = await pickFile('.mp3,audio/mpeg', true); for (const f of files) { toast('Đang tải ' + f.name); await uploadMp3(f); } if (files.length) { tab = 'music'; toast(`Đã thêm ${files.length} bài`); draw(); } });
  $('#recB').onclick = async () => { if (await recordDialog()) { tab = 'rec'; draw(); } };
}

// ---------------- dictionary
async function renderDict() {
  crumbs([['Từ điển phát âm']]);
  let rules = await api('dict');
  const draw = () => {
    view.innerHTML = `<div class="page"><h1>Từ điển phát âm</h1>
    <p class="lead">Quy định cách đọc thuật ngữ, chữ viết tắt, phiên hiệu đơn vị. Văn bản gốc giữ nguyên, chỉ đổi cách đọc khi tạo giọng. Áp dụng cho mọi chương trình.</p>
    <div class="panel"><table class="tbl"><thead><tr><th>Chữ viết trong văn bản</th><th>Đọc thành</th><th></th></tr></thead><tbody>
    ${rules.map((r, i) => `<tr><td><input type="text" data-i="${i}" data-k="from" value="${esc(r.from)}" aria-label="Chữ viết"></td><td><input type="text" data-i="${i}" data-k="to" value="${esc(r.to)}" aria-label="Cách đọc"></td>
      <td><button class="btn icon ghost sm danger" data-rm="${i}" aria-label="Xóa quy tắc">${icon('trash')}</button></td></tr>`).join('')}
    </tbody></table>
    <div class="row" style="margin-top:12px"><button class="btn" id="add">${icon('plus')}Thêm quy tắc</button><span class="grow"></span><button class="btn primary" id="saveD">Lưu từ điển</button></div>
    <p class="muted">Phân biệt chữ hoa, chữ thường. Cụm dài được áp trước, ví dụ "Trung đoàn 143" trước "143".</p></div>
    <div class="panel"><h2>Thử cách đọc</h2>
      <textarea id="try" rows="3">Ngày 16/11/2026, QĐND và LLVT Trung đoàn 143 tổ chức Đại hội IX.</textarea>
      <div class="row" style="margin-top:10px"><select id="tryV" class="grow">${voiceOptions('vieneu:Adam')}</select><button class="btn" id="tryS">Xem cách đọc</button><button class="btn brass" id="tryP">${icon('play')}Nghe</button></div>
      <div id="tryOut"></div></div></div>`;
    view.querySelectorAll('input[data-i]').forEach(inp => inp.oninput = () => (rules[inp.dataset.i][inp.dataset.k] = inp.value));
    view.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { rules.splice(+b.dataset.rm, 1); draw(); });
    $('#add').onclick = () => { rules.push({ from: '', to: '' }); draw(); view.querySelector(`input[data-i="${rules.length - 1}"]`).focus(); };
    $('#saveD').onclick = e => busy(e.currentTarget, async () => { rules = await api('dict', { method: 'PUT', json: rules }); toast('Đã lưu từ điển'); draw(); });
    $('#tryS').onclick = e => busy(e.currentTarget, async () => { await api('dict', { method: 'PUT', json: rules }); const { speech } = await api('speech', { json: { text: $('#try').value } }); $('#tryOut').innerHTML = `<div class="speech">${esc(speech)}</div>`; });
    $('#tryP').onclick = e => busy(e.currentTarget, async () => { await api('dict', { method: 'PUT', json: rules }); const blob = await api('tts', { json: { voice: $('#tryV').value, text: $('#try').value } }); $('#tryOut').innerHTML = `<audio controls autoplay src="${URL.createObjectURL(blob)}" style="width:100%;margin-top:10px"></audio>`; });
  };
  draw();
}

refreshStatus().then(route);
