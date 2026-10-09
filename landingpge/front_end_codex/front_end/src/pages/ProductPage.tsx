import { MediaImage, MediaVideo } from "../components/Media";
import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Volume2,
  VolumeX,
  Pause,
  Play,
  MapPin,
  Leaf,
  ShieldCheck,
  Lock,
  CalendarDays,
  Package,
  ChevronLeft,
  ChevronRight,
  Gift,
  MessageCircle,
  Expand,
  ScanLine,
  Download,
} from "lucide-react";
import { useLanguage } from "../app/providers";
import { useResource } from "../hooks/useResource";
import { repository } from "../services";
import { Loading, ErrorState, NotFound, Modal } from "../components/common";
import { InquiryModal } from "../components/InquiryModal";
import { ReviewSection } from "../components/ReviewSection";
import { useVideoAspect } from "../hooks/useVideoAspect";
import { originalVideoUrl } from "../utils/media";
export default function ProductPage() {
  const { slug = "" } = useParams();
  const { lang, t } = useLanguage();
  const {
    data: product,
    error,
    loading,
    reload,
  } = useResource(() => repository.products.get(slug), [slug]);
  const { data: products } = useResource(() => repository.products.list());
  const { data: settings } = useResource(() => repository.settings.get());
  const aspect = useVideoAspect(product?.video);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState<number>();
  const [journeyPhoto, setJourneyPhoto] = useState<string>();
  const [film, setFilm] = useState<{
    src: string;
    name: string;
    poster: string;
  }>();
  const [inquiry, setInquiry] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const carousel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (product)
      document.title = `${lang === "vi" ? product.name : product.nameEn} | HYTales`;
    setStep(0);
    setPhoto(undefined);
    setJourneyPhoto(undefined);
    setMuted(true);
  }, [product?.id, lang]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!product) return <NotFound />;
  const p = product;
  const name = lang === "vi" ? p.name : p.nameEn;
  const enabled = (block: string) =>
    p.blocks.includes(block as (typeof p.blocks)[number]) &&
    (block !== "journey" || p.timeline.length > 0);
  const photos = [p.image, ...p.gallery].filter(Boolean);
  async function togglePlay() {
    const el = video.current;
    if (!el) return;
    if (el.paused) {
      try {
        await el.play();
      } catch {
        setPlaying(false);
      }
    } else el.pause();
  }
  return (
    <>
      <div className="container product-breadcrumb">
        <Link to="/">
          <ArrowLeft size={15} />
          {t("Những thức quà quê", "Local treasures")}
        </Link>
        <span>/</span>
        <span>{name}</span>
        <small>
          {window.isSecureContext && location.protocol === "https:" ? (
            <>
              <Lock size={12} />
              HYTales.vn · HTTPS
            </>
          ) : (
            <>
              <ScanLine size={13} />
              {t("Hộ chiếu di sản số", "Digital heritage passport")}
            </>
          )}
        </small>
      </div>
      {enabled("hero") && (
        <section className="container product-hero">
          <div
            className="product-hero-media"
            style={p.video ? aspect.frameStyle : undefined}
          >
            {p.video ? (
              <MediaVideo
                ref={video}
                display={p.imageDisplay}
                src={p.video}
                onLoadedMetadata={aspect.onLoadedMetadata}
                autoPlay={
                  !window.matchMedia("(prefers-reduced-motion: reduce)")
                    .matches &&
                  !(
                    navigator as Navigator & {
                      connection?: { saveData: boolean };
                    }
                  ).connection?.saveData
                }
                muted={muted}
                loop
                playsInline
                preload="metadata"
                poster={p.gallery[0] || p.image}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onError={() => setPlaying(false)}
                aria-label={t("Phim câu chuyện sản phẩm", "Product story film")}
              />
            ) : (
              <MediaImage
                src={p.image}
                display={p.imageDisplay}
                alt={name}
                className="product-cover-image"
              />
            )}
            {p.video && (
              <div className="product-video-overlay">
                <span>
                  <Leaf size={16} />
                  {t("Phim từ miền vườn", "Film from the orchard")}
                </span>
                <div>
                  {originalVideoUrl(p.video) && (
                    <a
                      className="glass-button"
                      href={originalVideoUrl(p.video)}
                      download
                      aria-label={t("Tải video gốc", "Download original video")}
                      title={t("Tải video gốc", "Download original video")}
                    >
                      <Download size={19} />
                    </a>
                  )}
                  <button
                    className="glass-button"
                    onClick={() => void togglePlay()}
                    aria-label={
                      playing
                        ? t("Tạm dừng video", "Pause video")
                        : t("Phát video", "Play video")
                    }
                  >
                    {playing ? <Pause size={19} /> : <Play size={19} />}
                  </button>
                  <button
                    className="glass-button"
                    onClick={() => setMuted(!muted)}
                    aria-pressed={!muted}
                    aria-label={
                      muted
                        ? t("Bật âm thanh", "Enable sound")
                        : t("Tắt âm thanh", "Mute sound")
                    }
                  >
                    {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
                  </button>
                  <button
                    className="glass-button"
                    onClick={() =>
                      setFilm({ src: p.video, name, poster: p.image })
                    }
                    aria-label={t("Mở video lớn", "Open film")}
                  >
                    <Expand size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="product-identity">
            <p className="eyebrow">
              <MapPin size={14} />
              {p.region[lang]}
            </p>
            <h1>{name}</h1>
            <p className="product-subtitle">{p.subtitle[lang]}</p>
            <div className="product-facts">
              {p.facts.map((f) => (
                <div key={f.value}>
                  <strong>{f.value}</strong>
                  <span>{f.label[lang]}</span>
                </div>
              ))}
            </div>
            <div className="batch-card">
              <div>
                <Package size={17} />
                <strong>{t("Thông tin lô hàng", "Batch information")}</strong>
              </div>
              <dl>
                <dt>{t("Mã lô", "Batch code")}</dt>
                <dd>{p.batchCode || t("Chưa cập nhật", "Awaiting update")}</dd>
                <dt>
                  {t("Ngày thu hoạch / sản xuất", "Harvest / production date")}
                </dt>
                <dd>
                  {p.harvestedAt ||
                    t("Chờ chủ thể cập nhật", "Awaiting producer")}
                </dd>
                <dt>{t("Hạn sử dụng", "Use-by date")}</dt>
                <dd>
                  {p.expiresAt ||
                    t("Chờ chủ thể cập nhật", "Awaiting producer")}
                </dd>
                <dt>{t("Vùng trồng", "Growing region")}</dt>
                <dd>{p.region[lang]}</dd>
              </dl>
              {p.certifications.length ? (
                <div className="certifications">
                  {p.certifications.map((c) => (
                    <span key={c}>
                      <ShieldCheck size={14} />
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <small>
                  <ShieldCheck size={14} />
                  {t(
                    "Chưa có hồ sơ chứng nhận cho lô mẫu này.",
                    "No certificate has been supplied for this batch.",
                  )}
                </small>
              )}
            </div>
            <a href="#chuyen-san-pham" className="underlined-link">
              {t("Đọc câu chuyện của thức quà", "Read the story")}
              <ArrowUpRight size={17} />
            </a>
          </div>
        </section>
      )}
      <div className="product-section-nav">
        <div className="container">
          {enabled("story") && (
            <a href="#chuyen-san-pham">{t("Câu chuyện", "Story")}</a>
          )}
          {enabled("journey") && (
            <a href="#hanh-trinh">{t("Hành trình", "Journey")}</a>
          )}
          {enabled("videos") && (
            <a href="#phim-ngan">{t("Phim ngắn", "Short films")}</a>
          )}
          {enabled("cta") && (
            <a href="#cam-nhan">{t("Gửi cảm nhận", "Your thoughts")}</a>
          )}
        </div>
      </div>
      {enabled("story") && (
        <section
          className="section container product-story"
          id="chuyen-san-pham"
        >
          <div className="product-story-text">
            <p className="eyebrow">
              {t(
                "Chuyện từ đất, chuyện từ người",
                "Stories of land and people",
              )}
            </p>
            <h2>{p.subtitle[lang]}</h2>
            <p>{p.story[lang]}</p>
          </div>
          <div className="story-gallery">
            {photos.map((src, i) => (
              <button
                key={src}
                onClick={() => setPhoto(i)}
                aria-label={`${t("Xem ảnh", "View photo")} ${i + 1}`}
              >
                <MediaImage
                  src={src}
                  display={
                    src === p.image ? p.imageDisplay : p.galleryDisplays?.[src]
                  }
                  loading="lazy"
                  alt={`${name} – ${i === 0 ? t("ảnh sản phẩm", "produce photo") : t("khung hình từ phim", "frame from the film")} ${i + 1}`}
                />
                <Expand size={17} />
              </button>
            ))}
            <small>
              {t(
                "Ảnh và khung hình từ kho media của dự án.",
                "Photos and film frames from the project’s media collection.",
              )}
            </small>
          </div>
        </section>
      )}
      {enabled("journey") && (
        <section className="journey-section" id="hanh-trinh">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  {t("Theo dấu một thức quà", "Follow a local treasure")}
                </p>
                <h2>
                  {t("Từ vườn quê đến tay bạn", "From the orchard to you")}
                </h2>
              </div>
            </div>
            <div
              className="timeline"
              role="tablist"
              aria-label={t("Các bước hành trình", "Journey steps")}
            >
              {p.timeline.map((s, i) => (
                <button
                  key={i}
                  className={
                    step === i ? "timeline-step active" : "timeline-step"
                  }
                  onClick={() => setStep(i)}
                  role="tab"
                  aria-selected={step === i}
                  aria-controls="timeline-detail"
                  id={`step-${i}`}
                >
                  <span>{i + 1}</span>
                  <strong>{s.title[lang] || s.title.vi}</strong>
                  <small>{t("Xem hành trình", "Explore step")}</small>
                </button>
              ))}
            </div>
            {p.timeline[step] && (
              <div
                className="timeline-detail"
                id="timeline-detail"
                role="tabpanel"
                aria-labelledby={`step-${step}`}
              >
                <span>
                  <Leaf size={23} />
                </span>
                <div>
                  <h3>
                    {p.timeline[step].title[lang] || p.timeline[step].title.vi}
                  </h3>
                  <p>
                    {p.timeline[step].detail[lang] ||
                      p.timeline[step].detail.vi}
                  </p>
                  {!!p.timeline[step].images?.some((image) => image.src) && (
                    <>
                      {(p.timeline[step].images?.filter((image) => image.src)
                        .length || 0) > 1 && (
                        <p className="timeline-images-hint">
                          {t(
                            `${p.timeline[step].images?.filter((image) => image.src).length} ảnh · Vuốt để xem, bấm để phóng to`,
                            `${p.timeline[step].images?.filter((image) => image.src).length} photos · Swipe to explore, tap to enlarge`,
                          )}
                        </p>
                      )}
                      <div className="timeline-images">
                        {p.timeline[step].images
                          ?.filter((image) => image.src)
                          .map((image, i) => (
                            <button
                              type="button"
                              key={`${image.src}-${i}`}
                              aria-label={t(
                                `Xem ảnh ${i + 1} của ${p.timeline[step].title[lang] || p.timeline[step].title.vi}`,
                                `View step photo ${i + 1}`,
                              )}
                              onClick={() => setJourneyPhoto(image.src)}
                            >
                              <MediaImage
                                src={image.src}
                                display={image.display}
                                loading="lazy"
                                alt={`${p.timeline[step].title[lang] || p.timeline[step].title.vi} · ${i + 1}`}
                              />
                            </button>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
      {journeyPhoto && (
        <Modal
          title={t("Ảnh hành trình", "Journey photo")}
          wide
          onClose={() => setJourneyPhoto(undefined)}
        >
          <MediaImage
            src={journeyPhoto}
            alt={t("Ảnh hành trình sản phẩm", "Product journey photo")}
            className="journey-lightbox-image"
          />
        </Modal>
      )}
      {enabled("videos") && (
        <section className="section container short-films" id="phim-ngan">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {t("Một phút về miền vườn", "A moment in the orchard")}
              </p>
              <h2>
                {t("Nghe thêm những chuyện quê", "More stories from home")}
              </h2>
            </div>
            <div className="carousel-controls">
              <button
                className="icon-button"
                aria-label={t("Phim trước", "Previous films")}
                onClick={() =>
                  carousel.current?.scrollBy({ left: -320, behavior: "smooth" })
                }
              >
                <ChevronLeft />
              </button>
              <button
                className="icon-button"
                aria-label={t("Phim sau", "Next films")}
                onClick={() =>
                  carousel.current?.scrollBy({ left: 320, behavior: "smooth" })
                }
              >
                <ChevronRight />
              </button>
            </div>
          </div>
          <div className="film-carousel" ref={carousel}>
            {(products ?? [p])
              .filter((item) => !!item.video)
              .map((item) => (
                <button
                  className="film-card"
                  key={item.id}
                  onClick={() =>
                    setFilm({
                      src: item.video,
                      name: lang === "vi" ? item.name : item.nameEn,
                      poster: item.image,
                    })
                  }
                >
                  <MediaImage
                    src={item.gallery[0] || item.image}
                    display={
                      item.gallery[0]
                        ? item.galleryDisplays?.[item.gallery[0]]
                        : item.imageDisplay
                    }
                    alt=""
                    loading="lazy"
                  />
                  <span className="film-card-shade" />
                  <span className="film-duration">
                    {t("Phim câu chuyện", "Story film")}
                  </span>
                  <span className="film-play">
                    <Play size={23} fill="currentColor" />
                  </span>
                  <span className="film-caption">
                    <small>{item.region[lang]}</small>
                    <strong>{lang === "vi" ? item.name : item.nameEn}</strong>
                    <span>{item.subtitle[lang]}</span>
                  </span>
                </button>
              ))}
          </div>
          <p className="quiet-note">
            {t(
              "Phim đầy đủ từ dự án. Bật âm thanh để nghe giọng kể.",
              "Full films from the project. Enable sound to hear the narration.",
            )}
          </p>
        </section>
      )}
      {enabled("cta") && (
        <section id="cam-nhan" className="container">
          <div className="gift-banner">
            <span className="gift-symbol">
              <Gift size={34} />
            </span>
            <div>
              <h2>
                {t(
                  "Mang một chút quê nhà, tặng người thương.",
                  "A little piece of home, for someone you love.",
                )}
              </h2>
              <p>
                {t(
                  "Một thức quà có nguồn gốc. Một câu chuyện có người gìn giữ.",
                  "A gift with roots. A story with people behind it.",
                )}
              </p>
            </div>
            <div>
              <button className="button" onClick={() => setInquiry(true)}>
                {t(
                  "Tặng bạn bè / Đặt mua thêm",
                  "Request a gift / Order again",
                )}
                <ArrowUpRight size={17} />
              </button>
              {settings?.zaloUrl &&
              /^https:\/\/zalo\.me\/[a-zA-Z0-9_-]+$/.test(settings.zaloUrl) ? (
                <a
                  className="text-button"
                  href={settings.zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={17} />
                  {t("Nhắn Zalo nhà vườn", "Message the grower on Zalo")}
                </a>
              ) : (
                <button
                  className="text-button"
                  onClick={() => setInquiry(true)}
                >
                  <MessageCircle size={17} />
                  {t("Liên hệ nhà vườn", "Contact the grower")}
                </button>
              )}
            </div>
          </div>
          <ReviewSection productId={p.id} />
        </section>
      )}
      {photo !== undefined && (
        <Modal
          title={`${name} · ${photo + 1}/${photos.length}`}
          wide
          onClose={() => setPhoto(undefined)}
        >
          <MediaImage
            className="lightbox-photo"
            display={{ fit: "contain", x: 50, y: 50 }}
            src={photos[photo]}
            alt={`${name} ${photo + 1}`}
          />
          <div className="lightbox-controls">
            <button
              className="button button-outline"
              onClick={() =>
                setPhoto((photo - 1 + photos.length) % photos.length)
              }
            >
              <ChevronLeft size={18} />
              {t("Ảnh trước", "Previous")}
            </button>
            <button
              className="button button-outline"
              onClick={() => setPhoto((photo + 1) % photos.length)}
            >
              {t("Ảnh tiếp", "Next")}
              <ChevronRight size={18} />
            </button>
          </div>
        </Modal>
      )}
      {film && (
        <Modal title={film.name} wide onClose={() => setFilm(undefined)}>
          <MediaVideo
            className="modal-video"
            controls
            autoPlay
            playsInline
            src={film.src}
            poster={film.poster}
          />
          <p className="quiet-note">
            {t(
              "Phim đầy đủ. Mở toàn màn hình để thưởng thức.",
              "Full film. Open fullscreen to enjoy the story.",
            )}
          </p>
          {originalVideoUrl(film.src) && (
            <a
              className="text-button"
              href={originalVideoUrl(film.src)}
              download
            >
              <Download size={18} />
              {t("Tải video gốc", "Download original video")}
            </a>
          )}
        </Modal>
      )}
      {inquiry && (
        <InquiryModal productId={p.id} onClose={() => setInquiry(false)} />
      )}
    </>
  );
}
