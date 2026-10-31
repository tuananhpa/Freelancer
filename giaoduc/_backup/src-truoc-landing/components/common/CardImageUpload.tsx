import React, { useRef, useState } from 'react';
import { uploadFile } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader2, Image as ImageIcon } from 'lucide-react';

interface CardImageUploadProps {
  imageUrl?: string | null;
  onChange: (imageUrl: string | null) => void;
  label?: string;
}

const CardImageUpload: React.FC<CardImageUploadProps> = ({
  imageUrl,
  onChange,
  label = 'Ảnh minh họa',
}) => {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setLoading(true);
    try {
      const res = await uploadFile(file);
      onChange(res.fileUrl);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải ảnh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-night-border">
      <p className="text-xs font-bold text-vutruNhat uppercase tracking-wider mb-2">{label}</p>
      {imageUrl ? (
        <div className="relative inline-block group">
          <img
            src={imageUrl}
            alt="Ảnh thẻ"
            className="max-h-28 rounded-lg border border-gray-200 dark:border-night-border object-contain bg-night-page/30"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs font-semibold text-cam hover:text-camDam transition-colors"
            >
              Đổi ảnh
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
            >
              Xóa ảnh
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-300 dark:border-night-border text-sm text-vutruNhat hover:border-cam/50 hover:text-cam transition-colors disabled:opacity-60"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Đang xử lý...</> : <><ImageIcon size={16} /> Thêm ảnh</>}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
};

export default CardImageUpload;
