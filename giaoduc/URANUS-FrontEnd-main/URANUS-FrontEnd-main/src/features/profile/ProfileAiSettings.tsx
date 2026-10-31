import { useEffect, useState } from 'react';
import { Sparkles, KeyRound, CheckCircle2, ShieldCheck, Wand2, Loader2 } from 'lucide-react';
import api, { getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';

type Provider = 'GEMINI' | 'OPENAI';
interface AiSettings {
  provider: Provider;
  model: string;
  hasKey: boolean;
  keyLast4?: string | null;
  strictness: 'LENIENT' | 'STANDARD' | 'STRICT';
  autoGradeOnSubmit: boolean;
  requireTeacherReview: boolean;
}

const MODELS: Record<Provider, { id: string; label: string }[]> = {
  GEMINI: [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash · nhanh, rẻ' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro · chấm kỹ bài dài' },
  ],
  OPENAI: [
    { id: 'gpt-4o-mini', label: 'GPT-4o mini · nhanh, rẻ' },
    { id: 'gpt-4.1', label: 'GPT-4.1 · chấm kỹ bài dài' },
  ],
};

const PROVIDERS: { id: Provider; name: string; hint: string; keyHint: string }[] = [
  { id: 'GEMINI', name: 'Google Gemini', hint: 'Lấy khóa tại Google AI Studio', keyHint: 'AIza…' },
  { id: 'OPENAI', name: 'ChatGPT (OpenAI)', hint: 'Lấy khóa tại platform.openai.com', keyHint: 'sk-…' },
];

const STRICTNESS = [
  { id: 'LENIENT', label: 'Nhẹ tay', desc: 'Ghi nhận ý đúng dù diễn đạt chưa trọn' },
  { id: 'STANDARD', label: 'Chuẩn', desc: 'Bám sát đáp án và thang điểm' },
  { id: 'STRICT', label: 'Khắt khe', desc: 'Trừ điểm diễn đạt, chính tả, thiếu dẫn chứng' },
] as const;

