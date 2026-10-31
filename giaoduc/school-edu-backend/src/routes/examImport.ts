import { Hono } from 'hono';
import { getDocumentProxy } from 'unpdf';
import type { AppEnv, Bindings } from '../types';
import { bad, raw } from '../lib/http';
import { auth } from '../lib/auth';
import { aiSettings, callJsonAI } from '../lib/ai';

/* ===== ExamTextParser: tách đề trắc nghiệm theo cấu trúc "Câu 1 / A. B. C. D. / Đáp án" ===== */
type Opt = { id: null; content: string; isCorrect: boolean };
type Passage = { id: string; instruction: string; content: string; questionNumbers: number[] };
type SQ = { sourceNumber: number; sectionId: string | null; stem: string; points: number; questionType: string; skillTag: string; options: Opt[] };
type Block = { n: number; sectionId: string | null; text: string; options: { letter: string; content: string }[] };

const QUESTION_BOUNDARY = /(?:^|\n|\t|\s{2,})(?:Question|Câu|Q)?\s*(\d+)\s*[.):-]\s+/gim;
const OPTION_LINE = /^\s*([A-D])\s*[.):-]\s*(.+)$/;
const OPTION_MARKER = /(?:^|\n|\t|\s{2,})([A-D])\s*[.):-]\s+/gm;
const SECTION_CUT = /\n\s*(?:(?:For\s+questions.*?\s*)?(?:Read\b.*?(?:following|passage|text|advertisement|leaflet)|Mark\b.*?(?:letter|option)|Choose\b.*?(?:correct|answer)|Complete\b.*?(?:following|sentence))|URANUS|Question \d|THE END)/im;
const RANGE = /(?:from\s+\(?(\d+)\)?\s+to\s+\(?(\d+)\)?|questions\s+(\d+)\s*-\s*(\d+))/i;
const BLANK_NUMBER = /\((\d+)\)\s*_{2,}/g;
const KEY_HEADER = /(đáp\s*án|answer\s*key|key\s*đáp\s*án|bảng\s*đáp\s*án)\s*:?\s*$/i;
const KEY_ENTRY = /(\d+)\s*[.):-]?\s*([A-Da-d])/g;
const INSTRUCTION = /(?:Read|Mark|Choose|Complete)\b/i;
const esc = (t: string | null) => (t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sp = (t: string) => t.replace(/\s+/g, ' ').trim();

const BOILER = [/^URANUS DEVELOPING AND TRAINING CENTER$/i, /^URANUS – Developing and Training Center$/i, /^CS1:.*$/i, /^0?\d{1,2}$/, /^LỚP \d+$/i, /^ĐỀ KHẢO SÁT.*$/i, /^Môn:.*$/i, /^Thời gian:.*$/i, /^THE END.*$/i];
const isBoiler = (l: string) => l.trim() !== '' && BOILER.some((r) => r.test(l));
const stripBoiler = (t: string) => t.split('\n').filter((l) => !isBoiler(l.trim())).join('\n').trim();

function extractAnswerKey(text: string) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => KEY_HEADER.test(l.trim()));
  const sec = start >= 0 ? lines.slice(start).join('\n') : text.length > 2000 ? text.slice(-2000) : text;
  const key = new Map<number, string>();
  for (const m of sec.matchAll(KEY_ENTRY)) key.set(+m[1], m[2].toUpperCase());
  return key;
}
function stripAnswerKey(text: string) {
  const lines = text.split('\n');
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 30); i--) if (KEY_HEADER.test(lines[i].trim())) return lines.slice(0, i).join('\n').trim();
  return text;
}
function followingNumbers(lines: string[], from: number) {
  const nums: number[] = [];
  for (let j = from; j < lines.length; j++) {
    const p = lines[j].trim();
    if (!p) continue;
    if (INSTRUCTION.test(p) || /For questions\s+\d+/i.test(p)) break;
    const m = p.match(/^Question\s+(\d+)/i);
    if (m) nums.push(+m[1]);
    else if (nums.length) break;
  }
  return nums;
}
function extractPassages(text: string) {
  const out: Passage[] = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!INSTRUCTION.test(line) && !/For questions\s+\d+/i.test(line)) continue;
    let instruction = line;
    let j = i + 1;
    while (j < lines.length && !lines[j].trim()) j++;
    if (j < lines.length && !/^Question\s+\d+/i.test(lines[j].trim()) && !/^Mark the letter/i.test(lines[j].trim()) && !RANGE.test(instruction) && RANGE.test(lines[j])) instruction += ` ${lines[j++].trim()}`;
    const rm = instruction.match(RANGE);
    const from = rm ? +(rm[1] ?? rm[3]) : 0, to = rm ? +(rm[2] ?? rm[4]) : 0;
    const parts: string[] = [];
    for (; j < lines.length; j++) {
      const p = lines[j].trim();
      if (!p) continue;
      if (/^Question\s+\d+/i.test(p) || /(?:Mark|Choose|Complete)\b/i.test(p)) break;
      if (isBoiler(p)) continue;
      parts.push(sp(p));
    }
    const content = parts.join(' ').trim();
    if (!content) continue;
    const blanks = [...new Set([...content.matchAll(BLANK_NUMBER)].map((m) => +m[1]))].sort((a, b) => a - b);
    const nums = blanks.length ? blanks : from > 0 && to >= from ? Array.from({ length: to - from + 1 }, (_, k) => from + k) : followingNumbers(lines, j);
    if (!nums.length) continue;
    out.push({ id: crypto.randomUUID(), instruction: instruction.trim(), content, questionNumbers: nums });
    i = j - 1;
  }
  return out;
}
function findOptionsStart(chunk: string) {
  const a = /^\s*A\s*[.):-]\s+/m.exec(chunk);
  if (a) return a.index;
  const b = /\sA\s*[.):-]\s+/.exec(chunk);
  return b ? b.index : -1;
}
function inlineOptions(text: string) {
  if (!text.trim()) return [];
  const ms = [...text.matchAll(OPTION_MARKER)];
  const out: { letter: string; content: string }[] = [];
  for (let i = 0; i < ms.length && i < 8; i++) {
    const content = text.slice(ms[i].index! + ms[i][0].length, i + 1 < ms.length ? ms[i + 1].index : text.length).trim();
    if (content) out.push({ letter: ms[i][1].toUpperCase(), content });
  }
  return out;
}
function lineOptions(chunk: string) {
  const out: { letter: string; content: string }[] = [];
  for (const line of chunk.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const m = t.match(OPTION_LINE);
    if (m) out.push({ letter: m[1].toUpperCase(), content: m[2].trim() });
    else { const inl = inlineOptions(t); if (inl.length >= 2) out.push(...inl); }
  }
  return out;
}
/** Giữ xuống dòng cho câu sắp xếp (a. b. c. d. e.) */
function formatStem(text: string) {
  if (!text.trim()) return text;
  const items = text.match(/(?:^|\s)([a-e]|[ivx]+)\s*[.:]/gi)?.length ?? 0;
  if (items < 2) return sp(text);
  const parts = text.includes('\n') ? text.split('\n') : text.trim().split(/(?=\s*(?:[a-e]|[ivx]+)\s*[.:])/i);
  return parts.map((p) => p.trim()).filter(Boolean).map(sp).join('\n');
}
function parseChunk(raw: string, n: number): Block {
  const chunk = stripBoiler(raw);
  const os = findOptionsStart(chunk);
  let q = os >= 0 ? chunk.slice(0, os).trim() : chunk.trim();
  // Java giữ khoảng trắng đầu nên mất đáp án A khi đáp án viết cùng dòng câu hỏi; bỏ khoảng trắng để nhận đủ A-D
  let options = inlineOptions(os >= 0 ? chunk.slice(os).trimStart() : '');
  if (options.length < 2) {
    options = lineOptions(chunk);
    if (options.length >= 2) { const m = new RegExp(`\\b${options[0].letter}\\s*[.):-]\\s*`).exec(chunk); q = m ? chunk.slice(0, m.index).trim() : ''; }
  }
  return { n, sectionId: null, text: q ? formatStem(q) : `Câu ${n}`, options };
}
function splitQuestions(body: string) {
  const ms = [...body.matchAll(QUESTION_BOUNDARY)];
  const blocks: Block[] = [];
  ms.forEach((m, i) => {
    let chunk = body.slice(m.index! + m[0].length, i + 1 < ms.length ? ms[i + 1].index : body.length).trim();
    const cut = SECTION_CUT.exec(chunk);
    if (cut && findOptionsStart(chunk.slice(0, cut.index)) >= 0) chunk = chunk.slice(0, cut.index).trim();
    if (chunk) blocks.push(parseChunk(chunk, +m[1]));
  });
  return blocks;
}
function sanitizeOptions(raw: Block['options']) {
  const map = new Map<string, Block['options'][number]>();
  for (const o of raw) { if (o.letter >= 'A' && o.letter <= 'D' && !map.has(o.letter)) map.set(o.letter, o); if (map.size === 4) break; }
  const abcd = ['A', 'B', 'C', 'D'].filter((l) => map.has(l)).map((l) => map.get(l)!);
  const res = abcd.length >= 2 ? abcd : raw.slice(0, 4);
  return res.map((o) => { const m = /\s{2,}(?:Read |URANUS|Question |Mark the|THE END)/i.exec(o.content); return { ...o, content: sp(m ? o.content.slice(0, m.index) : o.content) }; });
}
export function parseStructured(rawText: string) {
  if (!rawText?.trim()) return { passages: [] as Passage[], questions: [] as SQ[] };
  const text = stripBoiler(rawText.replace(/\u00a0/g, ' ').replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n').trim());
  const key = extractAnswerKey(text);
  const body = stripAnswerKey(text);
  const passages = extractPassages(body);
  const q2s = new Map<number, string>();
  for (const p of passages) for (const n of p.questionNumbers) q2s.set(n, p.id);
  const blocks = splitQuestions(body).sort((a, b) => a.n - b.n);
  const seen = new Set<number>();
  const questions: SQ[] = [];
  for (const b of blocks) {
    if (seen.has(b.n)) continue;
    seen.add(b.n);
    b.sectionId = q2s.get(b.n) ?? null;
    const stem = b.text === `Câu ${b.n}` || (b.sectionId && b.text.length < 20) ? `Question ${b.n}.` : b.text;
    const opts = sanitizeOptions(b.options);
    if (opts.length < 2) continue;
    const k = key.get(b.n);
    questions.push({ sourceNumber: b.n, sectionId: b.sectionId, stem: esc(stem).replace(/\n/g, '<br/>'), points: 1, questionType: 'MULTIPLE_CHOICE', skillTag: 'GENERAL', options: opts.map((o) => ({ id: null, content: esc(o.content), isCorrect: !!k && o.letter === k })) });
  }
  const pts = questions.length ? Math.round((10 / questions.length) * 100) / 100 : 1;
  questions.forEach((q) => { q.points = pts; });
  return { passages, questions };
}
export function toLegacy(r: ReturnType<typeof parseStructured>) {
  const pm = new Map(r.passages.map((p) => [p.id, p]));
  return r.questions.map((q) => ({ id: null, content: `${q.sectionId && pm.has(q.sectionId) ? `${esc(pm.get(q.sectionId)!.content)}\n\n` : ''}${esc(q.stem)}`, points: q.points, questionType: q.questionType, skillTag: q.skillTag, orderIndex: q.sourceNumber - 1, options: q.options }));
}
{
  const r = parseStructured('Câu 1. She ___ to school.\nA. go\nB. goes\nC. going\nD. gone\nCâu 2: 2 + 2 = ?  A. 3  B. 4  C. 5  D. 6\nĐáp án:\n1B 2B');
  console.assert(r.questions.length === 2 && r.questions[0].options[1].isCorrect && r.questions[1].options.map((o) => o.content).join() === '3,4,5,6' && r.questions[1].options[1].isCorrect && r.questions[0].points === 5, 'parseStructured');
}

/* ===== Đọc chữ từ tệp ===== */
/** Giải nén một mục trong ZIP (DOCX) bằng DecompressionStream, không cần thư viện */
async function unzipEntry(buf: Uint8Array, name: string) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('ZIP');
  let p = dv.getUint32(eocd + 16, true);
  const total = dv.getUint16(eocd + 10, true);
  for (let n = 0; n < total; n++) {
    const method = dv.getUint16(p + 10, true), size = dv.getUint32(p + 20, true), nameLen = dv.getUint16(p + 28, true), extra = dv.getUint16(p + 30, true), cmt = dv.getUint16(p + 32, true), local = dv.getUint32(p + 42, true);
    if (new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nameLen)) === name) {
      const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
      const data = buf.subarray(start, start + size);
      if (method === 0) return new TextDecoder().decode(data);
      return await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    }
    p += 46 + nameLen + extra + cmt;
  }
  throw new Error('ZIP');
}
/** XWPFWordExtractor: đoạn → xuống dòng, ô bảng/tab → \t */
export const docxXmlToText = (xml: string) => xml.replace(/<w:tab\/>/g, '\t').replace(/<w:br[^>]*\/>/g, '\n').replace(/<\/w:tc>/g, '\t').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&amp;/g, '&');
console.assert(docxXmlToText('<w:p><w:r><w:t>Câu 1 &amp; 2</w:t></w:r></w:p><w:p><w:t>A.</w:t><w:tab/><w:t>x</w:t></w:p>') === 'Câu 1 & 2\nA.\tx\n', 'docxXmlToText');
async function docxText(file: File) {
  try { return docxXmlToText(await unzipEntry(new Uint8Array(await file.arrayBuffer()), 'word/document.xml')); } catch { throw bad('Không đọc được file Word. Hãy lưu lại dạng .docx rồi thử lại.'); }
}
async function pdfText(file: File) {
  try {
    // Như PDFTextStripper: đổi dòng khi toạ độ y thay đổi (extractText của unpdf gộp hết thành một dòng)
    const doc = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
    let out = '';
    for (let p = 1; p <= doc.numPages; p++) {
      let lastY: number | null = null;
      for (const it of (await (await doc.getPage(p)).getTextContent()).items as any[]) {
        if (typeof it.str !== 'string') continue;
        const y = it.transform?.[5];
        if (lastY != null && y != null && Math.abs(y - lastY) > 1 && !out.endsWith('\n')) out += '\n';
        out += it.str + (it.hasEOL ? '\n' : '');
        if (y != null) lastY = y;
      }
      out += '\n';
    }
    return out;
  } catch { throw bad('Không đọc được file PDF.'); }
}
function b64(bytes: Uint8Array) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
console.assert(b64(new TextEncoder().encode('Đề')) === btoa(String.fromCharCode(...new TextEncoder().encode('Đề'))), 'b64');

