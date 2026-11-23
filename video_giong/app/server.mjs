// Phát thanh nội bộ — local server: static UI + JSON API + render jobs.
// Data lives in ./data (projects, uploaded mp3, pronunciation rules, TTS cache, exports).
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { extractText, textToBlocks, uid } from './lib/docparse.mjs';
import { toSpeech, DEFAULT_RULES } from './lib/speech.mjs';
import { voices, synth, vieneu } from './lib/tts.mjs';
import { render, ffmpeg, peaks, syncProject } from './lib/render.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
try { process.loadEnvFile(path.join(ROOT, '.env')); } catch {}
const PUB = path.join(ROOT, 'public');
const DATA = process.env.DATA_DIR || path.join(ROOT, 'data'); // Electron sets this to the user's app-data folder
const D = { projects: path.join(DATA, 'projects'), assets: path.join(DATA, 'assets'), tts: path.join(DATA, 'tts'), out: path.join(DATA, 'out') };
for (const d of Object.values(D)) fs.mkdirSync(d, { recursive: true });
// first run: copy the ready-made demo program (built by scripts/build-demo.mjs) so there's something to open
const DEMO = path.join(ROOT, 'demo');
if (fs.existsSync(DEMO) && !fs.readdirSync(D.projects).some(f => f.endsWith('.json'))) fs.cpSync(DEMO, DATA, { recursive: true, force: false });
const PORT = Number(process.env.PORT || 4173);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
const ID = /^[a-z0-9]{6,40}$/i;
const jobs = new Map();

const readJson = async (f, fallback) => { try { return JSON.parse(await fsp.readFile(f, 'utf8')); } catch { return fallback; } };
const writeJson = (f, v) => fsp.writeFile(f, JSON.stringify(v, null, 1));
const dictFile = path.join(DATA, 'dict.json');
const assetsFile = path.join(DATA, 'assets.json');
const getRules = () => readJson(dictFile, DEFAULT_RULES);
const projFile = id => { if (!ID.test(id)) throw httpErr(400, 'id không hợp lệ'); return path.join(D.projects, id + '.json'); };
// clip source "assets/<id>.mp3" | "tts/<sha1>.wav|mp3" -> file path (never outside data/)
const SRC = /^(assets|tts)\/([a-z0-9]{6,64})\.(mp3|wav)$/i;
const resolveSrc = src => { const m = SRC.exec(String(src)); if (!m) throw httpErr(400, 'Nguồn âm thanh không hợp lệ: ' + src); return path.join(D[m[1]], m[2] + '.' + m[3]); };
async function saveTimeline(id, timeline) { const pj = await readJson(projFile(id)); if (pj) { pj.timeline = timeline; pj.updatedAt = Date.now(); await writeJson(projFile(id), pj); } }
function startJob(kind, run) {
  const job = { id: uid('j'), kind, status: 'running', phase: 'Chuẩn bị', progress: 0, startedAt: Date.now() };
  jobs.set(job.id, job);
  run(job).then(r => Object.assign(job, { status: 'done', progress: 100 }, r)).catch(e => Object.assign(job, { status: 'error', error: e.message }));
  return job;
}

function httpErr(status, message) { return Object.assign(new Error(message), { status }); }
async function body(req, limit) {
  const chunks = []; let n = 0;
  for await (const c of req) { n += c.length; if (n > limit) throw httpErr(413, `Tệp quá lớn (tối đa ${limit >> 20} MB)`); chunks.push(c); }
  return Buffer.concat(chunks);
}
const json = async (req, limit = 5 << 20) => { try { return JSON.parse((await body(req, limit)).toString() || '{}'); } catch (e) { throw e.status ? e : httpErr(400, 'JSON không hợp lệ'); } };
const send = (res, status, data, type = 'application/json; charset=utf-8') => {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(type.startsWith('application/json') ? JSON.stringify(data) : data);
};

// File with Range support so <audio>/<video> can seek.
function sendFile(req, res, file, download) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, { error: 'Không tìm thấy' });
    const type = MIME[path.extname(file)] || 'application/octet-stream';
    const head = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
    if (download) head['Content-Disposition'] = `attachment; filename="${download}"`;
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (m) {
      const start = m[1] ? +m[1] : st.size - +m[2];
      const end = m[1] && m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
      if (start >= st.size || start > end) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      res.writeHead(206, { ...head, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { ...head, 'Content-Length': st.size });
    fs.createReadStream(file).pipe(res);
  });
}

const newProject = (title, blocks = []) => ({ id: uid('p'), title, defaultVoice: 'vieneu:Adam', bg: { assetId: null, volume: 0.15 }, blocks, createdAt: Date.now(), updatedAt: Date.now() });

