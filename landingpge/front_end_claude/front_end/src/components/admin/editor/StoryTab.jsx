import Repeater from './Repeater';
import MediaField from './MediaField';
import { newId } from './emptyProduct';

/** Khối 2: Câu chuyện (100–150 từ) + gallery 3–4 ảnh. */
export default function StoryTab({ p, set }) {
  const story = (patch) => set({ story: { ...p.story, ...patch } });
  const text = p.story.paragraphs.join('\n\n');
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <label className="field"><span>Tiêu đề câu chuyện</span><input className="input" value={p.story.title} onChange={(e) => story({ title: e.target.value })} /></label>
      <label className="field">
        <span>Nội dung (cách đoạn bằng 1 dòng trống) · {words} từ {words && (words < 100 || words > 150) ? '— khuyến nghị 100–150 từ' : ''}</span>
        <textarea className="textarea" rows={9} value={text} onChange={(e) => story({ paragraphs: e.target.value.split(/\n\s*\n/) })} />
      </label>
      <div className="field"><span>Số liệu nổi bật</span>
        <Repeater items={p.story.facts} itemLabel="Số liệu" addLabel="Thêm số liệu" onChange={(facts) => story({ facts })} makeItem={() => ({ id: newId('f'), value: '', label: '' })}
          render={(f, up) => (
            <div className="form-grid">
              <input className="input" value={f.value} onChange={(e) => up({ value: e.target.value })} placeholder="5.860 ha" aria-label="Giá trị" />
              <input className="input" value={f.label} onChange={(e) => up({ label: e.target.value })} placeholder="vùng trồng nhãn" aria-label="Mô tả" />
            </div>
          )} />
      </div>
      <div className="field"><span>Bộ sưu tập ảnh (3–4 ảnh)</span>
        <Repeater items={p.story.gallery} itemLabel="Ảnh" addLabel="Thêm ảnh" onChange={(gallery) => story({ gallery })} makeItem={() => ({ id: newId('g'), url: '', alt: '' })}
          render={(g, up) => (
            <>
              <MediaField label="Ảnh" value={g.url} onChange={(url) => up({ url })} />
              <input className="input" value={g.alt} onChange={(e) => up({ alt: e.target.value })} placeholder="Mô tả ảnh (VD: Lò sấy than củi)" aria-label="Mô tả ảnh" />
            </>
          )} />
      </div>
    </div>
  );
}
