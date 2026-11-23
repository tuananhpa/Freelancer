// Timeline editor. The layout always mirrors the script (one clip per block, script order, synced on open);
// here you only trim each clip's head/tail and set fades, then preview. Undo, zoom, playback.
// Clip model is shared with the server (lib/timeline.mjs); times are output seconds.
const TRACKS = [
  { id: 'voice', name: 'Lời đọc', hint: 'Giọng AI, ghi âm', c: 'var(--c-voice)' },
  { id: 'music', name: 'Nhạc', hint: 'Ca khúc, nhạc hiệu', c: 'var(--c-music)' },
  { id: 'bg', name: 'Nhạc nền', hint: 'Tự nhỏ khi có nhạc', c: 'var(--c-bg)' },
];
const RAMP = 0.5, GAP = 0.6, TAIL = 1.5; // must match lib/timeline.mjs
const MIN_DUR = 0.2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const end = c => c.start + c.dur;

export async function mountStudio(view, ctx) {
  const { save, flush, reloadProject, api, toast, esc, icon, fmt, waitJob, getAssets } = ctx;
  let proj = ctx.P;
  proj.timeline ||= { clips: [] };
  let T = proj.timeline;
  let pps = Number(localStorage.tlZoom) || 0; // pixels per second; 0 = fit on first draw
  let playhead = 0, selId = null, playing = false;
  const undo = [], redo = [];
  const peaks = new Map();

  view.innerHTML = `<section class="studio">
    <div class="st-top">
      <div class="monitor">
        <div class="tc num" aria-live="off"><span id="tcNow">00:00.0</span> <small>/ <span id="tcEnd">00:00</span></small></div>
        <div class="transport">
          <button class="btn" id="toStart" aria-label="Về đầu">${icon('start')}</button>
          <button class="btn play" id="playB" aria-label="Phát">${icon('play')}</button>
        </div>
        <div id="syncProg" class="muted" hidden></div>
        <p class="muted" style="text-align:center;margin:0">Phím tắt: Space phát/dừng, Ctrl+Z hoàn tác</p>
      </div>
      <aside class="insp" id="insp" aria-label="Thuộc tính clip"></aside>
    </div>
    <div class="tools" role="toolbar" aria-label="Công cụ timeline">
      <button class="btn sm icon" id="undoB" aria-label="Hoàn tác" title="Hoàn tác (Ctrl+Z)">${icon('undo')}</button>
      <button class="btn sm icon" id="redoB" aria-label="Làm lại" title="Làm lại (Ctrl+Y)">${icon('redo')}</button>
      <span class="sep"></span>
      <span class="muted">Thứ tự lấy theo Kịch bản. Kéo hai mép clip để cắt bớt đầu, đuôi.</span>
      <div class="zoom"><span class="muted">Thu</span><input type="range" id="zoom" min="0" max="100" aria-label="Thu phóng timeline"><span class="muted">Phóng</span>
        <button class="btn sm" id="fitB">Vừa khung</button></div>
    </div>
    <div class="tl">
      <div class="tl-heads">${TRACKS.map(t => `<div class="tl-head" style="--c:${t.c}">${t.name}<small>${t.hint}</small></div>`).join('')}</div>
      <div class="tl-scroll" id="scroll"><div class="tl-canvas" id="canvas">
        <div class="ruler" id="ruler" title="Bấm để chuyển vạch phát"></div>
        ${TRACKS.map(t => `<div class="track" data-track="${t.id}" aria-label="Track ${t.name}"></div>`).join('')}
        <div class="playhead" id="ph"></div>
      </div></div>
    </div>
  </section>`;
  const $ = s => view.querySelector(s);
  const scroll = $('#scroll'), canvas = $('#canvas'), ruler = $('#ruler'), ph = $('#ph');

  // ---------- history / persistence
  const snap = () => JSON.stringify(T.clips);
  const pushUndo = s => { undo.push(s); if (undo.length > 100) undo.shift(); redo.length = 0; };
  function commit(before) { if (before !== undefined && before !== snap()) pushUndo(before); save(); drawAll(); }
  const restore = s => { T.clips = JSON.parse(s); if (!T.clips.some(c => c.id === selId)) selId = null; save(); drawAll(); };
  const doUndo = () => { if (!undo.length) return; redo.push(snap()); restore(undo.pop()); };
  const doRedo = () => { if (!redo.length) return; undo.push(snap()); restore(redo.pop()); };

  const progEnd = () => T.clips.reduce((m, c) => Math.max(m, end(c)), 0);
  // copy of layout() in lib/timeline.mjs: script order back to back, background spans the program
  function relayout() {
    let t = -GAP;
    for (const c of T.clips) if (c.track !== 'bg') { c.start = t + GAP; t = end(c); }
    for (const c of T.clips) if (c.track === 'bg') { c.start = 0; c.dur = Math.max(0, t) + TAIL; }
  }
  function placeAll() {
    relayout();
    for (const c of T.clips) { const n = view.querySelector(`.clip[data-id="${c.id}"]`); if (n) place(n, c); }
    $('#tcEnd').textContent = fmt(progEnd());
  }
  const sel = () => T.clips.find(c => c.id === selId);
  const srcMax = c => (c.loop ? Infinity : c.srcDur / (c.rate || 1)); // longest a clip can be (output seconds)

  // ---------- peaks / waveform
  function getPeaks(src) {
    if (!peaks.has(src)) peaks.set(src, api('peaks?src=' + encodeURIComponent(src)).then(p => (peaks.set(src, p), drawAll(), p)).catch(() => null));
    const p = peaks.get(src);
    return p instanceof Promise ? null : p;
  }
  function drawWave(cv, c) {
    const p = getPeaks(c.src);
    const w = cv.width = Math.max(1, Math.min(4000, Math.round(c.dur * pps)));
    const h = cv.height = 38;
    const g = cv.getContext('2d');
    g.clearRect(0, 0, w, h);
    if (!p) return;
    g.fillStyle = 'rgba(255,255,255,.55)';
    const rate = c.rate || 1;
    for (let x = 0; x < w; x += 2) {
      let s = (c.in + (x / w) * c.dur) * rate;
      if (c.loop && p.duration) s %= p.duration;
      const v = p.peaks[Math.floor(s * p.pps)] || 0;
      const bh = Math.max(1, (v / 100) * (h - 2));
      g.fillRect(x, (h - bh) / 2, 1.4, bh);
    }
  }

  // ---------- drawing
  const isRec = c => getAssets().some(a => `assets/${a.id}.mp3` === c.src && a.kind === 'rec');
  const color = c => (c.track === 'voice' ? (isRec(c) ? 'var(--c-rec)' : 'var(--c-voice)') : c.track === 'music' ? 'var(--c-music)' : 'var(--c-bg)');
  function clipEl(c) {
    const el = document.createElement('div');
    el.className = 'clip' + (c.id === selId ? ' sel' : '');
    el.dataset.id = c.id;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `${c.name}, bắt đầu ${fmt(c.start, 1)}, dài ${fmt(c.dur, 1)}`);
    el.style.setProperty('--c', color(c));
    el.innerHTML = `<canvas></canvas><div class="fade i"></div><div class="fade o"></div><div class="lb">${esc(c.name)} <span class="num">${fmt(c.dur, 1)}</span></div>${c.track === 'bg' ? '' : '<div class="h l"></div><div class="h r"></div>'}`;
    place(el, c);
    return el;
  }
  function place(el, c) {
    el.style.left = c.start * pps + 'px';
    el.style.width = Math.max(4, c.dur * pps) + 'px';
    el.querySelector('.fade.i').style.width = Math.min(c.fadeIn || 0, c.dur) * pps + 'px';
    el.querySelector('.fade.o').style.width = Math.min(c.fadeOut || 0, c.dur) * pps + 'px';
    el.querySelector('.lb .num').textContent = fmt(c.dur, 1);
    drawWave(el.querySelector('canvas'), c);
  }
  function drawRuler(width) {
    const step = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600].find(s => s * pps >= 72) || 600;
    let html = '';
    for (let s = 0; s * pps < width; s += step) html += `<span style="left:${s * pps}px">${fmt(s)}</span>`;
    ruler.innerHTML = html;
  }
  function drawAll() {
    if (!pps) fit(true);
    const width = Math.max(scroll.clientWidth, (Math.max(progEnd(), 60) + 30) * pps);
    canvas.style.width = width + 'px';
    drawRuler(width);
    for (const tr of view.querySelectorAll('.track')) tr.replaceChildren(...T.clips.filter(c => c.track === tr.dataset.track).map(clipEl));
    if (!T.clips.length) view.querySelector('.track[data-track=voice]').innerHTML = `<div class="muted" style="position:sticky;left:0;padding:20px 14px">Timeline trống. Duyệt các đoạn lời đọc và chọn file nhạc ở trang Kịch bản, rồi mở lại trang này.</div>`;
    $('#tcEnd').textContent = fmt(progEnd());
    $('#undoB').disabled = !undo.length; $('#redoB').disabled = !redo.length;
    $('#zoom').value = Math.round(Math.log(pps / 2) / Math.log(100) * 100);
    movePlayhead(playhead);
    drawInspector();
  }
  function movePlayhead(t, follow) {
    playhead = Math.max(0, t);
    ph.style.left = playhead * pps + 'px';
    $('#tcNow').textContent = fmt(playhead, 1);
    if (follow) { const x = playhead * pps; if (x < scroll.scrollLeft || x > scroll.scrollLeft + scroll.clientWidth - 40) scroll.scrollLeft = x - 80; }
  }
  function setZoom(next, anchorT = playhead) {
    const x = anchorT * pps - scroll.scrollLeft;
    pps = clamp(next, 2, 200); localStorage.tlZoom = pps;
    drawAll();
    scroll.scrollLeft = anchorT * pps - x;
  }
  function fit(silent) { pps = clamp((scroll.clientWidth - 40) / Math.max(progEnd() + 5, 30), 2, 200); if (!silent) { localStorage.tlZoom = pps; drawAll(); } }

  // ---------- sync from script (every time the page opens)
  async function sync() {
    stop();
    const pr = $('#syncProg'), tl = view.querySelector('.tl');
    pr.hidden = false; pr.textContent = 'Đang lấy theo kịch bản…'; tl.classList.add('syncing');
    try {
      await flush();
      const job = await waitJob(await api('sync/' + proj.id, { method: 'POST' }), j => (pr.textContent = `${j.phase} ${j.progress}%`));
      const before = snap();
      proj = await reloadProject(); T = proj.timeline || { clips: [] }; proj.timeline = T;
      if (before !== snap()) pushUndo(before);
      if (!T.clips.some(c => c.id === selId)) selId = null;
      pps = Number(localStorage.tlZoom) || 0;
      drawAll();
      if (job.skipped) toast(`${job.skipped} đoạn chưa duyệt nên chưa có trên timeline.`);
    } catch (e) { toast(e.message, true); }
    pr.hidden = true; tl.classList.remove('syncing');
  }

  // ---------- pointer: move / trim / seek
  let drag = null;
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const clipNode = e.target.closest('.clip');
    const x = e.clientX - canvas.getBoundingClientRect().left;
    if (!clipNode) {
      if (e.target.closest('.ruler') || e.target.closest('.track')) {
        if (e.target.closest('.track')) { selId = null; drawInspector(); view.querySelectorAll('.clip.sel').forEach(n => n.classList.remove('sel')); }
        seek(x / pps);
        drag = { mode: 'seek' };
        canvas.setPointerCapture(e.pointerId);
      }
      return;
    }
    const c = T.clips.find(k => k.id === clipNode.dataset.id);
    if (selId !== c.id) { selId = c.id; view.querySelectorAll('.clip.sel').forEach(n => n.classList.remove('sel')); clipNode.classList.add('sel'); drawInspector(); }
    const mode = e.target.classList.contains('l') ? 'trimL' : e.target.classList.contains('r') ? 'trimR' : 'seek';
    if (mode === 'seek') seek(x / pps);
    drag = { mode, c, x0: e.clientX, orig: { ...c }, before: snap(), moved: false };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    if (drag.mode === 'seek') return seek((e.clientX - canvas.getBoundingClientRect().left) / pps);
    const { c, orig } = drag;
    const d = (e.clientX - drag.x0) / pps;
    if (!drag.moved && Math.abs(e.clientX - drag.x0) < 3) return;
    drag.moved = true;
    if (drag.mode === 'trimL') { const k = clamp(d, -orig.in, orig.dur - MIN_DUR); c.in = orig.in + k; c.dur = orig.dur - k; }
    else c.dur = clamp(orig.dur + d, MIN_DUR, srcMax(c) - c.in);
    placeAll();
    drawInspector();
  });
  const endDrag = () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.mode !== 'seek' && d.moved) commit(d.before);
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  scroll.addEventListener('wheel', e => { if (e.ctrlKey) { e.preventDefault(); const t = (e.clientX - canvas.getBoundingClientRect().left) / pps; setZoom(pps * (e.deltaY < 0 ? 1.2 : 1 / 1.2), t); } }, { passive: false });

  // ---------- inspector
  function drawInspector() {
    const c = sel(), I = $('#insp');
    if (!c) {
      const n = k => T.clips.filter(x => x.track === k).length;
      I.innerHTML = `<h3>Chưa chọn clip</h3><p class="muted">Bấm vào một clip để cắt bớt đầu, đuôi và chỉnh fade.</p>
        <p class="muted num">Lời đọc: ${n('voice')} clip<br>Nhạc: ${n('music')} clip<br>Nhạc nền: ${n('bg')} clip<br>Tổng thời lượng: ${fmt(progEnd())}</p>
        <p class="muted">Thứ tự các clip lấy theo trang Kịch bản. Kéo hai mép clip để cắt bớt đầu, đuôi, các clip sau tự dồn lại.</p>`;
      return;
    }
    if (I.dataset.for === c.id && I.contains(document.activeElement)) { // typing: only refresh read-only numbers
      I.querySelector('[data-ro=pos]').textContent = `Bắt đầu ${fmt(c.start, 1)}, kết thúc ${fmt(end(c), 1)}, cắt đầu ${fmt(c.in, 1)}`;
      return;
    }
    I.dataset.for = c.id;
    if (c.track === 'bg') {
      I.innerHTML = `<h3>${esc(c.name)}</h3><p class="muted">Nhạc nền chọn và chỉnh âm lượng ở trang Kịch bản. Tự kéo dài hết chương trình và nhỏ dần khi có nhạc.</p>`;
      return;
    }
    I.innerHTML = `<h3>${esc(c.name)}</h3>
      <p class="muted num" data-ro="pos">Bắt đầu ${fmt(c.start, 1)}, kết thúc ${fmt(end(c), 1)}, cắt đầu ${fmt(c.in, 1)}</p>
      <div class="pair"><label class="f">Cắt đầu (giây)<input type="number" data-k="in" step="0.1" min="0" value="${c.in.toFixed(1)}"></label>
        <label class="f">Độ dài (giây)<input type="number" data-k="dur" step="0.1" min="${MIN_DUR}" value="${c.dur.toFixed(1)}"></label></div>
      <div class="pair"><label class="f">Fade vào <span class="num" data-v="fadeIn">${(c.fadeIn || 0).toFixed(1)}s</span><input type="range" data-k="fadeIn" min="0" max="5" step="0.1" value="${c.fadeIn || 0}"></label>
        <label class="f">Fade ra <span class="num" data-v="fadeOut">${(c.fadeOut || 0).toFixed(1)}s</span><input type="range" data-k="fadeOut" min="0" max="5" step="0.1" value="${c.fadeOut || 0}"></label></div>
      <p class="muted">Âm lượng, tốc độ và thứ tự chỉnh ở trang Kịch bản.</p>`;
  }
  let inspBefore = null;
  $('#insp').addEventListener('focusin', () => { inspBefore ??= snap(); });
  $('#insp').addEventListener('pointerdown', () => { inspBefore ??= snap(); });
  $('#insp').addEventListener('input', e => {
    const c = sel(), k = e.target.dataset.k; if (!c || !k) return;
    inspBefore ??= snap();
    const v = +e.target.value; if (!Number.isFinite(v)) return;
    if (k === 'in') { const stop = c.in + c.dur; c.in = clamp(v, 0, stop - MIN_DUR); c.dur = stop - c.in; }
    else if (k === 'dur') c.dur = clamp(v, MIN_DUR, srcMax(c) - c.in);
    else { c[k] = v; $(`#insp [data-v=${k}]`).textContent = v.toFixed(1) + 's'; }
    placeAll();
    save();
  });
  $('#insp').addEventListener('change', () => { if (inspBefore !== null) { if (inspBefore !== snap()) pushUndo(inspBefore); inspBefore = null; drawAll(); } });

  // ---------- commands
  $('#undoB').onclick = doUndo;
  $('#redoB').onclick = doRedo;
  $('#zoom').oninput = e => setZoom(2 * Math.pow(100, e.target.value / 100));
  $('#fitB').onclick = () => fit(false);

  // ---------- playback: one <audio> per clip, kept in sync with the playhead
  const els = new Map();
  let t0 = 0, pos0 = 0, raf = 0;
  function el(c) {
    let a = els.get(c.id);
    if (!a || a.dataset.src !== c.src) { a?.pause(); a = new Audio('/media/' + c.src); a.preload = 'auto'; a.dataset.src = c.src; els.set(c.id, a); }
    return a;
  }
  const music = () => T.clips.filter(c => c.track === 'music');
  const duck = t => 1 - music().reduce((m, c) => Math.max(m, clamp((t - (c.start - RAMP)) / RAMP, 0, 1) * clamp((end(c) + RAMP - t) / RAMP, 0, 1)), 0);
  function gain(c, t) {
    const lt = t - c.start;
    let g = c.volume;
    if (c.fadeIn > 0) g *= clamp(lt / c.fadeIn, 0, 1);
    if (c.fadeOut > 0) g *= clamp((c.dur - lt) / c.fadeOut, 0, 1);
    if (c.track === 'bg') g *= duck(t);
    return clamp(g, 0, 1); // shortcut: preview can't go above 100%, the exported file can
  }
  function tick() {
    const t = pos0 + (performance.now() - t0) / 1000;
    if (t > progEnd() + 0.3) { stop(); movePlayhead(0); return; }
    movePlayhead(t, true);
    for (const c of T.clips) {
      const on = t >= c.start && t < end(c);
      const a = on ? el(c) : els.get(c.id);
      if (!a) continue;
      if (!on) { if (!a.paused) a.pause(); continue; }
      const rate = c.rate || 1;
      let want = (c.in + t - c.start) * rate;
      if (c.loop && c.srcDur) want %= c.srcDur;
      a.loop = !!c.loop; a.playbackRate = rate; a.volume = gain(c, t);
      if (a.paused) { a.currentTime = want; a.play().catch(() => {}); }
      else if (Math.abs(a.currentTime - want) > 0.3) a.currentTime = want;
    }
    raf = requestAnimationFrame(tick);
  }
  function play() { if (!T.clips.length) return toast('Timeline trống'); playing = true; t0 = performance.now(); pos0 = playhead >= progEnd() ? 0 : playhead; tick(); $('#playB').innerHTML = icon('pause'); $('#playB').setAttribute('aria-label', 'Dừng'); }
  function stop() { playing = false; cancelAnimationFrame(raf); for (const a of els.values()) a.pause(); $('#playB').innerHTML = icon('play'); $('#playB').setAttribute('aria-label', 'Phát'); }
  function seek(t) { movePlayhead(clamp(t, 0, Math.max(progEnd(), 0))); if (playing) { for (const a of els.values()) a.pause(); t0 = performance.now(); pos0 = playhead; } }
  $('#playB').onclick = () => (playing ? stop() : play());
  $('#toStart').onclick = () => { seek(0); scroll.scrollLeft = 0; };

  // ---------- keyboard
  const onKey = e => {
    if (e.target.closest?.('input, textarea, select, [contenteditable]') || document.querySelector('dialog[open]')) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); playing ? stop() : play(); }
    else if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); }
    else if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); doRedo(); }
    else if (k === 'arrowleft' || k === 'arrowright') { e.preventDefault(); seek(playhead + (k === 'arrowleft' ? -1 : 1) * (e.shiftKey ? 10 : 1)); }
  };
  document.addEventListener('keydown', onKey);
  canvas.addEventListener('focusin', e => { const n = e.target.closest('.clip'); if (n && selId !== n.dataset.id) { selId = n.dataset.id; view.querySelectorAll('.clip.sel').forEach(x => x.classList.remove('sel')); n.classList.add('sel'); drawInspector(); } });
  const onResize = () => drawAll();
  addEventListener('resize', onResize);

  drawAll();
  sync();

  return () => { stop(); els.clear(); document.removeEventListener('keydown', onKey); removeEventListener('resize', onResize); };
}
