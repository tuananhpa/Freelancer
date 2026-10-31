import type { Bindings } from '../types';
import { one } from '../db';

/* ---- Mã hóa khóa API (AES-GCM, khóa từ secret AI_KEY_ENCRYPTION_KEY) ---- */
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const aesKey = (env: Bindings) => {
  const raw = unb64(env.AI_KEY_ENCRYPTION_KEY || '');
  if (raw.length !== 32) throw new Error('AI_KEY_ENCRYPTION_KEY phải là 32 byte base64');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
};
export async function encryptSecret(env: Bindings, plain: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(env), new TextEncoder().encode(plain)));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv); out.set(ct, iv.length);
  return b64(out);
}
export async function decryptSecret(env: Bindings, enc: string) {
  const all = unb64(enc);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(0, 12) }, await aesKey(env), all.slice(12));
  return new TextDecoder().decode(pt);
}

export interface AiSettings { provider: 'GEMINI' | 'OPENAI'; model: string; apiKey: string | null; strictness: string; autoGradeOnSubmit: boolean; requireTeacherReview: boolean }

/** Khóa AI dùng chung toàn trường (school_settings), dự phòng secret GEMINI_API_KEY/OPENAI_API_KEY */
export async function aiSettings(env: Bindings): Promise<AiSettings> {
  const s = await one<any>(env, 'SELECT * FROM school_settings WHERE id = 1');
  const provider = (s?.provider || 'GEMINI') as AiSettings['provider'];
  let apiKey: string | null = null;
  if (s?.api_key_enc) { try { apiKey = await decryptSecret(env, s.api_key_enc); } catch { apiKey = null; } }
  apiKey ||= (provider === 'OPENAI' ? env.OPENAI_API_KEY : env.GEMINI_API_KEY) || null;
  return { provider, model: s?.model || (provider === 'OPENAI' ? 'gpt-4o-mini' : 'gemini-2.5-flash'), apiKey, strictness: s?.strictness || 'STANDARD', autoGradeOnSubmit: s ? !!s.auto_grade_on_submit : true, requireTeacherReview: s ? !!s.require_teacher_review : true };
}

const STRICT_HINT: Record<string, string> = {
  LENIENT: 'Chấm nhẹ tay: ghi nhận ý đúng dù diễn đạt chưa trọn vẹn.',
  STANDARD: 'Chấm chuẩn: bám sát đáp án và thang điểm.',
  STRICT: 'Chấm khắt khe: trừ điểm diễn đạt, chính tả, thiếu dẫn chứng.',
};

