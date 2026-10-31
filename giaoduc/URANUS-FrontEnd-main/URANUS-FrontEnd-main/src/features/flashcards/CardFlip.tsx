import React, { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { getSpeakableText } from '../../utils/speech';

interface CardFlipProps {
  frontContent: string;
  backContent: string;
  imageUrl?: string | null;
  onKnow?: () => void;
  onReview?: () => void;
  flipRef?: React.MutableRefObject<(() => void) | undefined>;
  className?: string;
}

const CardFlip: React.FC<CardFlipProps> = ({ frontContent, backContent, imageUrl, onKnow, onReview, flipRef, className }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => setIsFlipped((prev) => !prev);

  useEffect(() => {
    if (flipRef) {
      flipRef.current = handleFlip;
    }
  }, [flipRef]);

  const speak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(getSpeakableText(text));
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.includes('en-US') || v.lang.includes('en-GB'));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      className={`perspective-1200 cursor-pointer mx-auto group ${className || 'w-full max-w-lg min-h-72'}`}
      onClick={handleFlip}
    >
      <div className={`relative w-full h-full min-h-[inherit] transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        <div className="absolute inset-0 backface-hidden rounded-2xl bg-cam shadow-cam flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
          <span className="text-white/90 text-base sm:text-lg font-bold tracking-widest uppercase mb-3 font-body">Thuật ngữ</span>
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              className="max-h-24 max-w-full rounded-lg mb-3 object-contain border border-white/20"
            />
          )}
          <h3 className="text-white font-body font-bold text-3xl sm:text-4xl leading-snug flex items-center gap-2">
            {frontContent}
            <button
              onClick={(e) => speak(e, frontContent)}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
              title="Phát âm"
            >
              <Volume2 size={22} />
            </button>
          </h3>
          <p className="text-white/60 text-sm mt-4">Chạm để xem định nghĩa</p>
        </div>

        <div className="absolute inset-0 backface-hidden rounded-2xl bg-white dark:bg-night-surface shadow-xl rotate-y-180 flex flex-col items-center justify-center p-6 text-center border border-cam/10 dark:border-night-border overflow-y-auto">
          <span className="text-camDam text-base sm:text-lg font-bold tracking-widest uppercase mb-3 font-body">Định nghĩa</span>
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              className="max-h-28 max-w-full rounded-lg mb-3 object-contain border border-gray-200 dark:border-night-border"
            />
          )}
          <h3 className="text-vutru font-body font-bold text-2xl sm:text-3xl leading-snug">{backContent}</h3>

          {(onKnow || onReview) && (
            <div className="flex gap-3 mt-6" onClick={(e) => e.stopPropagation()}>
              {onReview && (
                <button
                  type="button"
                  onClick={onReview}
                  className="btn btn-vien text-sm px-5 py-2 border-gray-300 dark:border-night-border text-vutruNhat dark:text-night-muted hover:bg-gray-50 dark:hover:bg-night-elevated"
                >
                  Cần ôn lại
                </button>
              )}
              {onKnow && (
                <button
                  type="button"
                  onClick={onKnow}
                  className="btn btn-chinh text-sm px-5 py-2 shadow-none"
                >
                  Đã thuộc
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(CardFlip);
