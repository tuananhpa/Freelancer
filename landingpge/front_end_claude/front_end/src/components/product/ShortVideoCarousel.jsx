import Icon from '@/components/common/Icon';

/** Khối 4: Thư viện video ngắn — thẻ lướt ngang kiểu Reels. */
export default function ShortVideoCarousel({ videos = [], onPlay }) {
  if (!videos.length) return null;
  return (
    <section className="pp-section" aria-labelledby="reel-title">
      <div className="reel-head">
        <div>
          <span className="eyebrow">Video ngắn</span>
          <h2 id="reel-title" className="pp-section__title" style={{ fontSize: 24, marginTop: 4 }}>Xem thêm từ nhà vườn</h2>
        </div>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Lướt ngang →</span>
      </div>
      <div className="reel">
        {videos.map((v) => (
          <button type="button" key={v.id} className="reel__card" onClick={() => onPlay(v)} aria-label={`Phát video: ${v.title}`}>
            <img src={v.posterUrl} alt="" loading="lazy" />
            <span className="reel__play"><Icon name="playSolid" size={14} /></span>
            <span className="reel__meta">{v.title}{v.duration && <small>{v.duration}</small>}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
