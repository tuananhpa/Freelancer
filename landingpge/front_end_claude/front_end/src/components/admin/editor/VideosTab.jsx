import Repeater from './Repeater';
import MediaField from './MediaField';
import { newId } from './emptyProduct';

/** Khối 4: Thư viện video ngắn (dạng Reels). */
export default function VideosTab({ p, set }) {
  return (
    <Repeater items={p.shortVideos} itemLabel="Video" addLabel="Thêm video ngắn" onChange={(shortVideos) => set({ shortVideos })}
      makeItem={() => ({ id: newId('v'), title: '', videoUrl: '', posterUrl: '', duration: '' })}
      render={(v, up) => (
        <>
          <div className="form-grid">
            <label className="field"><span>Tiêu đề</span><input className="input" value={v.title} onChange={(e) => up({ title: e.target.value })} placeholder="VD: Cách pha trà cúc long nhãn" /></label>
            <label className="field"><span>Thời lượng</span><input className="input" value={v.duration || ''} onChange={(e) => up({ duration: e.target.value })} placeholder="0:45" /></label>
          </div>
          <MediaField label="File video" kind="video" accept="video/*" value={v.videoUrl} onChange={(videoUrl) => up({ videoUrl })} />
          <MediaField label="Ảnh bìa" value={v.posterUrl} onChange={(posterUrl) => up({ posterUrl })} />
        </>
      )} />
  );
}
