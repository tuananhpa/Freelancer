import React, { useEffect, useRef, useState } from 'react';
import { compressImageSource } from '../../utils/imageUtils';

import Portal from '../ui/Portal';
interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const startCamera = async () => {
      setError('');
      setReady(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
      }
    };

    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [isOpen]);

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);

    try {
      const compressed = await compressImageSource(canvas.toDataURL('image/jpeg', 0.9));
      onCapture(compressed);
      onClose();
    } catch {
      setError('Không thể xử lý ảnh chụp.');
    }
  };

  if (!isOpen) return null;

  return (
    <Portal><div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vutru/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-cam/10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-vutru">Chụp ảnh đại diện</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-kem text-vutruNhat text-xl leading-none"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          {error ? (
            <div className="text-center py-8 text-red-500 text-sm">{error}</div>
          ) : (
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-vutru">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                  Đang mở camera...
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="btn btn-vien flex-1 text-sm">
              Hủy
            </button>
            <button
              onClick={handleCapture}
              disabled={!ready || !!error}
              className="btn btn-chinh flex-1 text-sm disabled:opacity-50"
            >
              Chụp ảnh
            </button>
          </div>
        </div>
      </div>
    </div></Portal>
  );
};

export default CameraModal;
