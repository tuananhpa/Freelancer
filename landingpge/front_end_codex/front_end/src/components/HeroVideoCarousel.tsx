import { useEffect, useRef, useState, type TouchEvent } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  ArrowUpRight,
  Download,
} from "lucide-react";
import type { Product } from "../types/domain";
import { useLanguage } from "../app/providers";
import { MediaImage, useMediaSource } from "./Media";
import { useVideoAspect } from "../hooks/useVideoAspect";
import { originalVideoUrl } from "../utils/media";
import { usePlayerFullscreen } from "../hooks/usePlayerFullscreen";

export function HeroVideoCarousel({
  products,
  playRequest = 0,
}: {
  products: Product[];
  playRequest?: number;
}) {
  const { lang, t } = useLanguage();
  const films = products.filter((p) => p.video);
  const [index, setIndex] = useState(0);
  const current = films[index % Math.max(films.length, 1)];
  const src = useMediaSource(current?.video);
  const aspect = useVideoAspect(current?.video);
  const poster = useMediaSource(current?.gallery[0] || current?.image);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(true);
  const [failed, setFailed] = useState(false);
  const [wantsPlay, setWantsPlay] = useState(
    () =>
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !(navigator as Navigator & { connection?: { saveData: boolean } })
        .connection?.saveData,
  );
  const stage = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const fullscreen = usePlayerFullscreen(stage, video, src);
  const gesture = useRef<{ x: number; y: number } | undefined>(undefined);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const update = () =>
      setVisible(
        document.visibilityState === "visible" &&
          !!stage.current &&
          stage.current.getBoundingClientRect().bottom > 0 &&
          stage.current.getBoundingClientRect().top < innerHeight,
      );
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  useEffect(() => {
    const el = video.current;
    if (!el || !src) return;
    if (wantsPlay && visible && !failed)
      void el.play().catch(() => setPlaying(false));
    else el.pause();
  }, [src, wantsPlay, visible, failed]);
  useEffect(() => {
    if (playRequest > 0) {
      setWantsPlay(true);
      stage.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "center",
      });
      if (video.current)
        void video.current.play().catch(() => setPlaying(false));
    }
  }, [playRequest]);
  function select(next: number) {
    if (!films.length) return;
    const target = (next + films.length) % films.length;
    if (target === index % films.length) return;
    if (video.current) video.current.pause();
    setIndex(target);
    setFailed(false);
  }
  function swipe(event: TouchEvent) {
    const start = gesture.current;
    gesture.current = undefined;
    if (!start || films.length < 2) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x,
      dy = touch.clientY - start.y;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5)
      select(index + (dx < 0 ? 1 : -1));
  }
  function toggle() {
    if (!video.current) return;
    if (playing) {
      setWantsPlay(false);
      video.current.pause();
    } else {
      setWantsPlay(true);
      void video.current.play().catch(() => setPlaying(false));
    }
  }
  const name = current
    ? lang === "vi"
      ? current.name
      : current.nameEn || current.name
    : "";
  return (
    <section
      ref={stage}
      id="hero-film"
      className={`hero-visual hero-film${fullscreen.expanded ? " is-expanded" : ""}`}
      style={aspect.frameStyle}
      aria-label={t("Phim nông sản Hưng Yên", "Hung Yen produce films")}
      role={fullscreen.expanded ? "dialog" : "region"}
      aria-modal={fullscreen.expanded || undefined}
      aria-roledescription={t("Bộ phim có thể chuyển", "Video carousel")}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget || films.length < 2) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          select(index + (event.key === "ArrowRight" ? 1 : -1));
        }
      }}
    >
      <div
        className="hero-film-stage"
        onTouchStart={(event) => {
          const touch = event.touches[0];
          gesture.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={swipe}
        onTouchCancel={() => {
          gesture.current = undefined;
        }}
      >
        {fullscreen.active && (
          <button
            className="player-exit"
            type="button"
            onClick={fullscreen.exit}
            aria-label={t("Đóng toàn màn hình", "Close fullscreen")}
          >
            <X size={22} />
          </button>
        )}
        {current ? (
          <video
            ref={video}
            src={src || undefined}
            poster={poster || undefined}
            onLoadedMetadata={aspect.onLoadedMetadata}
            muted={muted}
            loop
            playsInline
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => {
              setFailed(true);
              setPlaying(false);
            }}
            aria-label={t(`Phim ${name}`, `${name} film`)}
          />
        ) : (
          <MediaImage
            src={products[0]?.image || "/media/nhan-long.webp"}
            display={products[0]?.imageDisplay}
            alt={t("Vườn cây Hưng Yên", "Hung Yen orchard")}
          />
        )}
        <div className="hero-film-shade" />
        <div className="hero-film-title">
          <span>
            {current?.region[lang] ||
              t("Đất và người Hưng Yên", "Land and people of Hung Yen")}
          </span>
          <h2>
            {name || t("Câu chuyện từ miền vườn", "Stories from the orchard")}
          </h2>
          {current && (
            <Link to={`/p/${current.slug}`}>
              {t("Xem câu chuyện sản phẩm", "Read the product story")}
              <ArrowUpRight size={18} />
            </Link>
          )}
        </div>
        {films.length > 1 && (
          <>
            <button
              className="hero-film-arrow previous"
              type="button"
              aria-label={t("Phim trước", "Previous film")}
              onClick={() => select(index - 1)}
            >
              <ChevronLeft size={25} />
            </button>
            <button
              className="hero-film-arrow next"
              type="button"
              aria-label={t("Phim tiếp theo", "Next film")}
              onClick={() => select(index + 1)}
            >
              <ChevronRight size={25} />
            </button>
          </>
        )}
        {failed && (
          <div className="hero-film-error" role="status">
            <span>
              {t(
                "Không tải được phim. Bạn có thể thử lại.",
                "Unable to load this film. Please try again.",
              )}
            </span>
            <button
              type="button"
              onClick={() => {
                setFailed(false);
                video.current?.load();
                setWantsPlay(true);
              }}
            >
              {t("Thử lại", "Try again")}
            </button>
          </div>
        )}
      </div>
      {current && (
        <div className="hero-film-controls">
          {originalVideoUrl(current?.video) && (
            <a
              href={originalVideoUrl(current?.video)}
              download
              aria-label={t("Tải video gốc", "Download original video")}
              title={t("Tải video gốc", "Download original video")}
            >
              <Download size={19} />
            </a>
          )}
          <div className="hero-playback">
            <button
              type="button"
              onClick={toggle}
              aria-label={
                playing
                  ? t("Tạm dừng phim", "Pause film")
                  : t("Phát phim", "Play film")
              }
              className="hero-play-button"
            >
              {playing ? <Pause size={20} /> : <Play size={20} />}
              <span>
                {playing ? t("Tạm dừng", "Pause") : t("Phát phim", "Play")}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMuted(!muted)}
              aria-label={
                muted
                  ? t("Bật âm thanh", "Enable sound")
                  : t("Tắt âm thanh", "Mute sound")
              }
              aria-pressed={!muted}
            >
              {muted ? <VolumeX size={21} /> : <Volume2 size={21} />}
            </button>
          </div>
          {films.length > 1 && (
            <div
              className="hero-film-dots"
              role="group"
              aria-label={t("Chọn phim", "Choose a film")}
            >
              {films.map((p, i) => (
                <button
                  type="button"
                  key={p.id}
                  className={current.id === p.id ? "active" : ""}
                  aria-label={t(
                    `Xem phim ${p.name}`,
                    `Watch ${p.nameEn || p.name}`,
                  )}
                  aria-pressed={current.id === p.id}
                  onClick={() => select(i)}
                >
                  <span />
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className="hero-fullscreen"
            aria-label={
              fullscreen.active
                ? t("Thu nhỏ phim", "Exit fullscreen")
                : t("Xem phim toàn màn hình", "View film in fullscreen")
            }
            onClick={fullscreen.toggle}
          >
            {fullscreen.active ? (
              <Minimize size={20} />
            ) : (
              <Maximize size={20} />
            )}
          </button>
        </div>
      )}
    </section>
  );
}
