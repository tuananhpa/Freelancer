// Builds the ready-made demo program shipped in ./demo (copied into a fresh install's data folder).
// Needs the app server running on this machine with ./data as its data folder:
//   npm start            (other terminal)
//   node scripts/build-demo.mjs "<path to script .doc>"
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { ffmpeg } from '../lib/render.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = (process.env.API || 'http://localhost:4173') + '/api/';
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'demo');
const doc = process.argv[2] || path.join(ROOT, '..', 'c16,17 20-11-2026.doc');

const call = async (p, opts = {}) => { const r = await fetch(API + p, opts); const j = await r.json(); if (!r.ok) throw new Error(j.error || r.statusText); return j; };
const put = (p, body) => call(p, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
async function wait(job) { while (job.status === 'running') { process.stdout.write(`\r${job.phase} ${job.progress}%   `); await new Promise(r => setTimeout(r, 1500)); job = await call('jobs/' + job.id); } console.log(); if (job.status === 'error') throw new Error(job.error); return job; }

// 1. music
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-music-'));
const { execFileSync } = await import('node:child_process');
execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'demo-music.mjs'), tmp], { stdio: 'inherit' });
const up = async (file, name) => call('assets?name=' + encodeURIComponent(name), { method: 'POST', body: fs.readFileSync(path.join(tmp, file)) });
const jingle = await up('nhac-hieu-mau.mp3', 'Nhạc hiệu (nhạc mẫu).mp3');
const song = await up('ca-khuc-mau.mp3', 'Hành khúc (nhạc mẫu).mp3');
const bed = await up('nhac-nen-mau.mp3', 'Nhạc nền (nhạc mẫu).mp3');

// 2. script -> project, one voice per segment to show the range (Nam/Nữ, Bắc/Trung/Nam)
const p = await call('import?name=' + encodeURIComponent(path.basename(doc)), { method: 'POST', body: fs.readFileSync(doc) });
p.title = 'Bản mẫu: ' + p.title;
const voices = ['vieneu:Adam', 'vieneu:Mai Anh', 'vieneu:Hải Đăng', 'vieneu:Ngọc Trân', 'vieneu:Thái Sơn', 'vieneu:Thùy Dung', 'vieneu:Minh Đức', 'vieneu:Adam'];
let k = 0;
for (const b of p.blocks) {
  if (b.type === 'voice') Object.assign(b, { voice: voices[k++ % voices.length], approved: true });
  else Object.assign(b, { assetId: jingle.id });
}
// a song after the unit news and after the culture piece
const at = title => p.blocks.findIndex(b => b.title.startsWith(title)) + 1;
p.blocks.splice(at('1.'), 0, { id: 'bsong1', type: 'song', title: 'Hành khúc (nhạc mẫu)', assetId: song.id, volume: 0.9 });
p.blocks.splice(at('4.'), 0, { id: 'bsong2', type: 'song', title: 'Hành khúc (nhạc mẫu)', assetId: song.id, volume: 0.9 });
p.bg = { assetId: bed.id, volume: 0.12 };
await put('projects/' + p.id, p);
await wait(await call('sync/' + p.id, { method: 'POST' }));
const proj = await call('projects/' + p.id);

// 3. export seed: project + the audio it uses (VieNeu wav -> mp3 to keep the installer small)
await fsp.rm(OUT, { recursive: true, force: true });
for (const d of ['projects', 'assets', 'tts']) await fsp.mkdir(path.join(OUT, d), { recursive: true });
for (const c of proj.timeline.clips) {
  const src = path.join(DATA, c.src);
  if (c.src.endsWith('.wav')) {
    c.src = c.src.replace(/\.wav$/, '.mp3');
    await ffmpeg(['-v', 'error', '-y', '-i', src, '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '64k', path.join(OUT, c.src)]);
  } else await fsp.copyFile(src, path.join(OUT, c.src));
}
await fsp.writeFile(path.join(OUT, 'projects', proj.id + '.json'), JSON.stringify(proj, null, 1));
const assets = (await call('assets')).filter(a => [jingle.id, song.id, bed.id].includes(a.id));
await fsp.writeFile(path.join(OUT, 'assets.json'), JSON.stringify(assets, null, 1));
await fsp.writeFile(path.join(OUT, 'dict.json'), JSON.stringify(await call('dict'), null, 1));
const size = (await Promise.all((await fsp.readdir(OUT, { recursive: true })).map(f => fsp.stat(path.join(OUT, f))))).reduce((a, s) => a + (s.isFile() ? s.size : 0), 0);
console.log(`demo/ ready: ${proj.timeline.clips.length} clips, ${(size / 1048576).toFixed(1)} MB, project ${proj.id}`);
