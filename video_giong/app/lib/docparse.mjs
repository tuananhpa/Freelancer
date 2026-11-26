// Word script (.doc / .docx) -> program blocks.
// Rules (fit the unit's script layout, e.g. "c16,17 20-11-2026.doc"):
//  - everything before the "I. ..." heading is the approval header: dropped
//  - roman headings (I., II.) are structure, not read
//  - under "II.", "1." "2." ... in sequence start a new segment (inner lists like
//    the law section's 1. 2. 3. don't match the expected next number, so they stay inside)
//  - a line "[NHẠC: tên]" / "[NHẠC HIỆU]" / "[CA KHÚC: tên]" makes a music slot
//  - "... tạm dừng / hẹn gặp lại" starts the closing segment
import WordExtractor from 'word-extractor';
import { tidy } from './speech.mjs';

const ROMAN = /^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s+/;
const MUSIC = /^\[\s*(nhạc hiệu|nhạc|ca khúc|bài hát)\s*:?\s*([^\]]*)\]$/iu;
const CLOSING = /^(chương trình|buổi phát thanh).*(tạm dừng|kết thúc|hẹn gặp lại)/iu;

let seq = 0;
export const uid = p => `${p}${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export async function extractText(buffer) {
  const doc = await new WordExtractor().extract(buffer);
  return doc.getBody();
}

const voice = (title, lines = []) => ({ id: uid('b'), type: 'voice', title, text: lines.join('\n'), voice: '', rate: 1, volume: 1, approved: false });
const music = (type, title) => ({ id: uid('b'), type, title, assetId: null, volume: 1 });

export function textToBlocks(body) {
  let lines = body.split(/\r?\n/).map(l => l.replace(/[\t ]+/g, ' ').trim()).filter(Boolean);
  const start = lines.findIndex(l => /^I\.\s+/.test(l));
  if (start > 0) lines = lines.slice(start);

  const blocks = [];
  let cur = null;
  let inBody = start < 0; // no "I." heading: treat everything as body
  let next = 1;
  const open = (title, first) => { cur = voice(title, first ? [first] : []); blocks.push(cur); };

  for (const line of lines) {
    const m = line.match(MUSIC);
    if (m) {
      blocks.push(music(/hiệu/iu.test(m[1]) ? 'jingle' : 'song', m[2].trim() || m[1]));
      cur = null;
      continue;
    }
    const roman = line.match(ROMAN);
    if (roman) {
      if (roman[1] === 'II') inBody = true;
      else if (roman[1] === 'I') open(tidy(line.slice(roman[0].length)) || 'Giới thiệu');
      if (roman[1] === 'II') cur = null;
      continue;
    }
    const num = line.match(/^(\d+)\.\s+/);
    if (inBody && num && Number(num[1]) === next) {
      next++;
      // numbering is for the script, the announcer doesn't read "1."
      const t = line.slice(num[0].length);
      open(`${num[1]}. ${t.length > 60 ? t.slice(0, 60).trim() + '…' : t}`, t);
      continue;
    }
    if (inBody && CLOSING.test(line) && cur && !/^Kết thúc/.test(cur.title)) {
      open('Kết thúc chương trình', line);
      continue;
    }
    if (!cur) open(blocks.length ? 'Lời đọc' : 'Mở đầu', null);
    cur.text += (cur.text ? '\n' : '') + line;
  }
  for (const b of blocks) if (b.type === 'voice') b.text = tidy(b.text);
  return [music('jingle', 'Nhạc hiệu mở đầu'), ...blocks.filter(b => b.type !== 'voice' || b.text), music('jingle', 'Nhạc hiệu kết thúc')];
}
