import React, { useState } from 'react';
import { shareApi } from '../../services/featureApi';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';

import Portal from '../ui/Portal';
interface ShareModalProps {
  resourceType: 'DECK' | 'EXAM';
  resourceId: string;
  resourceTitle: string;
  onClose: () => void;
  onCloned?: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ resourceType, resourceId, resourceTitle, onClose, onCloned }) => {
  const { success, error } = useToast();
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const createLink = async () => {
    setLoading(true);
    try {
      const res = await shareApi.createShare(resourceType, resourceId);
      const url = `${window.location.origin}${res.data.shareUrl}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      success('Đã sao chép link chia sẻ!');
    } catch {
      error('Không tạo được link chia sẻ');
    } finally {
      setLoading(false);
    }
  };

  const cloneDeck = async () => {
    if (resourceType !== 'DECK') return;
    setLoading(true);
    try {
      await shareApi.cloneDeck(resourceId);
      success('Đã sao chép bộ thẻ vào thư viện của bạn!');
      onCloned?.();
      onClose();
    } catch {
      error('Không sao chép được');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal><div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-night-surface rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-1">Chia sẻ & Sao chép</h2>
        <p className="text-sm text-vutruNhat mb-4 truncate">{resourceTitle}</p>

        <div className="space-y-3">
          <Button variant="primary" className="w-full" isLoading={loading} onClick={createLink}>
            Tạo link chia sẻ (30 ngày)
          </Button>
          {resourceType === 'DECK' && (
            <Button variant="outline" className="w-full" isLoading={loading} onClick={cloneDeck}>
              Sao chép vào thư viện của tôi
            </Button>
          )}
          {shareUrl && (
            <p className="text-xs text-vutruNhat break-all bg-kem dark:bg-night-elevated p-2 rounded-lg">{shareUrl}</p>
          )}
        </div>
        <button type="button" onClick={onClose} className="mt-4 text-sm text-vutruNhat hover:text-cam w-full text-center">Đóng</button>
      </div>
    </div></Portal>
  );
};

export default ShareModal;
