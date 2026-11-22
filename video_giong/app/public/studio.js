// Timeline editor (CapCut-style): drag clips to move (also across tracks), drag edges to trim,
// drop music/recordings from the bin, split, delete, undo, zoom, snap, preview playback.
// Clip model is shared with the server (lib/timeline.mjs); times are output seconds.
const TRACKS = [
  { id: 'voice', name: 'Lời đọc', hint: 'Giọng AI, ghi âm', c: 'var(--c-voice)' },
  { id: 'music', name: 'Nhạc', hint: 'Ca khúc, nhạc hiệu', c: 'var(--c-music)' },
  { id: 'bg', name: 'Nhạc nền', hint: 'Tự nhỏ khi có nhạc', c: 'var(--c-bg)' },
];
const RAMP = 0.5; // must match lib/timeline.mjs
const MIN_DUR = 0.2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const end = c => c.start + c.dur;
const cid = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export async function mountStudio(view, ctx) {
  const { save, flush, reloadProject, api, toast, busy, esc, icon, fmt, waitJob, recordDialog, pickFile, uploadMp3, getAssets } = ctx;
  let proj = ctx.P;
  proj.timeline ||= { clips: [] };
  let T = proj.timeline;
  let pps = Number(localStorage.tlZoom) || 0; // pixels per second; 0 = fit on first draw
  let playhead = 0, selId = null, playing = false, snapOn = localStorage.tlSnap !== '0';
  let binTab = 'music';
  const undo = [], redo = [];
  const peaks = new Map();

  view.innerHTML = `<section class="studio">
    <div class="st-top">
      <aside class="bin" aria-label="Thư viện">
        <button class="btn primary" id="syncB" style="width:100%">${icon('sync')}Lấy giọng đọc từ kịch bản</button>
        <div class="tabs2" role="tablist" style="margin-top:12px"><button data-bt="music" class="on">Nhạc</button><button data-bt="rec">Ghi âm</button></div>
        <div id="binList"></div>
        <div class="row" style="margin-top:8px"><button class="btn sm grow" id="upB">${icon('upload')}Tải mp3</button><button class="btn sm grow" id="recB">${icon('mic')}Ghi âm</button></div>
        <p class="muted" style="margin:10px 0 0">Kéo thả vào timeline, hoặc bấm + để chèn tại vạch phát.</p>
      </aside>
      <div class="monitor">
        <div class="tc num" aria-live="off"><span id="tcNow">00:00.0</span> <small>/ <span id="tcEnd">00:00</span></small></div>
        <div class="transport">
          <button class="btn" id="toStart" aria-label="Về đầu">${icon('start')}</button>
          <button class="btn play" id="playB" aria-label="Phát">${icon('play')}</button>
        </div>
        <div id="syncProg" class="muted" hidden></div>
        <p class="muted" style="text-align:center;margin:0">Phím tắt: Space phát/dừng, S tách, Delete xóa, Ctrl+Z hoàn tác</p>
      </div>
      <aside class="insp" id="insp" aria-label="Thuộc tính clip"></aside>
    </div>
    <div class="tools" role="toolbar" aria-label="Công cụ timeline">
      <button class="btn sm icon" id="undoB" aria-label="Hoàn tác" title="Hoàn tác (Ctrl+Z)">${icon('undo')}</button>
      <button class="btn sm icon" id="redoB" aria-label="Làm lại" title="Làm lại (Ctrl+Y)">${icon('redo')}</button>
      <span class="sep"></span>
      <button class="btn sm" id="splitB" title="Tách clip tại vạch phát (S)">${icon('split')}Tách</button>
      <button class="btn sm" id="delB" title="Xóa clip (Delete)">${icon('trash')}Xóa</button>
      <span class="sep"></span>
      <button class="btn sm" id="snapB" aria-pressed="${snapOn}" title="Hít vào mép clip khác">${icon('magnet')}Hít mép: ${snapOn ? 'bật' : 'tắt'}</button>
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
    el.innerHTML = `<canvas></canvas><div class="fade i"></div><div class="fade o"></div><div class="lb">${esc(c.name)} <span class="num">${fmt(c.dur, 1)}</span></div><div class="h l"></div><div class="h r"></div>`;
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
    if (!T.clips.length) view.querySelector('.track[data-track=voice]').innerHTML = `<div class="muted" style="position:sticky;left:0;padding:20px 14px">Timeline trống. Bấm "Lấy giọng đọc từ kịch bản" để tạo giọng và xếp các đoạn vào đây.</div>`;
    $('#tcEnd').textContent = fmt(progEnd());
    $('#undoB').disabled = !undo.length; $('#redoB').disabled = !redo.length;
    $('#zoom').value = Math.round(Math.log(pps / 2) / Math.log(100) * 100);
    movePlayhead(playhead);
    drawInspector();
    drawBin();
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

  // ---------- bin
  function drawBin() {
    const list = getAssets().filter(a => (a.kind || 'music') === binTab);
    view.querySelectorAll('[data-bt]').forEach(b => b.classList.toggle('on', b.dataset.bt === binTab));
    $('#binList').innerHTML = list.length ? list.map(a => `<div class="bin-item" draggable="true" data-aid="${a.id}" title="${esc(a.name)}">
      <span class="sw" style="background:${a.kind === 'rec' ? 'var(--c-rec)' : 'var(--c-music)'}"></span><span class="nm">${esc(a.name)}</span>
      <span class="muted num">${a.duration ? fmt(a.duration) : ''}</span><button class="btn sm icon" data-add="${a.id}" aria-label="Chèn ${esc(a.name)} tại vạch phát">${icon('plus')}</button></div>`).join('')
      : `<p class="muted">${binTab === 'rec' ? 'Chưa có bản ghi âm.' : 'Chưa có nhạc. Bấm Tải mp3.'}</p>`;
  }
  async function addAsset(aid, track, at) {
    const a = getAssets().find(x => x.id === aid); if (!a) return;
    const src = `assets/${a.id}.mp3`;
    const srcDur = a.duration || (await api('peaks?src=' + encodeURIComponent(src))).duration;
    const before = snap();
    const c = { id: cid(), track, src, name: a.name.replace(/\.mp3$/i, ''), start: Math.max(0, at), in: 0, srcDur, dur: srcDur, rate: 1,
      volume: track === 'bg' ? 0.15 : 1, fadeIn: track === 'bg' ? 1 : 0, fadeOut: track === 'bg' ? 2 : 0, loop: track === 'bg' || undefined };
    if (c.loop) c.dur = Math.max(srcDur, progEnd() - c.start);
    T.clips.push(c); selId = c.id; commit(before);
  }
  $('#binList').addEventListener('dragstart', e => { const it = e.target.closest('[data-aid]'); if (it) e.dataTransfer.setData('text/x-asset', it.dataset.aid); });
  $('#binList').addEventListener('click', e => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    const a = getAssets().find(x => x.id === b.dataset.add);
    addAsset(a.id, a.kind === 'rec' ? 'voice' : 'music', playhead);
  });
  view.querySelectorAll('.track').forEach(tr => {
    tr.addEventListener('dragover', e => { if (e.dataTransfer.types.includes('text/x-asset')) { e.preventDefault(); tr.classList.add('over'); } });
    tr.addEventListener('dragleave', () => tr.classList.remove('over'));
    tr.addEventListener('drop', e => {
      tr.classList.remove('over');
      const aid = e.dataTransfer.getData('text/x-asset'); if (!aid) return;
      e.preventDefault();
      addAsset(aid, tr.dataset.track, (e.clientX - canvas.getBoundingClientRect().left) / pps);
    });
  });
  view.querySelectorAll('[data-bt]').forEach(b => b.onclick = () => { binTab = b.dataset.bt; drawBin(); });
  $('#upB').onclick = e => busy(e.currentTarget, async () => { const files = await pickFile('.mp3,audio/mpeg', true); for (const f of files) await uploadMp3(f); binTab = 'music'; drawBin(); if (files.length) toast(`Đã thêm ${files.length} bài vào thư viện`); });
  $('#recB').onclick = async () => { const a = await recordDialog(); if (a) { binTab = 'rec'; await addAsset(a.id, 'voice', playhead); toast('Đã đặt bản ghi vào track Lời đọc tại vạch phát'); } };

  // ---------- sync from script
  async function sync(auto) {
    stop();
    const btn = $('#syncB'), pr = $('#syncProg');
    btn.classList.add('busy'); pr.hidden = false; pr.textContent = 'Đang tạo giọng đọc…';
    try {
      await flush();
      const job = await waitJob(await api('sync/' + proj.id, { method: 'POST' }), j => (pr.textContent = `${j.phase} ${j.progress}%`));
      const before = snap();
      proj = await reloadProject(); T = proj.timeline || { clips: [] }; proj.timeline = T;
      if (before !== snap()) pushUndo(before);
      pps = auto ? 0 : pps;
      drawAll();
      toast(job.skipped ? `Đã cập nhật timeline. ${job.skipped} đoạn chưa duyệt nên chưa có giọng.` : 'Đã cập nhật timeline từ kịch bản');
    } catch (e) { toast(e.message, true); }
    btn.classList.remove('busy'); pr.hidden = true;
  }
  $('#syncB').onclick = () => sync(false);

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
    const mode = e.target.classList.contains('l') ? 'trimL' : e.target.classList.contains('r') ? 'trimR' : 'move';
    drag = { mode, c, el: clipNode, x0: e.clientX, orig: { ...c }, before: snap(), moved: false };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    if (drag.mode === 'seek') return seek((e.clientX - canvas.getBoundingClientRect().left) / pps);
    const { c, orig, el } = drag;
    const d = (e.clientX - drag.x0) / pps;
    if (!drag.moved && Math.abs(e.clientX - drag.x0) < 3) return;
    drag.moved = true;
    const edges = snapOn ? [0, playhead, ...T.clips.filter(k => k.id !== c.id).flatMap(k => [k.start, end(k)])] : [];
    const snapTo = t => { const near = edges.reduce((b, s) => (Math.abs(s - t) < Math.abs(b - t) ? s : b), Infinity); return Math.abs(near - t) * pps < 8 ? near : t; };
    if (drag.mode === 'move') {
      let s = Math.max(0, orig.start + d);
      const s1 = snapTo(s), s2 = snapTo(s + orig.dur) - orig.dur;
      s = s1 !== s ? s1 : s2 !== s ? Math.max(0, s2) : s;
      c.start = s;
      const tr = document.elementFromPoint(e.clientX, e.clientY)?.closest('.track');
      if (tr && tr.dataset.track !== c.track) { c.track = tr.dataset.track; tr.appendChild(el); el.style.setProperty('--c', color(c)); }
    } else if (drag.mode === 'trimL') {
      const lo = Math.max(-orig.in, -orig.start), hi = orig.dur - MIN_DUR;
      let k = clamp(d, lo, hi);
      k = clamp(snapTo(orig.start + k) - orig.start, lo, hi);
      c.in = orig.in + k; c.start = orig.start + k; c.dur = orig.dur - k;
    } else {
      let du = clamp(orig.dur + d, MIN_DUR, srcMax(c) - c.in);
      du = clamp(snapTo(c.start + du) - c.start, MIN_DUR, srcMax(c) - c.in);
      c.dur = du;
    }
    delete c.auto; // user took over the auto background
    place(el, c);
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
      I.innerHTML = `<h3>Chưa chọn clip</h3><p class="muted">Bấm vào một clip để chỉnh thời gian, âm lượng, fade, tốc độ.</p>
        <p class="muted num">Lời đọc: ${n('voice')} clip<br>Nhạc: ${n('music')} clip<br>Nhạc nền: ${n('bg')} clip<br>Tổng thời lượng: ${fmt(progEnd())}</p>
        <p class="muted">Kéo thân clip để dời vị trí hoặc chuyển track. Kéo hai mép để cắt bớt đầu, đuôi.</p>`;
      return;
    }
    if (I.dataset.for === c.id && I.contains(document.activeElement)) { // typing: only refresh read-only numbers
      I.querySelector('[data-ro=pos]').textContent = `Bắt đầu ${fmt(c.start, 1)}, kết thúc ${fmt(end(c), 1)}, cắt đầu ${fmt(c.in, 1)}`;
      return;
    }
    I.dataset.for = c.id;
    const voiceLike = c.track === 'voice';
    I.innerHTML = `<h3>${esc(c.name)}</h3>
      <label class="f">Tên<input type="text" data-k="name" value="${esc(c.name)}"></label>
      <p class="muted num" data-ro="pos">Bắt đầu ${fmt(c.start, 1)}, kết thúc ${fmt(end(c), 1)}, cắt đầu ${fmt(c.in, 1)}</p>
      <div class="pair"><label class="f">Bắt đầu (giây)<input type="number" data-k="start" step="0.1" min="0" value="${c.start.toFixed(1)}"></label>
        <label class="f">Độ dài (giây)<input type="number" data-k="dur" step="0.1" min="${MIN_DUR}" value="${c.dur.toFixed(1)}"></label></div>
      <label class="f">Âm lượng <span class="num" data-v="volume">${Math.round(c.volume * 100)}%</span><input type="range" data-k="volume" min="0" max="2" step="0.05" value="${c.volume}"></label>
      <div class="pair"><label class="f">Fade vào <span class="num" data-v="fadeIn">${(c.fadeIn || 0).toFixed(1)}s</span><input type="range" data-k="fadeIn" min="0" max="5" step="0.1" value="${c.fadeIn || 0}"></label>
        <label class="f">Fade ra <span class="num" data-v="fadeOut">${(c.fadeOut || 0).toFixed(1)}s</span><input type="range" data-k="fadeOut" min="0" max="5" step="0.1" value="${c.fadeOut || 0}"></label></div>
      ${voiceLike ? `<label class="f">Tốc độ <span class="num" data-v="rate">${(c.rate || 1).toFixed(2)}x</span><input type="range" data-k="rate" min="0.7" max="1.5" step="0.05" value="${c.rate || 1}"></label>` : ''}
      ${c.track === 'bg' ? `<label class="row" style="margin-top:10px;gap:8px"><input type="checkbox" data-k="loop" ${c.loop ? 'checked' : ''}> Lặp lại bài nhạc cho đủ độ dài</label>` : ''}
      <div class="row" style="margin-top:12px"><button class="btn sm" data-a="split">${icon('split')}Tách</button><button class="btn sm danger" data-a="del">${icon('trash')}Xóa</button></div>`;
  }
  let inspBefore = null;
  $('#insp').addEventListener('focusin', () => { inspBefore ??= snap(); });
  $('#insp').addEventListener('pointerdown', () => { inspBefore ??= snap(); });
  $('#insp').addEventListener('input', e => {
    const c = sel(), k = e.target.dataset.k; if (!c || !k) return;
    inspBefore ??= snap();
    delete c.auto;
    if (k === 'name') c.name = e.target.value;
    else if (k === 'loop') { c.loop = e.target.checked || undefined; if (!c.loop) c.dur = Math.min(c.dur, srcMax(c) - c.in); }
    else {
      const v = +e.target.value; if (!Number.isFinite(v)) return;
      if (k === 'start') c.start = Math.max(0, v);
      else if (k === 'dur') c.dur = clamp(v, MIN_DUR, srcMax(c) - c.in);
      else if (k === 'rate') { const old = c.rate || 1; c.in = c.in * old / v; c.dur = clamp(c.dur * old / v, MIN_DUR, c.srcDur / v - c.in); c.rate = v; }
      else c[k] = v;
      const out = $(`#insp [data-v=${k}]`);
      if (out) out.textContent = k === 'volume' ? Math.round(v * 100) + '%' : k === 'rate' ? v.toFixed(2) + 'x' : v.toFixed(1) + 's';
    }
    const el = view.querySelector(`.clip[data-id="${c.id}"]`);
    if (el) { place(el, c); el.querySelector('.lb').firstChild.textContent = c.name + ' '; }
    $('#tcEnd').textContent = fmt(progEnd());
    save();
  });
  $('#insp').addEventListener('change', () => { if (inspBefore !== null) { if (inspBefore !== snap()) pushUndo(inspBefore); inspBefore = null; drawAll(); } });
  $('#insp').addEventListener('click', e => { const a = e.target.closest('[data-a]')?.dataset.a; if (a === 'split') split(); if (a === 'del') del(); });

  // ---------- edit commands
  function split() {
    const c = sel()?.start < playhead && end(sel()) > playhead ? sel() : T.clips.find(k => k.track !== 'bg' && k.start < playhead && end(k) > playhead);
    if (!c) return toast('Đặt vạch phát vào giữa một clip rồi bấm Tách');
    const before = snap(), cut = playhead - c.start;
    const b = { ...c, id: cid(), start: playhead, in: c.in + cut, dur: c.dur - cut, fadeIn: 0 };
    c.dur = cut; c.fadeOut = 0; delete c.auto; delete b.auto;
    T.clips.push(b); selId = b.id; commit(before);
  }
  function del() {
    const c = sel(); if (!c) return toast('Chọn một clip để xóa');
    const before = snap();
    T.clips = T.clips.filter(k => k.id !== c.id); selId = null;
    els.get(c.id)?.pause(); els.delete(c.id);
    commit(before);
    if (c.blockId) toast('Đã xóa. Bấm "Lấy giọng đọc từ kịch bản" sẽ thêm lại đoạn này nếu nó vẫn còn trong kịch bản.');
  }
  $('#splitB').onclick = split;
  $('#delB').onclick = del;
  $('#undoB').onclick = doUndo;
  $('#redoB').onclick = doRedo;
  $('#snapB').onclick = e => { snapOn = !snapOn; localStorage.tlSnap = snapOn ? '1' : '0'; e.currentTarget.setAttribute('aria-pressed', snapOn); e.currentTarget.innerHTML = `${icon('magnet')}Hít mép: ${snapOn ? 'bật' : 'tắt'}`; };
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
    else if (k === 's' && !e.ctrlKey) { e.preventDefault(); split(); }
    else if (k === 'delete' || k === 'backspace') { if (sel()) { e.preventDefault(); del(); } }
    else if (k === 'arrowleft' || k === 'arrowright') {
      e.preventDefault();
      const d = (k === 'arrowleft' ? -1 : 1) * (e.shiftKey ? 1 : 0.1);
      const c = sel();
      if (c && document.activeElement?.classList.contains('clip')) { const before = snap(); c.start = Math.max(0, c.start + d); commit(before); view.querySelector(`.clip[data-id="${c.id}"]`)?.focus(); }
      else seek(playhead + d * 10);
    }
  };
  document.addEventListener('keydown', onKey);
  canvas.addEventListener('focusin', e => { const n = e.target.closest('.clip'); if (n && selId !== n.dataset.id) { selId = n.dataset.id; view.querySelectorAll('.clip.sel').forEach(x => x.classList.remove('sel')); n.classList.add('sel'); drawInspector(); } });
  const onResize = () => drawAll();
  addEventListener('resize', onResize);

  drawAll();
  if (!T.clips.length && proj.blocks.some(b => b.type === 'voice' && b.approved && b.text.trim())) sync(true);

  return () => { stop(); els.clear(); document.removeEventListener('keydown', onKey); removeEventListener('resize', onResize); };
}
