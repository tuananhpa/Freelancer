import api from '../services/api';

interface ExportQuestion {
  content: string; questionType: string; points: number;
  options?: { content: string; isCorrect?: boolean }[];
  correctAnswer?: string; expectedAnswer?: string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const LETTER = 'ABCDEFGH';
const pts = (n: number) => `${String(n).replace('.', ',')} điểm`;

/** Dựng file Word (.doc dạng HTML, mở được bằng Word/Google Docs): trang đề + trang đáp án. */
export function buildExamDoc(exam: { title: string; durationMinutes: number; subject?: string; grade?: string; examCode?: string; questions: ExportQuestion[] }) {
  const qHtml = exam.questions.map((q, i) => {
    const head = `<p><b>Câu ${i + 1}</b> <i>(${pts(q.points)})</i>. ${q.content.replace(/^<p>|<\/p>$/g, '')}</p>`;
    if (q.questionType === 'MULTIPLE_CHOICE') return head + `<p style="margin-left:24px">${(q.options || []).map((o, j) => `${LETTER[j]}. ${esc(o.content)}`).join('&nbsp;&nbsp;&nbsp;&nbsp;')}</p>`;
    if (q.questionType === 'TRUE_FALSE') return head + `<table border="1" cellpadding="4" style="border-collapse:collapse;margin-left:24px"><tr><th>Nhận định</th><th>Đúng</th><th>Sai</th></tr>${(q.options || []).map((o, j) => `<tr><td>${'abcd'[j] || j + 1}) ${esc(o.content)}</td><td>&nbsp;</td><td>&nbsp;</td></tr>`).join('')}</table>`;
    const lines = q.questionType === 'ESSAY' ? 8 : 2;
    return head + '<p style="margin-left:24px;color:#999">' + '.'.repeat(110) + '<br>'.repeat(1) + ('.'.repeat(110) + '<br>').repeat(lines - 1) + '</p>';
  }).join('\n');
  const key = exam.questions.map((q, i) => {
    let a = '';
    if (q.questionType === 'MULTIPLE_CHOICE') a = LETTER[(q.options || []).findIndex((o) => o.isCorrect)] || '?';
    else if (q.questionType === 'TRUE_FALSE') a = (q.options || []).map((o, j) => `${'abcd'[j]}) ${o.isCorrect ? 'Đ' : 'S'}`).join('  ');
    else a = esc(q.correctAnswer || q.expectedAnswer || '(giáo viên chấm)');
    return `<tr><td>Câu ${i + 1}</td><td>${a}</td><td>${pts(q.points)}</td></tr>`;
  }).join('');
  const total = exam.questions.reduce((s, q) => s + q.points, 0);
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(exam.title)}</title>
<style>body{font-family:"Times New Roman",serif;font-size:13pt;line-height:1.5}h1{font-size:15pt;text-align:center;margin:0}h2{font-size:14pt}.meta{text-align:center}td,th{font-size:12pt}</style></head><body>
<table width="100%"><tr><td>TRƯỜNG: ..............................<br>Lớp: ........ Họ tên: ..............................</td><td align="right">Mã đề: <b>${esc(exam.examCode || '')}</b></td></tr></table>
<h1>${esc(exam.title.toUpperCase())}</h1><p class="meta">Môn: ${esc(exam.subject || '')} ${exam.grade ? '· Lớp ' + esc(exam.grade) : ''} · Thời gian: ${exam.durationMinutes} phút · Tổng: ${pts(total)}</p><hr>
${qHtml}
<p align="center">— HẾT —</p>
<br style="page-break-before:always" clear="all">
<h2>ĐÁP ÁN VÀ THANG ĐIỂM</h2><table border="1" cellpadding="6" style="border-collapse:collapse" width="100%"><tr><th>Câu</th><th>Đáp án / ý chính</th><th>Điểm</th></tr>${key}</table>
</body></html>`;
}

export async function downloadExamWord(examId: string) {
  const { data } = await api.get(`/exams/${examId}`);
  const html = buildExamDoc(data);
  const url = URL.createObjectURL(new Blob(['﻿', html], { type: 'application/msword' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `De_${(data.examCode || data.title).replace(/[^\p{L}\p{N}]+/gu, '_')}.doc`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

console.assert(buildExamDoc({ title: 't', durationMinutes: 15, questions: [{ content: 'x', questionType: 'MULTIPLE_CHOICE', points: 1, options: [{ content: 'a' }, { content: 'b', isCorrect: true }] }] }).includes('<td>B</td>'), 'buildExamDoc: đáp án trắc nghiệm');
