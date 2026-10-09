import { useState } from 'react';
import Sheet from '@/components/common/Sheet';

/** Khối 2: Câu chuyện sản phẩm + gallery ảnh. */
export default function StoryBlock({ story }) {
  const [zoom, setZoom] = useState(null);
  if (!story) return null;
  return (
    <section className="pp-section story" aria-labelledby="story-title">
      <span className="eyebrow">Câu chuyện sản phẩm</span>
      <h2 id="story-title" className="pp-section__title">{story.title}</h2>
      {story.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
      {story.facts?.length > 0 && (
        <div className="facts">
          {story.facts.map((f) => <div key={f.label} className="fact"><b>{f.value}</b><span>{f.label}</span></div>)}
        </div>
      )}
      {story.gallery?.length > 0 && (
        <div className="gallery">
          {story.gallery.map((g) => (
            <button type="button" key={g.url} onClick={() => setZoom(g)} aria-label={`Phóng to ảnh: ${g.alt}`}>
              <img src={g.url} alt={g.alt} loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <Sheet open={!!zoom} onClose={() => setZoom(null)} title={zoom?.alt || 'Ảnh'}>
        {zoom && <img src={zoom.url} alt={zoom.alt} style={{ borderRadius: 14, width: '100%' }} />}
      </Sheet>
    </section>
  );
}