/* ===== AI Scan ===== */
const AI_FORMAT = '{"questions":[{"content":"...","points":1.0,"questionType":"MULTIPLE_CHOICE","skillTag":"GENERAL","options":[{"content":"...","isCorrect":true},{"content":"...","isCorrect":false}]}]}';
async function aiQuestions(env: Bindings, prompt: string, file?: { mime: string; base64: string; name: string }) {
  const s = await aiSettings(env);
  if (!s.apiKey) throw bad('Chưa cấu hình khóa AI. Quản trị viên vào Cài đặt AI để thêm khóa.');
  let out: any;
  try { out = await callJsonAI(s, prompt, undefined, file); } catch (e) { throw bad(`Lỗi AI: ${(e as Error).message}`); }
  const list: any[] = Array.isArray(out) ? out : Array.isArray(out?.questions) ? out.questions : [];
  // normalizeParsedQuestions: mặc định điểm/loại, đúng một đáp án đúng (không rõ thì A)
  return list.filter((q) => q && typeof q.content === 'string').slice(0, 300).map((q, i) => {
    const options = (Array.isArray(q.options) ? q.options : []).map((o: any) => ({ id: null, content: String(o?.content ?? ''), isCorrect: o?.isCorrect === true }));
    if (options.length && options.filter((o: Opt) => o.isCorrect).length !== 1) options.forEach((o: Opt, k: number) => { o.isCorrect = k === 0; });
    return { id: null, content: q.content, points: Number(q.points) || 1, questionType: q.questionType || 'MULTIPLE_CHOICE', skillTag: q.skillTag || 'GENERAL', orderIndex: i, options };
  });
}
const keyed = (qs: { options: Opt[] }[]) => qs.filter((q) => q.options?.filter((o) => o.isCorrect).length === 1).length;
const MAX = 15 * 1024 * 1024;
async function getFile(c: any) {
  const f = (await c.req.formData()).get('file');
  if (!(f instanceof File) || !f.size) throw bad('Vui lòng tải lên file đề thi.');
  if (f.size > MAX) throw bad('File đề tối đa 15 MB.');
  return f;
}
async function structure(c: any) {
  const f = await getFile(c);
  const lower = f.name.toLowerCase();
  if (!lower.endsWith('.pdf') && !lower.endsWith('.docx')) throw bad('Mapping cấu trúc chỉ hỗ trợ file PDF hoặc DOCX có text.');
  const text = lower.endsWith('.pdf') ? await pdfText(f) : await docxText(f);
  if (!text.trim()) throw bad('Không đọc được text trong file. Với đề scan/ảnh, hãy dùng "Upload scan bằng AI".');
  const parsed = parseStructured(text);
  if (!parsed.questions.length) throw bad('Không nhận diện được cấu trúc câu hỏi. Đề cần có dạng Câu 1 / A. B. C. D. và bảng đáp án, hoặc thử AI Scan.');
  const questions = toLegacy(parsed);
  return { questions, structuredQuestions: parsed.questions, passages: parsed.passages, sourceFormat: lower.endsWith('.pdf') ? 'PDF' : 'DOCX', fileName: f.name, totalExtracted: questions.length, mappedWithAnswerKey: keyed(parsed.questions), parseMethod: 'AZOTA', message: `Đã nhận diện ${parsed.questions.length} câu · ${parsed.passages.length} đoạn đọc. Vui lòng soát lỗi và chọn đáp án.` };
}

