import Repeater from './Repeater';
import { newId } from './emptyProduct';

/** Khối 3: Hành trình sản phẩm theo từng lô. */
export default function TimelineTab({ p, set }) {
  return (
    <Repeater items={p.timeline} itemLabel="Mốc" addLabel="Thêm mốc" onChange={(timeline) => set({ timeline })}
      makeItem={() => ({ id: newId('t'), when: '', title: '', description: '' })}
      render={(t, up) => (
        <div className="form-grid">
          <label className="field"><span>Thời gian</span><input className="input" value={t.when} onChange={(e) => up({ when: e.target.value })} placeholder="VD: 12/08/2026" /></label>
          <label className="field"><span>Tiêu đề mốc</span><input className="input" value={t.title} onChange={(e) => up({ title: e.target.value })} /></label>
          <label className="field span-all"><span>Mô tả</span><textarea className="textarea" rows={2} value={t.description} onChange={(e) => up({ description: e.target.value })} /></label>
        </div>
      )} />
  );
}