const ProfileAiSettings = () => {
  const toast = useToast();
  const [s, setS] = useState<AiSettings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [sample, setSample] = useState({
    question: 'Nêu ý nghĩa của lòng biết ơn trong cuộc sống (2 điểm).',
    expected: 'biết ơn, trân trọng, gắn kết, vô ơn, bản thân',
    answer: 'Lòng biết ơn giúp con người trân trọng nhau và gắn kết hơn. Em sẽ luôn cảm ơn những người đã giúp mình.',
    points: 2,
  });
  const [preview, setPreview] = useState<{ score: number; feedback: string } | null>(null);
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    api.get('/users/me/ai-settings').then((r) => setS(r.data)).catch(() =>
      setS({ provider: 'GEMINI', model: 'gemini-2.5-flash', hasKey: false, strictness: 'STANDARD', autoGradeOnSubmit: true, requireTeacherReview: true }),
    );
  }, []);

  if (!s) return <div className="card text-sm text-vutruNhat">Đang tải cài đặt AI…</div>;
  const set = (patch: Partial<AiSettings>) => setS({ ...s, ...patch });

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.put('/users/me/ai-settings', { ...s, apiKey: apiKey.trim() || undefined });
      setS(r.data);
      setApiKey('');
      toast.success('Đã lưu cài đặt AI chấm bài');
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Không lưu được cài đặt'));
    } finally {
      setSaving(false);
    }
  };

  const testKey = async () => {
    setTesting(true);
    setTestMsg(null);
    try {
      const r = await api.post('/users/me/ai-settings/test', { provider: s.provider, model: s.model, apiKey: apiKey.trim() || undefined });
      setTestMsg({ ok: true, text: r.data?.message || 'Kết nối thành công' });
    } catch (e) {
      setTestMsg({ ok: false, text: getApiErrorMessage(e, 'Không kết nối được') });
    } finally {
      setTesting(false);
    }
  };

  const tryGrade = async () => {
    setGrading(true);
    try {
      const r = await api.post('/ai/grade-preview', sample);
      setPreview(r.data);
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Không chấm thử được'));
    } finally {
      setGrading(false);
    }
  };

  const provider = PROVIDERS.find((p) => p.id === s.provider)!;

  return (
    <div className="space-y-6">
      <div className="card relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-400/20 blur-2xl" aria-hidden />
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-500 text-white"><Sparkles size={22} /></span>
          <div>
            <h2 className="text-xl font-bold text-vutru">AI chấm bài tự luận</h2>
            <p className="mt-1 text-sm text-vutruNhat leading-relaxed max-w-prose">
              AI đọc bài làm, so với <b>đáp án mẫu và thang điểm</b> thầy cô soạn trong đề, rồi gợi ý điểm từng ý kèm nhận xét.
              Điểm chỉ được công bố khi thầy cô duyệt.
            </p>
          </div>
        </div>
      </div>

      <div className="card space-y-5">
        <h3 className="font-bold text-vutru">1. Chọn nhà cung cấp</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={s.provider === p.id}
              onClick={() => set({ provider: p.id, model: MODELS[p.id][0].id })}
              className={`rounded-2xl border-2 p-4 text-left transition-all ${s.provider === p.id ? 'border-cam bg-camNhat/60 shadow-cam' : 'border-gray-100 dark:border-night-border hover:border-cam/40'}`}
            >
              <p className="font-bold text-vutru">{p.name}</p>
              <p className="text-xs text-vutruNhat mt-1">{p.hint}</p>
            </button>
          ))}
        </div>
        <label className="block">
          <span className="text-sm font-semibold text-vutru">Model</span>
          <select value={s.model} onChange={(e) => set({ model: e.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm">
            {MODELS[s.provider].map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
      </div>

      <div className="card space-y-4">
        <h3 className="font-bold text-vutru flex items-center gap-2"><KeyRound size={18} className="text-cam" />2. API key</h3>
        {s.hasKey && (
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 size={14} /> Đã lưu khóa ••••{s.keyLast4}
          </p>
        )}
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={s.hasKey ? 'Nhập khóa mới để thay khóa cũ' : `Dán khóa ${provider.keyHint}`}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-mono text-sm"
        />
        <p className="flex items-start gap-2 text-xs text-vutruNhat">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-600" />
          Khóa được mã hóa và chỉ lưu trên máy chủ, không gửi xuống trình duyệt của học sinh. Có thể thu hồi bất cứ lúc nào tại trang của nhà cung cấp.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={testKey} disabled={testing} className="btn btn-vien !py-2 !text-sm">
            {testing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />} Kiểm tra kết nối
          </button>
          {testMsg && <span className={`text-sm font-semibold ${testMsg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{testMsg.text}</span>}
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-bold text-vutru">3. Cách chấm</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {STRICTNESS.map((o) => (
            <button key={o.id} type="button" aria-pressed={s.strictness === o.id} onClick={() => set({ strictness: o.id })}
              className={`rounded-2xl border-2 p-3 text-left transition-all ${s.strictness === o.id ? 'border-cam bg-camNhat/60' : 'border-gray-100 dark:border-night-border hover:border-cam/40'}`}>
              <p className="font-bold text-vutru text-sm">{o.label}</p>
              <p className="text-xs text-vutruNhat mt-1">{o.desc}</p>
            </button>
          ))}
        </div>
        {([
          ['autoGradeOnSubmit', 'Chấm nháp ngay khi học sinh nộp bài'],
          ['requireTeacherReview', 'Chỉ công bố điểm tự luận sau khi tôi duyệt'],
        ] as const).map(([k, label]) => (
          <label key={k} className="flex items-center justify-between gap-4 rounded-xl bg-kem/70 dark:bg-night-elevated px-4 py-3">
            <span className="text-sm font-medium text-vutru">{label}</span>
            <input type="checkbox" checked={s[k]} onChange={(e) => set({ [k]: e.target.checked } as Partial<AiSettings>)} className="h-5 w-5" />
          </label>
        ))}
        <div className="flex justify-end">
          <button type="button" onClick={save} disabled={saving} className="btn btn-chinh">{saving ? 'Đang lưu…' : 'Lưu cài đặt'}</button>
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-bold text-vutru">Chấm thử một câu</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm"><span className="font-semibold text-vutru">Câu hỏi</span>
            <input value={sample.question} onChange={(e) => setSample({ ...sample, question: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2" /></label>
          <label className="block text-sm"><span className="font-semibold text-vutru">Ý chính trong đáp án (cách nhau bởi dấu phẩy)</span>
            <input value={sample.expected} onChange={(e) => setSample({ ...sample, expected: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2" /></label>
        </div>
        <label className="block text-sm"><span className="font-semibold text-vutru">Bài làm của học sinh</span>
          <textarea rows={4} value={sample.answer} onChange={(e) => setSample({ ...sample, answer: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2" /></label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={tryGrade} disabled={grading} className="btn btn-chinh !py-2 !text-sm">
            {grading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Chấm thử
          </button>
          {preview && (
            <div className="flex-1 min-w-[16rem] rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm dark:border-violet-500/30 dark:bg-violet-500/10">
              <p className="font-heading text-2xl font-extrabold text-violet-700 dark:text-violet-300">{preview.score}/{sample.points}</p>
              <p className="mt-1 text-vutru">{preview.feedback}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileAiSettings;
