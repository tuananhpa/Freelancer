// Synthesised placeholder music for the demo program (no copyrighted material).
// node scripts/demo-music.mjs <outDir>  ->  nhac-hieu-mau.mp3, ca-khuc-mau.mp3, nhac-nen-mau.mp3
import fs from 'node:fs';
import path from 'node:path';
import { ffmpeg } from '../lib/render.mjs';

const SR = 44100;
const hz = n => 440 * 2 ** ((n - 69) / 12); // MIDI note -> Hz
const N = { C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71, C5: 72, D5: 74, E5: 76, F5: 77, G5: 79, C3: 48, F3: 53, G3: 55, A3: 57, C2: 36, F2: 41, G2: 43, A2: 45 };

function track(seconds) { return new Float32Array(Math.ceil(seconds * SR)); }
// additive "brass/pad" voice: harmonics + attack/decay envelope
function note(buf, at, dur, midi, { amp = 0.2, harm = [1, 0.5, 0.33, 0.2], attack = 0.02, release = 0.15, vibrato = 0 } = {}) {
  const f = hz(midi), s0 = Math.floor(at * SR), n = Math.floor((dur + release) * SR);
  for (let i = 0; i < n && s0 + i < buf.length; i++) {
    const t = i / SR;
    const env = Math.min(1, t / attack) * (t > dur ? Math.max(0, 1 - (t - dur) / release) : 1);
    const ph = 2 * Math.PI * f * t + vibrato * Math.sin(2 * Math.PI * 5 * t);
    let v = 0; harm.forEach((h, k) => (v += h * Math.sin((k + 1) * ph)));
    buf[s0 + i] += amp * env * v;
  }
}
function drum(buf, at, { amp = 0.35, low = true } = {}) { // kick (low) or snare (noise)
  const s0 = Math.floor(at * SR);
  for (let i = 0; i < SR * 0.25 && s0 + i < buf.length; i++) {
    const t = i / SR, env = Math.exp(-t * (low ? 18 : 30));
    buf[s0 + i] += amp * env * (low ? Math.sin(2 * Math.PI * (60 + 90 * Math.exp(-t * 40)) * t) : Math.random() * 2 - 1);
  }
}

function jingle() { // ~7 s fanfare
  const b = track(7.5), brass = { amp: 0.16, harm: [1, 0.7, 0.5, 0.35, 0.2], attack: 0.03, vibrato: 0.004 };
  [['G4', 0, 0.22], ['G4', 0.25, 0.22], ['G4', 0.5, 0.22], ['C5', 0.75, 0.9], ['E5', 1.75, 0.45], ['D5', 2.25, 0.22], ['E5', 2.5, 0.22], ['G5', 2.75, 2.6]]
    .forEach(([n, t, d]) => note(b, t, d, N[n], brass));
  for (const m of [N.C4, N.E4, N.G4]) note(b, 2.75, 2.6, m, { ...brass, amp: 0.08, release: 1.2 });
  note(b, 2.75, 2.6, N.C3, { amp: 0.18, harm: [1, 0.3], release: 1.2 });
  for (let t = 0; t < 2.7; t += 0.5) drum(b, t, { amp: 0.25 });
  drum(b, 2.75, { amp: 0.45 }); drum(b, 2.75, { amp: 0.2, low: false });
  return b;
}

function march() { // ~32 s march (melody + bass + drums), 120 bpm
  const beat = 0.5, b = track(33), mel = { amp: 0.13, harm: [1, 0.6, 0.4, 0.25, 0.15], attack: 0.02, vibrato: 0.003 };
  const tune = 'C5 C5 G4 C5 E5 E5 D5 C5 D5 D5 G4 D5 F5 E5 D5 C5'.split(' ');
  const chords = [[N.C3, N.C2], [N.G3, N.G2], [N.F3, N.F2], [N.G3, N.G2]];
  for (let rep = 0; rep < 4; rep++) {
    const t0 = rep * 16 * beat;
    tune.forEach((n, i) => note(b, t0 + i * beat, beat * 0.85, N[n] + (rep === 2 ? 2 : 0), mel));
    for (let bar = 0; bar < 4; bar++) {
      const [c, bass] = chords[bar];
      for (let k = 0; k < 4; k++) {
        const t = t0 + (bar * 4 + k) * beat;
        note(b, t, beat * 0.4, k % 2 ? c + 7 : bass, { amp: 0.16, harm: [1, 0.4, 0.15] });
        drum(b, t, { amp: k % 2 ? 0.18 : 0.3, low: k % 2 === 0 });
      }
    }
  }
  note(b, 32, 0.8, N.C5, { ...mel, release: 0.6 }); note(b, 32, 0.8, N.C3, { amp: 0.2, harm: [1, 0.3], release: 0.6 });
  return b;
}

function pad() { // 32 s soft loopable bed: C - Am - F - G
  const b = track(32), soft = { amp: 0.06, harm: [1, 0.25, 0.08], attack: 1.5, release: 1.5, vibrato: 0.002 };
  [[N.C4, N.E4, N.G4, N.C3], [N.A3, N.C4, N.E4, N.A2], [N.F3, N.A3, N.C4, N.F2], [N.G3, N.B4 - 12, N.D4, N.G2]]
    .forEach((ch, i) => { for (const r of [0, 16]) for (const m of ch) note(b, r + i * 4, 3.2, m, soft); });
  return b;
}

async function save(buf, file) {
  let peak = 0; for (const v of buf) peak = Math.max(peak, Math.abs(v));
  const pcm = new Int16Array(buf.length);
  for (let i = 0; i < buf.length; i++) pcm[i] = (buf[i] / (peak || 1)) * 0.85 * 32767;
  await ffmpeg(['-v', 'error', '-y', '-f', 's16le', '-ar', String(SR), '-ac', '1', '-i', 'pipe:0', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '160k', file], { input: Buffer.from(pcm.buffer) });
}

const out = process.argv[2] || '.';
fs.mkdirSync(out, { recursive: true });
await save(jingle(), path.join(out, 'nhac-hieu-mau.mp3'));
await save(march(), path.join(out, 'ca-khuc-mau.mp3'));
await save(pad(), path.join(out, 'nhac-nen-mau.mp3'));
console.log('ok', out);
