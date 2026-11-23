// Free Vietnamese TTS providers. Results are cached on disk by (voice, text), so
// re-listening or re-exporting an unchanged segment costs nothing.
//  - vieneu: VieNeu-TTS v3 Turbo, offline on this machine (GPU if available), 25 voices
//            Nam/Nữ · Bắc/Trung/Nam, natural / news / storytelling styles.
//  - edge:   Microsoft Edge online voices (fast, 2 voices) — fallback.
//  - google: Google Dịch online voice — fallback.
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { chunk } from './speech.mjs';

// name · gender · region · style — from VieNeu's voices_v3_turbo.json (v3.8.3)
const VIENEU = `Adam|Nam|Nam|Tự nhiên
Adam bựa|Nam|Bắc|Tự nhiên
Hải Đăng|Nam|Bắc|Tự nhiên
Quốc Tuấn|Nam|Bắc|Tự nhiên
Phạm Tuyên|Nam|Bắc|Tự nhiên
Xuân Vĩnh|Nam|Bắc|Tự nhiên
Minh Đức|Nam|Bắc|Tin tức
Thiện Minh|Nam|Bắc|Kể chuyện
Thanh Bình|Nam|Bắc|Kể chuyện
Thiền Tâm Đức|Nam|Bắc|Kể chuyện
Quang Sơn|Nam|Trung|Tự nhiên
Minh Triết|Nam|Nam|Tin tức
Thái Sơn|Nam|Nam|Kể chuyện
Đức Trí|Nam|Nam|Đọc truyện
Mai Anh|Nữ|Bắc|Tin tức
Trúc Ly|Nữ|Bắc|Tự nhiên
Ngọc Huyền|Nữ|Bắc|Tự nhiên
Đoan Trang|Nữ|Bắc|Tự nhiên
Ngọc Linh|Nữ|Bắc|Kể chuyện
Quỳnh Anh|Nữ|Bắc|Đọc truyện
Ngọc Trân|Nữ|Trung|Tự nhiên
Thùy Dung|Nữ|Nam|Tin tức
Thục Đoan|Nữ|Nam|Kể chuyện
Mỹ Duyên|Nữ|Nam|Đọc truyện
Kim Thanh|Nữ|Nam|Đọc truyện`.split('\n').map(l => l.split('|'));

export function voices() {
  const vn = vieneu.state;
  return [
    ...VIENEU.map(([name, gender, region, style]) => ({ id: `vieneu:${name}`, name, gender, region, style, provider: 'VieNeu (offline)', disabled: vn === 'missing' || vn.startsWith?.('error') })),
    { id: 'edge:vi-VN-HoaiMyNeural', name: 'Hoài My', gender: 'Nữ', region: 'Bắc', style: 'Tin tức', provider: 'Microsoft (online)' },
    { id: 'edge:vi-VN-NamMinhNeural', name: 'Nam Minh', gender: 'Nam', region: 'Bắc', style: 'Tin tức', provider: 'Microsoft (online)' },
    { id: 'google:vi', name: 'Google', gender: 'Nữ', region: 'Bắc', style: 'Máy', provider: 'Google (online)' },
  ];
}

// ---- VieNeu: one long-lived Python worker, requests queued over stdin/stdout JSON lines
// .replace: python can't read files inside a packaged Electron app.asar
const TTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tts').replace('app.asar', 'app.asar.unpacked');
const WORKER = path.join(TTS_DIR, 'vieneu_worker.py');
// private Python + model built by scripts/bundle-tts.mjs; installed app has it in resources/tts-runtime
const RUNTIME = [process.resourcesPath && path.join(process.resourcesPath, 'tts-runtime'), path.join(TTS_DIR, 'offline')]
  .find(d => d && existsSync(path.join(d, 'python', 'python.exe')));
