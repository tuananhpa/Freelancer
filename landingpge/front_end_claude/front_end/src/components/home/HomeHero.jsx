import Icon from '@/components/common/Icon';

export default function HomeHero({ featured }) {
  return (
    <section className="hero" id="top">
      <div className="container hero__inner">
        <div className="hero__copy">
          <span className="hero__pill">Hộ chiếu di sản số · Hưng Yên</span>
          <h1 className="hero__title">Chạm mã QR –<br /><em>Mở câu chuyện quê</em></h1>
          <p className="hero__lead">
            Mỗi bao bì nông sản Hưng Yên trở thành một thước phim Cinematic 9:16, một nhật ký canh tác minh bạch
            và lời kể mộc mạc của chính người làm vườn — chỉ sau một lần quét.
          </p>
          <div className="hero__actions">
            <a href="#san-vat" className="btn btn--primary btn--lg">Khám phá Thức quà tiến Vua</a>
            <a href="#cach-hoat-dong" className="btn btn--ghost-dark btn--lg"><Icon name="play" size={18} /> Cách hoạt động</a>
          </div>
          <div className="hero__stats">
            <div className="hero__stat"><b>5.860 ha</b><span>vùng trồng nhãn Hưng Yên</span></div>
            <div className="hero__stat"><b>300+ năm</b><span>cây nhãn Tổ chùa Hiến</span></div>
            <div className="hero__stat"><b>OCOP 4★</b><span>vải trứng Hưng Yên</span></div>
          </div>
        </div>
        <div className="hero__visual">
          <div className="phone">
            <div className="phone__screen">
              {featured?.heroLoopUrl
                ? <video src={featured.heroLoopUrl} poster={featured.posterUrl} autoPlay muted loop playsInline preload="metadata" aria-label={`Phim ngắn ${featured.name}`} />
                : <img src="/media/posters/vai-trung.jpg" alt="" />}
              <div className="phone__url"><Icon name="lock" size={12} strokeWidth={2.4} className="secure-icon" />hytales.vn/p/{featured?.slug || 'vai-trung-phu-cu-l01'}</div>
              <div className="phone__card">
                <small>{featured?.batchCode || '#HY-VT-2026-06'}</small>
                <strong>{featured?.name || 'Vải trứng Hưng Yên'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
