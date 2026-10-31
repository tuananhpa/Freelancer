import React, { useEffect, useRef, useState } from 'react';
import { Music, Play, Pause } from 'lucide-react';

const AUDIO_EXTENSION_RE = /\.(mp3|wav|ogg|m4a|aac|flac)(\?|#|$)/i;

const isYouTube = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');
const isGoogleDrive = (url: string) => url.includes('drive.google.com');
const isAudio = (url: string) => AUDIO_EXTENSION_RE.test(url);

const getYouTubeEmbedUrl = (url: string) =>
  url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/');

// Link chia se Google Drive (…/file/d/<ID>/view) la trang xem, khong phai file
// video truc tiep nen the <video> khong phat duoc. Drive co endpoint /preview
// rieng nhung an duoc qua iframe.
const getGoogleDriveEmbedUrl = (url: string) => {
  const match = url.match(/\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
  const id = match ? match[1] : null;
  return id ? `https://drive.google.com/file/d/${id}/preview` : url;
};

const formatTime = (seconds: number) => {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

// So thanh tinh mo phong dang song am - chi de trang tri (khong doc du lieu
// audio thuc), lay cam hung tu Google Recorder / Apple Voice Memos.
const BAR_HEIGHTS = [30, 55, 40, 70, 45, 90, 60, 35, 75, 50, 65, 40, 85, 55, 30, 60, 45, 70, 35, 50];

export const AudioPlayerCard: React.FC<{ url: string; className?: string }> = ({ url, className }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnd = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnd);
    };
  }, [url]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`${className} flex items-center justify-center bg-kem/60 dark:bg-night-elevated p-6`}>
      <div className="w-full max-w-md bg-white dark:bg-night-surface rounded-3xl shadow-lg p-6 flex flex-col items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-camNhat/50 dark:bg-cam/10 flex items-center justify-center shrink-0">
          <Music className="w-6 h-6 text-cam" />
        </div>

        <div className="w-full flex items-end justify-center gap-[3px] h-12">
          {BAR_HEIGHTS.map((h, i) => {
            const barProgress = ((i + 0.5) / BAR_HEIGHTS.length) * 100;
            const played = barProgress <= progress;
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-colors ${played ? 'bg-cam' : 'bg-gray-200 dark:bg-night-border'} ${isPlaying && played ? 'animate-pulse' : ''}`}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>

        <div className="w-full flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-cam text-white flex items-center justify-center shrink-0 hover:bg-camDam transition-colors shadow-sm"
            aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
          </button>

          <div className="flex-1 flex flex-col gap-1.5">
            <div
              className="relative h-1.5 rounded-full bg-gray-200 dark:bg-night-border cursor-pointer group"
              onClick={handleSeek}
            >
              <div className="absolute inset-y-0 left-0 rounded-full bg-cam" style={{ width: `${progress}%` }} />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cam shadow group-hover:scale-125 transition-transform"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-medium text-vutruNhat dark:text-night-muted">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        <audio ref={audioRef} src={url} preload="metadata" className="hidden" />
      </div>
    </div>
  );
};

// Ban mong, 1 hang duy nhat - dung cho luc lam bai/xem truoc de thi, nơi
// khong gian doc rat han che (audio chi la phu, PDF/cau hoi moi la chinh).
// AudioPlayerCard (card lon, co song am trang tri) hop hon cho trang bai
// giang rieng 1 minh; nhet vao day se chiem qua nhieu cho.
export const SlimAudioPlayer: React.FC<{ url: string; className?: string }> = ({ url, className }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnd = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnd);
    };
  }, [url]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play();
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`${className} flex items-center gap-3 bg-white dark:bg-night-surface border border-gray-100 dark:border-night-border rounded-2xl px-4 py-2.5 shadow-sm`}>
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-cam text-white flex items-center justify-center shrink-0 hover:bg-camDam transition-colors"
        aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" fill="currentColor" /> : <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />}
      </button>

      <span className="text-[11px] font-medium text-vutruNhat dark:text-night-muted w-8 shrink-0 tabular-nums">{formatTime(currentTime)}</span>

      <div className="relative h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-night-border cursor-pointer group" onClick={handleSeek}>
        <div className="absolute inset-y-0 left-0 rounded-full bg-cam" style={{ width: `${progress}%` }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-cam shadow group-hover:scale-125 transition-transform"
          style={{ left: `calc(${progress}% - 5px)` }}
        />
      </div>

      <span className="text-[11px] font-medium text-vutruNhat dark:text-night-muted w-8 shrink-0 tabular-nums text-right">{formatTime(duration)}</span>

      <audio ref={audioRef} src={url} preload="metadata" className="hidden" />
    </div>
  );
};

export interface ExamAudioTrackData {
  label: string;
  url: string;
}

/** Bài nghe nhiều Part, mỗi Part 1 file audio khác nhau — học sinh bấm chọn Part để chuyển file. */
export const ExamAudioTracksPlayer: React.FC<{ tracks: ExamAudioTrackData[]; className?: string }> = ({ tracks, className }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  if (!tracks || tracks.length === 0) return null;
  const active = tracks[Math.min(activeIndex, tracks.length - 1)];

  return (
    <div className={className}>
      {tracks.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tracks.map((t, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                i === activeIndex
                  ? 'bg-cam text-white'
                  : 'bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted hover:bg-gray-200 dark:hover:bg-night-border'
              }`}
            >
              {t.label || `Part ${i + 1}`}
            </button>
          ))}
        </div>
      )}
      <SlimAudioPlayer key={active.url} url={active.url} className="w-full" />
    </div>
  );
};

interface LessonMediaPlayerProps {
  url: string;
  className?: string;
}

/** Render dung dinh dang cho URL tai nguyen bai hoc: YouTube/Drive nhung
 * qua iframe, file am thanh thanh trinh phat audio kieu Voice Memos/Recorder
 * (khong nhet vao the <video> se ra man hinh den xau), con lai coi la video
 * file phat truc tiep. */
const LessonMediaPlayer: React.FC<LessonMediaPlayerProps> = ({ url, className = 'w-full h-full' }) => {
  if (isYouTube(url)) {
    return <iframe className={className} src={getYouTubeEmbedUrl(url)} allowFullScreen />;
  }
  if (isGoogleDrive(url)) {
    return <iframe className={className} src={getGoogleDriveEmbedUrl(url)} allowFullScreen allow="autoplay" />;
  }
  if (isAudio(url)) {
    return <AudioPlayerCard url={url} className={className} />;
  }
  return <video controls className={className} src={url} />;
};

export default LessonMediaPlayer;