export const vieneu = {
  state: 'off', // off | loading | ready | missing | error: ...
  proc: null, waiting: new Map(), seq: 0, readyP: null,
  start() {
    if (this.readyP) return this.readyP;
    this.state = 'loading';
    this.readyP = new Promise((resolve, reject) => {
      const py = process.env.PYTHON || (RUNTIME ? path.join(RUNTIME, 'python', 'python.exe') : process.platform === 'win32' ? 'python' : 'python3');
      const env = { ...process.env, PYTHONIOENCODING: 'utf-8', ...(RUNTIME && { HF_HOME: path.join(RUNTIME, 'hf'), HF_HUB_OFFLINE: '1' }) };
      const p = spawn(py, ['-u', WORKER], { stdio: ['pipe', 'pipe', 'pipe'], env, windowsHide: true });
      this.proc = p;
      let log = '';
      p.stderr.on('data', d => { log = (log + d).slice(-2000); });
      p.on('error', () => { this.state = 'missing'; this.readyP = null; reject(new Error('Không tìm thấy Python. Cài Python 3.10+ rồi chạy: pip install vieneu')); });
      p.on('close', () => {
        const err = new Error('VieNeu dừng: ' + (log.split('\n').filter(Boolean).pop() || 'không rõ'));
        if (this.state === 'loading') { this.state = /No module named/.test(log) ? 'missing' : 'error: ' + err.message; reject(err); }
        else this.state = 'off';
        for (const w of this.waiting.values()) w.reject(err);
        this.waiting.clear(); this.readyP = null; this.proc = null;
      });
      createInterface({ input: p.stdout }).on('line', line => {
        let m; try { m = JSON.parse(line); } catch { return; }
        if ('ready' in m) { if (m.ready) { this.state = 'ready'; resolve(); } else { this.state = 'error: ' + m.error; reject(new Error(m.error)); } return; }
        const w = this.waiting.get(m.id); if (!w) return;
        this.waiting.delete(m.id);
        m.ok ? w.resolve() : w.reject(new Error('VieNeu: ' + m.error));
      });
    });
    this.readyP.catch(() => {});
    return this.readyP;
  },
  async say(voice, text, out) {
    await this.start();
    const id = String(++this.seq);
    return new Promise((resolve, reject) => {
      this.waiting.set(id, { resolve, reject });
      this.proc.stdin.write(JSON.stringify({ id, text, voice, out }) + '\n');
    });
  },
};

const xml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);

async function edge(voice, text) {
  const parts = [];
  for (const piece of chunk(text, 1500)) {
    const tts = new MsEdgeTTS();
    try {
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(xml(piece));
      for await (const c of audioStream) parts.push(c);
    } finally { tts.close(); }
  }
  return Buffer.concat(parts);
}

async function google(_voice, text) {
  const parts = [];
  for (const piece of chunk(text, 190)) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=${encodeURIComponent(piece)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`Google TTS lỗi ${res.status}`);
    parts.push(Buffer.from(await res.arrayBuffer()));
  }
  return Buffer.concat(parts);
}

const ONLINE = { edge, google };

export async function synth(voiceId, text, cacheDir) {
  const [p, v] = [voiceId.slice(0, voiceId.indexOf(':')), voiceId.slice(voiceId.indexOf(':') + 1)];
  if (p !== 'vieneu' && !ONLINE[p]) throw new Error(`Không có giọng ${voiceId}`);
  const file = path.join(cacheDir, crypto.createHash('sha1').update(voiceId + '\n' + text).digest('hex') + (p === 'vieneu' ? '.wav' : '.mp3'));
  try { await fs.access(file); return file; } catch {}
  const mp3 = file.replace(/\.wav$/, '.mp3'); // demo seed ships VieNeu audio compressed as mp3
  if (mp3 !== file) try { await fs.access(mp3); return mp3; } catch {}
  await fs.mkdir(cacheDir, { recursive: true });
  if (p === 'vieneu') {
    const tmp = file + '.part.wav';
    await vieneu.say(v, text, tmp);
    await fs.rename(tmp, file);
    return file;
  }
  let buf;
  for (let tries = 0; ; tries++) { // free online endpoints drop connections now and then
    try { buf = await ONLINE[p](v, text); if (buf.length) break; throw new Error('Không nhận được âm thanh'); }
    catch (e) { if (tries >= 2) throw e; await new Promise(r => setTimeout(r, 1000 * (tries + 1))); }
  }
  await fs.writeFile(file, buf);
  return file;
}