async function api(req, res, url) {
  const p = url.pathname.split('/').filter(Boolean).slice(1); // after "api"
  const M = req.method;
  const [a, id] = p;

  if (a === 'status') return send(res, 200, { voices: voices(), vieneu: vieneu.state });

  if (a === 'projects') {
    if (!id && M === 'GET') {
      const list = [];
      for (const f of await fsp.readdir(D.projects)) if (f.endsWith('.json')) { const pj = await readJson(path.join(D.projects, f)); if (pj) list.push({ id: pj.id, title: pj.title, updatedAt: pj.updatedAt, blocks: pj.blocks.length, approved: pj.blocks.filter(b => b.type === 'voice' && b.approved).length, voices: pj.blocks.filter(b => b.type === 'voice').length }); }
      return send(res, 200, list.sort((x, y) => y.updatedAt - x.updatedAt));
    }
    if (!id && M === 'POST') { const b = await json(req); const pj = newProject(String(b.title || 'Chương trình mới').slice(0, 200), [{ id: uid('b'), type: 'voice', title: 'Lời mở đầu', text: '', voice: '', rate: 1, volume: 1, approved: false }]); await writeJson(projFile(pj.id), pj); return send(res, 200, pj); }
    if (id && M === 'GET') { const pj = await readJson(projFile(id)); return pj ? send(res, 200, pj) : send(res, 404, { error: 'Không tìm thấy chương trình' }); }
    if (id && M === 'PUT') {
      const b = await json(req);
      if (!Array.isArray(b.blocks)) throw httpErr(400, 'Thiếu danh sách đoạn');
      const pj = { ...b, id, updatedAt: Date.now() };
      await writeJson(projFile(id), pj);
      return send(res, 200, { ok: true, updatedAt: pj.updatedAt });
    }
    if (id && M === 'DELETE') { await fsp.rm(projFile(id), { force: true }); return send(res, 200, { ok: true }); }
  }

  if (a === 'import' && M === 'POST') {
    const name = url.searchParams.get('name') || 'kich-ban.doc';
    if (!/\.docx?$/i.test(name)) throw httpErr(400, 'Chỉ nhận file Word .doc hoặc .docx');
    const buf = await body(req, 30 << 20);
    let text;
    try { text = await extractText(buf); } catch { throw httpErr(400, 'Không đọc được file Word. Hãy kiểm tra file có mở được trong Word không.'); }
    const blocks = textToBlocks(text);
    const title = (text.match(/Phát thanh (nội bộ|ngày)[^\n\t]{0,80}/i)?.[0] || name.replace(/\.docx?$/i, '')).trim();
    const pj = newProject(title, blocks);
    await writeJson(projFile(pj.id), pj);
    return send(res, 200, pj);
  }

  if (a === 'assets') {
    const list = await readJson(assetsFile, []);
    if (!id && M === 'GET') return send(res, 200, list);
    if (!id && M === 'POST') {
      const name = (url.searchParams.get('name') || 'nhac.mp3').slice(0, 200);
      const rec = url.searchParams.get('kind') === 'rec';
      if (!(rec ? /\.(webm|ogg|wav|m4a|mp3)$/i : /\.mp3$/i).test(name)) throw httpErr(400, 'Chỉ nhận file nhạc .mp3');
      const buf = await body(req, 100 << 20);
      const aid = uid('a');
      const file = path.join(D.assets, aid + '.mp3');
      if (rec && !/\.mp3$/i.test(name)) { // microphone recording (webm/opus) -> mp3
        const raw = file + path.extname(name);
        await fsp.writeFile(raw, buf);
        try { await ffmpeg(['-v', 'error', '-y', '-i', raw, '-vn', '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '128k', file]); }
        catch { await fsp.rm(file, { force: true }); throw httpErr(400, 'Không chuyển được bản ghi âm'); }
        finally { await fsp.rm(raw, { force: true }); }
      } else await fsp.writeFile(file, buf);
      // validate: must decode as audio; also gives the duration
      let duration;
      try { duration = (await peaks(file)).duration; if (!duration) throw new Error(); }
      catch { await fsp.rm(file, { force: true }); throw httpErr(400, 'File không phải MP3 hợp lệ'); }
      const asset = { id: aid, name: rec ? name.replace(/\.\w+$/, '.mp3') : name, kind: rec ? 'rec' : 'music', duration, size: (await fsp.stat(file)).size, createdAt: Date.now() };
      list.unshift(asset); await writeJson(assetsFile, list);
      return send(res, 200, asset);
    }
    if (id && M === 'GET') { const aid = id.replace(/\.mp3$/, ''); if (!ID.test(aid)) throw httpErr(400, 'id không hợp lệ'); return sendFile(req, res, path.join(D.assets, aid + '.mp3')); }
    if (id && M === 'DELETE') { if (!ID.test(id)) throw httpErr(400, 'id không hợp lệ'); await fsp.rm(path.join(D.assets, id + '.mp3'), { force: true }); await fsp.rm(path.join(D.assets, id + '.mp3.peaks.json'), { force: true }); await writeJson(assetsFile, list.filter(x => x.id !== id)); return send(res, 200, { ok: true }); }
  }

  if (a === 'dict') {
    if (M === 'GET') return send(res, 200, await getRules());
    if (M === 'PUT') {
      const rules = await json(req);
      if (!Array.isArray(rules)) throw httpErr(400, 'Sai định dạng');
      const clean = rules.map(r => ({ from: String(r.from || '').trim().slice(0, 200), to: String(r.to || '').trim().slice(0, 400) })).filter(r => r.from && r.to);
      await writeJson(dictFile, clean);
      return send(res, 200, clean);
    }
  }

  if (a === 'speech' && M === 'POST') { const b = await json(req); return send(res, 200, { speech: toSpeech(String(b.text || ''), await getRules()) }); }

  if (a === 'tts' && M === 'POST') {
    const b = await json(req);
    const text = toSpeech(String(b.text || ''), await getRules()).slice(0, 20000);
    if (!text.trim()) throw httpErr(400, 'Đoạn trống');
    const file = await synth(String(b.voice || 'vieneu:Adam'), text, D.tts);
    return sendFile(req, res, file);
  }

  if (a === 'peaks' && M === 'GET') return send(res, 200, await peaks(resolveSrc(url.searchParams.get('src'))));

  // script -> TTS -> timeline (keeps manual timeline edits)
  if (a === 'sync' && M === 'POST') {
    const pj = await readJson(projFile(id));
    if (!pj) throw httpErr(404, 'Không tìm thấy chương trình');
    const rules = await getRules();
    return send(res, 200, startJob('sync', async job => {
      const { timeline, skipped } = await syncProject(pj, { rules, assetsDir: D.assets, ttsDir: D.tts, job });
      await saveTimeline(id, timeline);
      return { skipped, clips: timeline.clips.length };
    }));
  }

  if (a === 'render' && M === 'POST') {
    const pj = await readJson(projFile(id));
    if (!pj) throw httpErr(404, 'Không tìm thấy chương trình');
    const b = await json(req);
    const rules = await getRules();
    return send(res, 200, startJob('render', async job => {
      const outDir = path.join(D.out, job.id);
      const r = await render(pj, { rules, assetsDir: D.assets, ttsDir: D.tts, outDir, video: !!b.video, job, resolve: resolveSrc, saveTimeline: t => saveTimeline(id, t) });
      return { duration: r.duration, mp3: `/out/${job.id}/chuong-trinh.mp3`, mp4: r.mp4 ? `/out/${job.id}/chuong-trinh.mp4` : null };
    }));
  }
  if (a === 'jobs' && M === 'GET') { const job = jobs.get(id); return job ? send(res, 200, job) : send(res, 404, { error: 'Không có tác vụ' }); }

  throw httpErr(404, 'Không có API này');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (url.pathname.startsWith('/media/')) return sendFile(req, res, resolveSrc(decodeURIComponent(url.pathname.slice(7))));
    const out = /^\/out\/([a-z0-9]+)\/(chuong-trinh\.(mp3|mp4))$/i.exec(url.pathname);
    if (out) return sendFile(req, res, path.join(D.out, out[1], out[2]), url.searchParams.has('dl') ? out[2] : null);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
    const file = path.resolve(PUB, '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)));
    if (!file.startsWith(PUB + path.sep)) return send(res, 403, { error: 'Forbidden' });
    sendFile(req, res, fs.existsSync(file) ? file : path.join(PUB, 'index.html'));
  } catch (e) {
    if (!e.status) console.error(e);
    if (!res.headersSent) send(res, e.status || 500, { error: e.message || 'Lỗi máy chủ' });
  }
});

if (process.env.VIENEU !== 'off') vieneu.start().catch(e => console.log('VieNeu chưa dùng được:', e.message, '→ vẫn dùng được giọng online'));
// Electron's main process awaits this before opening the window
export const ready = new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(PORT, '0.0.0.0', () => {
    const ips = Object.values(os.networkInterfaces()).flat().filter(i => i?.family === 'IPv4' && !i.internal).map(i => `http://${i.address}:${PORT}`);
    console.log(`PHÁT THANH NỘI BỘ đang chạy:\n  Máy này:   http://localhost:${PORT}\n  Điện thoại (cùng Wi-Fi): ${ips.join('  ') || '-'}`);
    resolve({ port: PORT, ips });
  });
});
