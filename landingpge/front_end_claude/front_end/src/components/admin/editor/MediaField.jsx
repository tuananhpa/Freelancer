import { useRef, useState } from 'react';
import { uploadService } from '@/services/api';

/** Ô chọn ảnh/video: dán URL hoặc tải file lên (POST /admin/uploads). */
export default function MediaField({ label, value, onChange, accept = 'image/*', kind = 'image' }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try { onChange((await uploadService.upload(file)).url); } finally { setBusy(false); e.target.value = ''; }
  };
  return (
    <div className="field">
      <span>{label}</span>
      <div className="media-pick">
        {value ? (kind === 'video' ? <video src={value} muted playsInline /> : <img src={value} alt="" />) : <span style={{ width: 54, height: 54, borderRadius: 8, background: 'var(--paper-2)', flex: 'none' }} />}
        <div className="media-pick__info">
          <input className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="Dán URL hoặc tải lên" aria-label={label} />
        </div>
        <input ref={ref} type="file" accept={accept} hidden onChange={pick} />
        <button type="button" className="btn btn--outline btn--sm" onClick={() => ref.current?.click()} disabled={busy}>{busy ? 'Đang tải…' : 'Tải lên'}</button>
      </div>
    </div>
  );
}