/** Gọi Gemini hoặc OpenAI, yêu cầu trả JSON; timeout 30 giây */
/** file: ảnh/PDF gửi kèm (đọc đề scan) */
export async function callJsonAI(s: AiSettings, prompt: string, geminiSchema?: unknown, file?: { mime: string; base64: string; name: string }): Promise<any> {
  if (!s.apiKey) throw new Error('NO_KEY');
  const signal = AbortSignal.timeout(file ? 90_000 : 30_000);
  if (s.provider === 'OPENAI') {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', signal, headers: { Authorization: `Bearer ${s.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: s.model, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'Chỉ trả về một đối tượng JSON hợp lệ.' }, { role: 'user', content: file ? [file.mime === 'application/pdf' ? { type: 'file', file: { filename: file.name, file_data: `data:${file.mime};base64,${file.base64}` } } : { type: 'image_url', image_url: { url: `data:${file.mime};base64,${file.base64}` } }, { type: 'text', text: prompt }] : prompt }] }),
    });
    if (!r.ok) throw new Error(`OPENAI_${r.status}`);
    const j: any = await r.json();
    return JSON.parse(j.choices?.[0]?.message?.content ?? 'null');
  }
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(s.model)}:generateContent`, {
    method: 'POST', signal, headers: { 'x-goog-api-key': s.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [...(file ? [{ inline_data: { mime_type: file.mime, data: file.base64 } }] : []), { text: prompt }] }], generationConfig: { responseMimeType: 'application/json', ...(geminiSchema ? { responseSchema: geminiSchema } : {}) } }),
  });
  if (!r.ok) throw new Error(`GEMINI_${r.status}`);
  const j: any = await r.json();
  const text = j.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('EMPTY');
  return JSON.parse(text);
}

export interface EssayGradeResult { score: number; summary: string; strengths: string[]; errors: { original: string; corrected: string; type: string }[]; vocabularySuggestions: string[] }
const simple = (score: number, summary: string): EssayGradeResult => ({ score, summary, strengths: [], errors: [], vocabularySuggestions: [] });
const errType = (t: string) => { const l = (t || '').toLowerCase(); return /chính tả|spelling/.test(l) ? 'Chính tả' : /từ vựng|vocabulary|word/.test(l) ? 'Từ vựng' : /nội dung|content|task/.test(l) ? 'Nội dung' : 'Ngữ pháp'; };

const ESSAY_SCHEMA = {
  type: 'OBJECT', required: ['score', 'summary'],
  properties: { score: { type: 'NUMBER' }, summary: { type: 'STRING' }, strengths: { type: 'ARRAY', items: { type: 'STRING' } }, vocabularySuggestions: { type: 'ARRAY', items: { type: 'STRING' } },
    errors: { type: 'ARRAY', items: { type: 'OBJECT', required: ['original', 'corrected', 'type'], properties: { original: { type: 'STRING' }, corrected: { type: 'STRING' }, type: { type: 'STRING' } } } } },
};

/**
 * ExamAIService.gradeEssay: điểm AI luôn là điểm nháp, giáo viên duyệt mới chính thức.
 * Thêm so với Java: đưa đáp án mẫu/hướng dẫn chấm của giáo viên (explanation) vào lời nhắc — yêu cầu "chấm theo đáp án giáo viên".
 */
export async function gradeEssay(env: Bindings, q: { content: string; expected?: string | null }, answer: string | null, maxPoints: number, subject: string | null): Promise<EssayGradeResult> {
  if (!answer || !answer.trim()) return simple(0, 'Bạn chưa nhập câu trả lời.');
  const s = await aiSettings(env);
  if (!s.apiKey) return simple(0, 'Chưa cấu hình AI chấm bài. Bài sẽ được giáo viên chấm thủ công.');
  const prompt = `Bạn là giám khảo giàu kinh nghiệm môn ${subject || 'liên quan'}. Đánh giá công tâm, có tính sư phạm câu trả lời tự luận của học sinh. Kết quả là điểm NHÁP để giáo viên duyệt.
${STRICT_HINT[s.strictness] || STRICT_HINT.STANDARD}

Đề bài: ${q.content.replace(/<[^>]+>/g, ' ')}
${q.expected ? `Đáp án mẫu / hướng dẫn chấm của giáo viên (chấm bám theo đây): ${q.expected.replace(/<[^>]+>/g, ' ')}\n` : ''}Bài làm của học sinh: ${answer}
Thang điểm tối đa: ${maxPoints}

Yêu cầu: rà từng câu, mọi lỗi (ngữ pháp, từ vựng, chính tả, nội dung) phải có trong "errors" với original (nguyên văn), corrected, type ∈ {Ngữ pháp, Từ vựng, Chính tả, Nội dung}. Không nhận xét có lỗi mà để errors rỗng. "strengths" không trích câu có lỗi. Mọi nhận xét viết bằng tiếng Việt.
Trả JSON: { "score": số 0..${maxPoints}, "summary": "1-2 câu", "strengths": [2-4 ý], "errors": [...], "vocabularySuggestions": [0-3 gợi ý "[cũ] → [mới] (lý do)"] }`;
  try {
    const r = await callJsonAI(s, prompt, ESSAY_SCHEMA);
    const score = Math.max(0, Math.min(Number(r?.score) || 0, maxPoints));
    return { score: Math.round(score * 100) / 100, summary: String(r?.summary ?? ''), strengths: Array.isArray(r?.strengths) ? r.strengths.map(String) : [],
      errors: Array.isArray(r?.errors) ? r.errors.map((e: any) => ({ original: String(e.original ?? ''), corrected: String(e.corrected ?? ''), type: errType(e.type) })) : [],
      vocabularySuggestions: Array.isArray(r?.vocabularySuggestions) ? r.vocabularySuggestions.map(String) : [] };
  } catch (e) {
    return simple(0, e instanceof Error && e.name === 'TimeoutError' ? 'AI đang quá tải hoặc có lỗi xảy ra. Bài thi sẽ được chấm tay sau.' : 'Không thể chấm điểm tự động. Bài thi sẽ được chấm tay sau.');
  }
}
