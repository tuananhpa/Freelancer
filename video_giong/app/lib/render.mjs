// Script -> timeline (TTS + layout) and timeline -> MP3 (+ MP4).
// Mixing is one ffmpeg filter graph built from the timeline (lib/timeline.mjs), so clips can
// sit anywhere, overlap, be trimmed, faded, sped up; the background ducks under music.
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import ffmpegStatic from 'ffmpeg-static';
import { synth } from './tts.mjs';
import { toSpeech, tidy, chunk } from './speech.mjs';
import { syncTimeline, buildMix, clipEnd } from './timeline.mjs';

// packaged Electron app: binaries can't run from inside app.asar
const ffmpegPath = ffmpegStatic.replace('app.asar', 'app.asar.unpacked');

export function ffmpeg(args, { cwd, input, onStdout } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, ['-hide_banner', ...args], { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    const out = [], err = [];
    p.stdout.on('data', d => (onStdout ? onStdout(d) : out.push(d)));
    p.stderr.on('data', d => err.push(d));
    p.on('error', reject);
    p.on('close', code => code === 0 ? resolve(Buffer.concat(out)) : reject(new Error(Buffer.concat(err).toString().slice(-800) || `ffmpeg ${code}`)));
    p.stdin.on('error', () => {});
    p.stdin.end(input);
  });
}

// Waveform peaks (20 per second, 0..100) + exact duration; cached next to the file.
export const PEAKS_PER_SEC = 20;
export async function peaks(file) {
  const cache = file + '.peaks.json';
  try { return JSON.parse(await fs.readFile(cache, 'utf8')); } catch {}
  const SR = 8000, step = SR / PEAKS_PER_SEC;
  const buf = await ffmpeg(['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(SR), '-f', 's16le', 'pipe:1']);
  const pcm = new Int16Array(buf.buffer, buf.byteOffset, buf.byteLength >> 1);
  const out = [];
  let top = 1;
  for (let i = 0; i < pcm.length; i += step) {
    let m = 0;
    for (let j = i; j < Math.min(i + step, pcm.length); j++) { const v = Math.abs(pcm[j]); if (v > m) m = v; }
    out.push(m); if (m > top) top = m;
  }
  const res = { duration: pcm.length / SR, pps: PEAKS_PER_SEC, peaks: out.map(v => Math.round((v / top) * 100)) };
  await fs.writeFile(cache, JSON.stringify(res));
  return res;
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } }));
}

/** TTS for approved voice blocks + lay out / update the timeline. Returns {timeline, skipped}. */
export async function syncProject(project, { rules, assetsDir, ttsDir, job = {}, from = 0, to = 100 }) {
  const set = p => Object.assign(job, { phase: 'Tạo giọng đọc', progress: Math.round(from + (to - from) * p) });
  const voice = project.blocks.filter(b => b.type === 'voice' && b.text?.trim());
  const ready = voice.filter(b => b.approved);
  const voiceInfo = new Map();
  const frac = new Map(); // blockId -> 0..1, so one long block still moves the bar
  const tick = (id, f) => { frac.set(id, f); set([...frac.values()].reduce((a, x) => a + x, 0) / ready.length); };
  set(0);
  await pool(ready, 2, async b => {
    const file = await synth(b.voice || project.defaultVoice, toSpeech(b.text, rules), ttsDir, f => tick(b.id, f));
    voiceInfo.set(b.id, { src: 'tts/' + path.basename(file), srcDur: (await peaks(file)).duration });
    tick(b.id, 1);
  });
  const assetDur = new Map();
  for (const id of new Set([...project.blocks.map(b => b.assetId), project.bg?.assetId].filter(Boolean))) {
    try { assetDur.set(id, (await peaks(path.join(assetsDir, id + '.mp3'))).duration); } catch { /* deleted file: block is skipped */ }
  }
  return { timeline: syncTimeline(project, voiceInfo, assetDur), skipped: voice.length - ready.length };
}

const t2ass = s => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = (s % 60).toFixed(2).padStart(5, '0'); return `${h}:${String(m).padStart(2, '0')}:${x}`; };
const assText = s => s.replace(/[{}]/g, '').replace(/\n/g, '\\N');

