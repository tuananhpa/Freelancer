import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { toSpeech, tidy, applyRules, chunk, DEFAULT_RULES } from '../lib/speech.mjs';
import { textToBlocks, extractText } from '../lib/docparse.mjs';
import { syncTimeline, buildMix, duckExpr } from '../lib/timeline.mjs';

test('pronunciation rules: whole word, longest first, original untouched', () => {
  const src = 'QĐND và Trung đoàn 143, không phải 1430.';
  const rules = [{ from: '143', to: 'X' }, ...DEFAULT_RULES];
  assert.equal(applyRules(src, rules), 'Quân đội nhân dân và Trung đoàn một bốn ba, không phải 1430.');
  assert.equal(src, 'QĐND và Trung đoàn 143, không phải 1430.');
});

test('dates and ranges are read naturally', () => {
  assert.equal(toSpeech('Ngày 16/11/2026, giai đoạn 2015–2020.', []), 'Ngày 16 tháng 11 năm 2026, giai đoạn 2015 đến 2020.');
  assert.equal(toSpeech('Tháng 4/1979 và 6/2011', []), 'tháng 4 năm 1979 và tháng 6 năm 2011');
});

test('tidy fixes spacing and punctuation only', () => {
  assert.equal(tidy('xin  chào ,các đồng chí .hôm nay'), 'Xin chào, các đồng chí. Hôm nay');
});

test('chunk keeps pieces under the limit', () => {
  const text = 'Câu một rất dài. '.repeat(50);
  for (const c of chunk(text, 100)) assert.ok(c.length <= 100);
});

test('doc script splits into numbered segments + music markers', () => {
  const body = 'TRUNG ĐOÀN 143\tCỘNG HÒA\nPHÊ DUYỆT\nI. GIỚI THIỆU\nMời các đồng chí.\n1. Mục một.\n2. Mục hai.\nII. NỘI DUNG\n1. Tin đơn vị.\nNội dung tin.\n[NHẠC: Hành khúc]\n2. Pháp luật.\n1. Điều một.\n2. Điều hai.\nChương trình hôm nay xin tạm dừng.';
  const b = textToBlocks(body);
  assert.deepEqual(b.map(x => x.type), ['jingle', 'voice', 'voice', 'song', 'voice', 'voice', 'jingle']);
  assert.match(b[1].text, /Mục một/);          // intro keeps its own list
  assert.equal(b[2].text, 'Tin đơn vị.\nNội dung tin.');
  assert.equal(b[3].title, 'Hành khúc');
  assert.match(b[4].text, /Điều hai/);          // inner list stays in segment 2
  assert.equal(b[5].title, 'Kết thúc chương trình');
});

test('real client .doc parses', { skip: !fs.existsSync('../c16,17 20-11-2026.doc') }, async () => {
  const b = textToBlocks(await extractText(fs.readFileSync('../c16,17 20-11-2026.doc')));
  assert.equal(b.filter(x => x.type === 'voice').length, 8);
});

const proj = () => ({ bg: { assetId: 'abg', volume: 0.2 }, blocks: [
  { id: 'v1', type: 'voice', title: 'A', text: 'x', approved: true, rate: 1 },
  { id: 'm1', type: 'song', title: 'Bài', assetId: 'asong' },
  { id: 'v2', type: 'voice', title: 'B', text: 'y', approved: true, rate: 2 },
] });
const vinfo = () => new Map([['v1', { src: 'tts/aaaaaa1.wav', srcDur: 10 }], ['v2', { src: 'tts/aaaaaa2.wav', srcDur: 8 }]]);
const adur = new Map([['asong', 30], ['abg', 60]]);

test('first sync lays clips in script order with gaps + auto background', () => {
  const t = syncTimeline(proj(), vinfo(), adur);
  const [v1, m1, v2] = ['v1', 'm1', 'v2'].map(id => t.clips.find(c => c.blockId === id));
  assert.equal(v1.start, 0);
  assert.equal(m1.start, 10.6);
  assert.equal(v2.start, 41.2);
  assert.equal(v2.dur, 4);                       // 8 s at 2x
  const bg = t.clips.find(c => c.track === 'bg');
  assert.equal(bg.dur, 45.2 + 1.5);
});

test('re-sync keeps manual moves, replaces changed audio in place, drops deleted blocks', () => {
  const p = proj();
  p.timeline = syncTimeline(p, vinfo(), adur);
  p.timeline.clips.find(c => c.blockId === 'm1').start = 100;   // user moved the song
  p.timeline.clips.push({ id: 'r', track: 'voice', src: 'assets/rec1234.mp3', start: 5, in: 0, dur: 3, srcDur: 3, rate: 1, volume: 1 });
  const info = vinfo(); info.set('v1', { src: 'tts/bbbbbb1.wav', srcDur: 12 }); // text edited
  p.blocks = p.blocks.filter(b => b.id !== 'v2');
  const t = syncTimeline(p, info, adur);
  assert.equal(t.clips.find(c => c.blockId === 'm1').start, 100);
  const v1 = t.clips.find(c => c.blockId === 'v1');
  assert.deepEqual([v1.start, v1.dur, v1.src], [0, 12, 'tts/bbbbbb1.wav']);
  assert.ok(!t.clips.some(c => c.blockId === 'v2'));
  assert.ok(t.clips.some(c => c.id === 'r'));     // recording untouched
});

test('background ducks only while music overlaps', () => {
  const bg = { track: 'bg', start: 0, dur: 60 };
  assert.equal(duckExpr(bg, [bg]), '1');
  const e = duckExpr(bg, [bg, { track: 'music', start: 10, dur: 5 }, { track: 'voice', start: 0, dur: 9 }]);
  const at = t => Function('t', 'clip', 'return ' + e)(t, (x, a, b) => Math.min(b, Math.max(a, x)));
  assert.equal(at(5), 1); assert.equal(at(12), 0); assert.equal(at(9.75), 0.5); assert.equal(at(20), 1);
});

test('mix graph: one chain per clip, loop + tempo + delay', () => {
  const clips = [
    { track: 'voice', src: 'tts/aaaaaa1.wav', start: 1.5, in: 2, dur: 3, rate: 1.25, volume: 1, fadeIn: 0, fadeOut: 0.5 },
    { track: 'bg', src: 'assets/bgbgbg.mp3', start: 0, in: 0, dur: 10, rate: 1, volume: 0.2, loop: true, fadeIn: 1, fadeOut: 0 },
  ];
  const m = buildMix(clips, s => '/x/' + s);
  assert.deepEqual(m.inputs, ['-i', '/x/tts/aaaaaa1.wav', '-stream_loop', '-1', '-i', '/x/assets/bgbgbg.mp3']);
  assert.match(m.filter, /atempo=1.25,atrim=start=2:duration=3,.*adelay=1500:all=1\[c0\]/);
  assert.match(m.filter, /amix=inputs=2:normalize=0/);
  assert.equal(m.total, 10.5);
});
