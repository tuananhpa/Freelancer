import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
} from "lucide-react";
import { useLanguage } from "../app/providers";
import { MediaImage, useMediaSource } from "./Media";
import { useVideoAspect } from "../hooks/useVideoAspect";
import { useVideoBackdrop } from "../hooks/useVideoBackdrop";
import { usePlayerFullscreen } from "../hooks/usePlayerFullscreen";

export function HomeVideoPlayer({
  source,
  posterSource = "/media/nhan-long.webp",
}: {
  source: string;
  posterSource?: string;
}) {
  const { t } = useLanguage();
  const src = useMediaSource(source);
  const aspect = useVideoAspect(source);
  const poster = useMediaSource(posterSource);
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
  const backdrop = useRef<HTMLCanvasElement>(null);
  useVideoBackdrop(video, backdrop, src);
  const fullscreen = usePlayerFullscreen(stage, video, src);
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
  return (
    <section
      ref={stage}
      id="hero-film"
      className={`hero-visual hero-film${fullscreen.expanded ? " is-expanded" : ""}`}
      style={aspect.frameStyle}
      aria-label={t("Video giới thiệu HYTales", "HYTales introduction video")}
      role={fullscreen.expanded ? "dialog" : "region"}
      aria-modal={fullscreen.expanded || undefined}
      tabIndex={0}
    >
      <div className="hero-film-stage">
        {source && (
          <canvas
            ref={backdrop}
            key={`backdrop-${source}`}
            className="home-video-backdrop"
            aria-hidden="true"
          />
        )}
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
        {source ? (
          <video
            className="home-video-foreground"
            ref={video}
            key={source}
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
            aria-label={t(
              "Video giới thiệu HYTales",
              "HYTales introduction video",
            )}
          />
        ) : (
          <MediaImage
            src={posterSource}
            alt={t("Vườn cây Hưng Yên", "Hung Yen orchard")}
          />
        )}
        <div className="hero-film-shade" />
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
      {source && (
        <div className="hero-film-controls">
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
