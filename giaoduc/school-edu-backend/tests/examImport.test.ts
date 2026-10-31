import { describe, it, expect, beforeAll } from 'vitest';
import { deflateRawSync, crc32 } from 'node:zlib';
import { BASE, login, makeUser } from './helpers';

let teacher = '';
let student = '';
beforeAll(async () => {
  const admin = await login('Admin', 'admin123@');
  teacher = (await makeUser(admin, 'TEACHER')).token;
  student = (await makeUser(admin, 'STUDENT')).token;
});

/** DOCX tối thiểu: zip 1 mục word/document.xml nén deflate */
function docx(paragraphs: string[]) {
  const xml = Buffer.from(`<?xml version="1.0"?><w:document><w:body>${paragraphs.map((p) => `<w:p><w:r><w:t>${p.replace(/&/g, '&amp;')}</w:t></w:r></w:p>`).join('')}</w:body></w:document>`);
  const name = Buffer.from('word/document.xml'), data = deflateRawSync(xml), crc = crc32(xml);
  const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8); local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(xml.length, 22); local.writeUInt16LE(name.length, 26);
  const cen = Buffer.alloc(46); cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(8, 10); cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(data.length, 20); cen.writeUInt32LE(xml.length, 24); cen.writeUInt16LE(name.length, 28); cen.writeUInt32LE(0, 42);
  const cdOff = 30 + name.length + data.length;
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10); end.writeUInt32LE(46 + name.length, 12); end.writeUInt32LE(cdOff, 16);
  return Buffer.concat([local, name, data, cen, name, end]);
}
/** PDF tối thiểu, mỗi dòng một lệnh Tj (chỉ ký tự ASCII) */
function pdf(lines: string[]) {
  const stream = `BT /F1 12 Tf 50 750 Td 14 TL ${lines.map((l) => `(${l.replace(/[()\\]/g, '\\$&')}) Tj T*`).join(' ')} ET`;
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>', `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  let out = '%PDF-1.4\n';
  const offs: number[] = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, 'latin1');
}
const post = async (path: string, bytes: Buffer, name: string, token: string) => {
  const fd = new FormData();
  fd.append('file', new File([bytes], name));
  const r = await fetch(`${BASE}/api/exams${path}`, { method: 'POST', body: fd, headers: { Authorization: `Bearer ${token}` } });
  return { status: r.status, data: await r.json() as any };
};

describe('Nhập đề từ file', () => {
  it('DOCX: nhận Câu / A-D / bảng đáp án, chia đều 10 điểm, có đoạn đọc', async () => {
    const r = await post('/import-structure', docx([
      'ĐỀ KHẢO SÁT CHẤT LƯỢNG', 'Câu 1. She ___ to school every day.', 'A. go', 'B. goes', 'C. going', 'D. gone',
      'Câu 2: Chọn từ đồng nghĩa với "rapid"  A. slow  B. quick  C. heavy  D. late',
      'Read the following passage and answer questions from 3 to 4.', 'Tom wakes up at 6 AM and jogs before breakfast every morning in the park.',
      'Question 3. When does Tom jog?', 'A. After dinner', 'B. Before breakfast', 'C. At noon', 'D. At night',
      'Question 4. Where?', 'A. Park', 'B. Gym', 'C. Home', 'D. School',
      'Đáp án:', '1B 2B 3B 4A',
    ]), 'de.docx', teacher);
    expect(r.status).toBe(200);
    expect(r.data).toMatchObject({ totalExtracted: 4, mappedWithAnswerKey: 4, parseMethod: 'AZOTA', sourceFormat: 'DOCX' });
    expect(r.data.questions[0]).toMatchObject({ content: 'She ___ to school every day.', points: 2.5, options: [{ content: 'go', isCorrect: false }, { content: 'goes', isCorrect: true }, {}, {}] });
    expect(r.data.questions[1].options.map((o: any) => o.content)).toEqual(['slow', 'quick', 'heavy', 'late']);
    expect(r.data.passages[0].questionNumbers).toEqual([3, 4]);
    expect(r.data.questions[2].content).toContain('Tom wakes up');
  });
  it('PDF có chữ cũng nhận được; học sinh bị chặn; đuôi lạ báo lỗi', async () => {
    const r = await post('/import-structure', pdf(['Question 1. 2 + 3 = ?', 'A. 4', 'B. 5', 'C. 6', 'D. 7', 'Answer key:', '1B']), 'de.pdf', teacher);
    expect(r.status).toBe(200);
    expect(r.data.questions[0].options.find((o: any) => o.isCorrect).content).toBe('5');
    expect((await post('/import-structure', pdf(['x']), 'de.pdf', student)).status).toBe(403);
    expect((await post('/import-structure', Buffer.from('x'), 'de.txt', teacher)).status).toBe(400);
    const legacy = await post('/import-pdf', pdf(['Question 1. 2 + 3 = ?', 'A. 4', 'B. 5']), 'a.pdf', teacher);
    expect(Array.isArray(legacy.data)).toBe(true);
  });
  it('AI scan gọi đúng nhà cung cấp; khóa giả bị từ chối rõ ràng', async () => {
    const r = await post('/import-ai-scan', Buffer.from([0x89, 0x50, 0x4e, 0x47]), 'anh.png', teacher);
    expect(r.status).toBe(400);
    expect(r.data.message).toMatch(/AI|khóa/);
  });
});
