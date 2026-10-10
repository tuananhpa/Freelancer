import { CERTIFICATIONS } from '@/config/constants';
import MediaField from './MediaField';

/** Khối 1: Header, Video Hero & Thẻ định danh. */
export default function BasicTab({ p, set }) {
  const field = (k) => ({ value: p[k] ?? '', onChange: (e) => set({ [k]: e.target.value }) });
  const hero = (patch) => set({ hero: { ...p.hero, ...patch } });
  const toggleCert = (code) => set({ certifications: p.certifications.includes(code) ? p.certifications.filter((c) => c !== code) : [...p.certifications, code] });
  return (
    <div className="form-grid">
      <label className="field span-all"><span>Tên sản phẩm *</span><input className="input" required {...field('name')} placeholder="VD: Long Nhãn Sấy Hương Chi – Phố Hiến" /></label>
      <label className="field"><span>Câu dẫn (tagline)</span><input className="input" {...field('tagline')} /></label>
      <label className="field"><span>Nhóm / danh hiệu</span><input className="input" {...field('category')} placeholder="VD: Sản vật tiến vua" /></label>
      <label className="field"><span>Mã lô hàng</span><input className="input" {...field('batchCode')} placeholder="#HY-LN-2026-08" /></label>
      <label className="field"><span>Đường dẫn (slug)</span><input className="input" {...field('slug')} placeholder="tự tạo từ tên nếu để trống" /></label>
      <label className="field"><span>Ngày sản xuất</span><input className="input" type="date" {...field('harvestDate')} /></label>
      <label className="field"><span>Hạn sử dụng</span><input className="input" type="date" {...field('expiryDate')} /></label>
      <label className="field"><span>Vùng trồng</span><input className="input" {...field('origin')} /></label>
      <label className="field"><span>HTX / Nhà vườn</span><input className="input" {...field('cooperative')} /></label>
      <div className="field span-all">
        <span>Huy hiệu chứng nhận</span>
        <div className="check-chips">
          {Object.entries(CERTIFICATIONS).map(([code, c]) => (
            <label key={code}><input type="checkbox" checked={p.certifications.includes(code)} onChange={() => toggleCert(code)} />{c.label}</label>
          ))}
        </div>
      </div>
      <div className="span-all"><MediaField label="Ảnh bìa (thẻ sản phẩm)" value={p.coverUrl} onChange={(v) => set({ coverUrl: v })} /></div>
      <div className="span-all"><MediaField label="Video Hero 9:16 (đoạn lặp ngắn, tự phát tắt tiếng)" kind="video" accept="video/*" value={p.hero.loopUrl} onChange={(v) => hero({ loopUrl: v })} /></div>
      <div className="span-all"><MediaField label="Phim đầy đủ có thuyết minh" kind="video" accept="video/*" value={p.hero.videoUrl} onChange={(v) => hero({ videoUrl: v })} /></div>
      <div className="span-all"><MediaField label="Ảnh poster video" value={p.hero.posterUrl} onChange={(v) => hero({ posterUrl: v })} /></div>
      <label className="field"><span>Thời lượng phim</span><input className="input" value={p.hero.duration || ''} onChange={(e) => hero({ duration: e.target.value })} placeholder="2:05" /></label>
      <label className="field"><span>Trạng thái</span>
        <select className="select" value={p.status} onChange={(e) => set({ status: e.target.value })}>
          <option value="draft">Bản nháp</option><option value="published">Công bố</option>
        </select>
      </label>
    </div>
  );
}
