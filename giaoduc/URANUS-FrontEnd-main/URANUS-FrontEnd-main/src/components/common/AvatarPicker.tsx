import { Folder, Camera } from 'lucide-react';
import React, { useRef, useState } from 'react';
import UserAvatar from './UserAvatar';
import CameraModal from './CameraModal';
import { compressImageFile } from '../../utils/imageUtils';
import { uploadFile } from '../../services/api';
import { isValidAvatarUrl } from '../../utils/avatar';
import { useToast } from '../../context/ToastContext';

interface AvatarPickerProps {
  fullName: string;
  avatarUrl?: string | null;
  onAvatarChange: (url: string) => void;
  size?: 'md' | 'lg' | 'xl';
}

const sizeWrapper = {
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const AvatarPicker: React.FC<AvatarPickerProps> = ({
  fullName,
  avatarUrl,
  onAvatarChange,
  size = 'lg',
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const uploadAndSetAvatar = async (dataUrl: string) => {
    try {
      setProcessing(true);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileToUpload = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const uploadRes = await uploadFile(fileToUpload);
      onAvatarChange(uploadRes.fileUrl);
    } catch (err: any) {
      toast.error('Lỗi tải ảnh lên server.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    try {
      const dataUrl = await compressImageFile(file);
      await uploadAndSetAvatar(dataUrl);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải ảnh lên.');
      setProcessing(false);
    } finally {
      e.target.value = '';
    }
  };

  const handleRemove = () => {
    onAvatarChange('');
  };

  return (
    <>
      <div className={`relative group ${sizeWrapper[size]} shrink-0`}>
        <UserAvatar fullName={fullName} avatarUrl={avatarUrl} size={size} />

        <div className="absolute inset-0 rounded-full bg-vutru/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 cursor-pointer overflow-hidden ring-2 ring-cam/40 ring-offset-1">
          {processing ? (
            <span className="text-white text-xs font-semibold">Đang xử lý...</span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-white text-xs font-semibold hover:text-camNhat transition-colors leading-tight"
              >
                <Folder size={16} className="inline mr-1.5" /> Tải ảnh
              </button>
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="text-white text-xs font-semibold hover:text-camNhat transition-colors leading-tight"
              >
                <Camera size={14} className="inline mr-1" /> Chụp ảnh
              </button>
              {isValidAvatarUrl(avatarUrl) && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-white/70 text-[10px] hover:text-red-300 transition-colors leading-tight"
                >
                  Xóa ảnh
                </button>
              )}
            </>
          )}
        </div>

        <input
          id="avatar-upload-input"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <CameraModal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={uploadAndSetAvatar}
      />
    </>
  );
};

export default AvatarPicker;
