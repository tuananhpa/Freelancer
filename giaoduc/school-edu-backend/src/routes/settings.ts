import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { STAFF } from '../types';
import { ApiError, bad, body, ok, raw } from '../lib/http';
import { auth } from '../lib/auth';
import { one, run } from '../db';
import { nowISO } from '../lib/time';
import { aiSettings, callJsonAI, encryptSecret, gradeEssay } from '../lib/ai';

const MODELS: Record<string, string[]> = { GEMINI: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'], OPENAI: ['gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini'] };
const aiDto = async (env: AppEnv['Bindings'], isAdmin: boolean) => {
  const s = await one<any>(env, 'SELECT * FROM school_settings WHERE id = 1');
  return { provider: s?.provider ?? 'GEMINI', model: s?.model ?? 'gemini-2.5-flash', hasKey: !!s?.api_key_enc || !!env.GEMINI_API_KEY || !!env.OPENAI_API_KEY, keyLast4: s?.key_last4 ?? null,
    strictness: s?.strictness ?? 'STANDARD', autoGradeOnSubmit: s ? !!s.auto_grade_on_submit : true, requireTeacherReview: s ? !!s.require_teacher_review : true, editable: isAdmin, scope: 'SCHOOL' };
};

/** Khóa AI dùng chung toàn trường: giáo viên xem, chỉ ADMIN sửa. Frontend gọi qua /api/users/me/ai-settings */
export const aiRoutes = new Hono<AppEnv>();
aiRoutes.get('/', auth(...STAFF), async (c) => ok(c, await aiDto(c.env, c.get('user').role === 'ADMIN')));
aiRoutes.put('/', auth('ADMIN'), async (c) => {
  const b = await body(c);
  const provider = b.provider === 'OPENAI' ? 'OPENAI' : 'GEMINI';
  const model = MODELS[provider].includes(b.model) ? b.model : MODELS[provider][0];
  const strictness = ['LENIENT', 'STANDARD', 'STRICT'].includes(b.strictness) ? b.strictness : 'STANDARD';
  let enc: string | null = null, last4: string | null = null;
  if (b.apiKey) {
    const k = String(b.apiKey).trim();
    if (k.length < 20 || k.length > 300) throw bad('Khóa API có vẻ chưa đúng.', 'INVALID_KEY');
    enc = await encryptSecret(c.env, k);
    last4 = k.slice(-4);
  }
  await run(c.env, `UPDATE school_settings SET provider = ?, model = ?, strictness = ?, auto_grade_on_submit = ?, require_teacher_review = ?, updated_at = ?${enc ? ', api_key_enc = ?, key_last4 = ?' : ''} WHERE id = 1`,
    provider, model, strictness, b.autoGradeOnSubmit === false ? 0 : 1, b.requireTeacherReview === false ? 0 : 1, nowISO(), ...(enc ? [enc, last4] : []));
  return ok(c, await aiDto(c.env, true));
});
aiRoutes.post('/test', auth('ADMIN'), async (c) => {
  const b = await body(c);
  const saved = await aiSettings(c.env);
  const s = { ...saved, provider: (b.provider === 'OPENAI' ? 'OPENAI' : b.provider === 'GEMINI' ? 'GEMINI' : saved.provider) as 'GEMINI' | 'OPENAI', model: b.model || saved.model, apiKey: b.apiKey ? String(b.apiKey).trim() : saved.apiKey };
  if (!s.apiKey) throw bad('Chưa có khóa API để kiểm tra.', 'NO_KEY');
  try {
    const r = await callJsonAI(s, 'Trả về JSON {"ok": true}.');
    if (!r || r.ok !== true) throw new Error('bad');
    return ok(c, { ok: true, message: `Kết nối được ${s.model}.` });
  } catch (e) {
    const m = e instanceof Error ? e.message : '';
    throw new ApiError(400, 'INVALID_KEY', /_(401|403)$/.test(m) ? 'Khóa API không hợp lệ hoặc không có quyền.' : /_404$/.test(m) ? 'Model không tồn tại với khóa này.' : 'Không kết nối được nhà cung cấp AI.');
  }
});

/** Chấm thử một câu (không lưu) */
export const aiPreview = new Hono<AppEnv>();
aiPreview.post('/grade-preview', auth(...STAFF), async (c) => {
  const b = await body(c);
  const points = Math.max(0.25, Math.min(100, Number(b.points) || 1));
  const g = await gradeEssay(c.env, { content: String(b.question ?? ''), expected: b.expected ? String(b.expected) : null }, String(b.answer ?? ''), points, null);
  return ok(c, { score: g.score, feedback: [g.summary, ...g.strengths.map((s) => `+ ${s}`), ...g.errors.map((e) => `- ${e.type}: "${e.original}" → "${e.corrected}"`)].filter(Boolean).join('\n') });
});

/** Thương hiệu trường: công khai để frontend hiển thị tên/logo/liên hệ; ADMIN sửa */
const brandDto = (s: any) => ({ brandName: s?.brand_name ?? 'Điểm Sáng', logoUrl: s?.logo_url ?? null, contactEmail: s?.contact_email ?? null, contactPhone: s?.contact_phone ?? null, contactAddress: s?.contact_address ?? null });
export const publicSettings = new Hono<AppEnv>();
publicSettings.get('/', async (c) => raw(c, brandDto(await one(c.env, 'SELECT * FROM school_settings WHERE id = 1'))));
export const adminSettings = new Hono<AppEnv>();
adminSettings.put('/branding', auth('ADMIN'), async (c) => {
  const b = await body(c);
  const t = (v: unknown, max: number) => (v == null || v === '' ? null : String(v).trim().slice(0, max));
  const name = t(b.brandName, 120);
  if (!name) throw bad('Tên thương hiệu không được để trống.');
  if (b.logoUrl && !/^(https?:\/\/|\/api\/files\/)/.test(String(b.logoUrl))) throw bad('Logo phải là đường dẫn http(s) hoặc tệp đã tải lên.');
  await run(c.env, 'UPDATE school_settings SET brand_name = ?, logo_url = ?, contact_email = ?, contact_phone = ?, contact_address = ?, updated_at = ? WHERE id = 1',
    name, t(b.logoUrl, 2000), t(b.contactEmail, 200), t(b.contactPhone, 50), t(b.contactAddress, 500), nowISO());
  return raw(c, brandDto(await one(c.env, 'SELECT * FROM school_settings WHERE id = 1')));
});