const imp = new Hono<AppEnv>();
imp.use('/import-*', auth('TEACHER', 'TEACHING_ASSISTANT', 'ADMIN'));
imp.post('/import-structure', async (c) => raw(c, await structure(c)));
imp.post('/import-document', async (c) => raw(c, await structure(c)));
imp.post('/import-pdf', async (c) => raw(c, (await structure(c)).questions));
imp.post('/import-ai-scan', async (c) => {
  const f = await getFile(c);
  const lower = f.name.toLowerCase();
  const mime = lower.endsWith('.pdf') ? 'application/pdf' : /\.jpe?g$/.test(lower) ? 'image/jpeg' : lower.endsWith('.png') ? 'image/png' : null;
  let questions;
  if (mime) {
    questions = await aiQuestions(c.env, `Bạn là OCR + trích xuất đề thi trắc nghiệm từ ảnh/PDF scan.
Đọc toàn bộ nội dung, nhận diện câu hỏi và đáp án A/B/C/D.
Trả về JSON duy nhất (không markdown) dạng: ${AI_FORMAT}
Nếu có bảng đáp án (1A 2B...), map isCorrect chính xác. Nếu không có đáp án, mặc định A đúng.`, { mime, base64: b64(new Uint8Array(await f.arrayBuffer())), name: f.name });
  } else if (lower.endsWith('.docx')) {
    const text = await docxText(f);
    if (!text.trim()) throw bad('File Word trống. Hãy xuất PDF/ảnh đề scan để dùng AI.');
    questions = await aiQuestions(c.env, `Trích xuất đề thi trắc nghiệm từ văn bản sau. Trả về JSON duy nhất dạng: ${AI_FORMAT}
Map đáp án đúng nếu có phần KEY/ĐÁP ÁN.
Văn bản:
${text.length > 80_000 ? `${text.slice(0, 80_000)}\n\n[...]` : text}`);
  } else throw bad('AI Scan hỗ trợ PDF, DOCX, JPG, PNG.');
  if (!questions.length) throw bad('AI không trích xuất được câu hỏi. Thử file rõ hơn hoặc dùng mapping cấu trúc.');
  const fmt = lower.endsWith('.pdf') ? 'PDF' : lower.endsWith('.docx') ? 'DOCX' : /\.jpe?g$/.test(lower) ? 'JPG' : 'PNG';
  return raw(c, { questions, structuredQuestions: null, passages: null, sourceFormat: fmt, fileName: f.name, totalExtracted: questions.length, mappedWithAnswerKey: keyed(questions), parseMethod: 'AI_SCAN', message: `AI đã đọc và mapping ${questions.length} câu. Vui lòng kiểm tra lại đáp án.` });
});

export default imp;