// Subtitles: script text spread over each voice clip's full source length, cut to what's kept.
export function buildAss(title, clips, blocks, total) {
  const ev = [`Dialogue: 0,${t2ass(0)},${t2ass(total)},Title,,0,0,0,,${assText(title)}`];
  const byId = new Map(blocks.map(b => [b.id, b]));
  const line = (a, b, style, text) => { if (b - a > 0.05) ev.push(`Dialogue: 0,${t2ass(a)},${t2ass(b)},${style},,0,0,0,,${assText(text)}`); };
  for (const c of clips) {
    const s = c.start, e = clipEnd(c);
    if (c.track === 'music') { line(s, e, 'Sub', `♪ ${c.name || 'Âm nhạc'} ♪`); continue; }
    const b = c.track === 'voice' && byId.get(c.blockId);
    if (!b) continue;
    line(s, e, 'Head', b.title || '');
    const pieces = chunk(tidy(b.text), 100);
    const sum = pieces.reduce((a, p) => a + p.length, 0) || 1;
    const full = c.srcDur / (c.rate || 1);
    let at = s - c.in;
    for (const p of pieces) { const d = full * p.length / sum; line(Math.max(s, at), Math.min(e, at + d), 'Sub', p); at += d; }
  }
  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,Arial,38,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,1,0,1,0,0,8,40,40,34,1
Style: Head,Arial,26,&H00B0D9C8,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,8,60,60,150,1
Style: Sub,Arial,40,&H00FFFFFF,&H00FFFFFF,&H00142814,&H80142814,0,0,0,0,100,100,0,0,1,2,0,2,90,90,70,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${ev.join('\n')}
`;
}

const progressOf = (total, cb) => d => { const m = /out_time_us=(\d+)/.exec(d.toString()); if (m) cb(Math.min(1, m[1] / 1e6 / total)); };

/**
 * Sync the timeline with the script, then mix it. saveTimeline(timeline) persists the synced timeline.
 * @returns {mp3, mp4?, duration}
 */
export async function render(project, { rules, assetsDir, ttsDir, outDir, video, job = {}, saveTimeline, resolve }) {
  const voice = project.blocks.filter(b => b.type === 'voice' && b.text?.trim());
  const pending = voice.filter(b => !b.approved);
  if (pending.length) throw new Error(`Còn ${pending.length} đoạn lời đọc chưa duyệt: ${pending.map(b => b.title).slice(0, 3).join('; ')}`);
  await fs.mkdir(outDir, { recursive: true });
  const set = (phase, progress) => Object.assign(job, { phase, progress: Math.round(progress) });

  const { timeline } = await syncProject(project, { rules, assetsDir, ttsDir, job, from: 0, to: 40 });
  await saveTimeline?.(timeline);

  set('Ghép âm thanh', 40);
  const { inputs, filter, total } = buildMix(timeline.clips, resolve);
  const mp3 = path.join(outDir, 'chuong-trinh.mp3');
  const audioShare = video ? 20 : 60;
  await ffmpeg(['-v', 'error', '-y', '-progress', 'pipe:1', ...inputs, '-filter_complex', filter, '-map', '[out]', '-c:a', 'libmp3lame', '-b:a', '192k', mp3],
    { onStdout: progressOf(total, p => set('Ghép âm thanh', 40 + p * audioShare)) });
  const result = { mp3, duration: total };
  if (!video) { set('Xong', 100); return result; }

  set('Dựng video', 60);
  await fs.writeFile(path.join(outDir, 'sub.ass'), '﻿' + buildAss(project.title || 'Chương trình phát thanh', timeline.clips, project.blocks, total));
  const mp4 = path.join(outDir, 'chuong-trinh.mp4');
  const graph = '[0:v]drawbox=x=0:y=0:w=iw:h=110:color=0x1F2E14:t=fill,drawbox=x=0:y=110:w=iw:h=4:color=0xC9A227:t=fill[bgv];' +
    '[1:a]showwaves=s=1280x220:mode=cline:scale=sqrt:rate=15:colors=0xA9C79A[w];[bgv][w]overlay=0:270:shortest=1,ass=sub.ass[v]';
  await ffmpeg(['-v', 'error', '-y', '-progress', 'pipe:1', '-f', 'lavfi', '-i', 'color=c=0x2E4220:s=1280x720:r=15', '-i', 'chuong-trinh.mp3',
    '-filter_complex', graph, '-map', '[v]', '-map', '1:a', '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'stillimage', '-crf', '28',
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', 'chuong-trinh.mp4'], {
    cwd: outDir, // lets the ass filter use a relative path (Windows drive colons break filter syntax)
    onStdout: progressOf(total, p => set('Dựng video', 60 + p * 40)),
  });
  set('Xong', 100);
  return { ...result, mp4 };
}
