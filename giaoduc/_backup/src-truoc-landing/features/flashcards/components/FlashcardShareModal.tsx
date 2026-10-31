import React, { useState } from 'react';
import { Copy, Mail, X } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

import Portal from '../../../components/ui/Portal';
interface FlashcardShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckTitle: string;
  deckUrl: string;
}

const FlashcardShareModal: React.FC<FlashcardShareModalProps> = ({ isOpen, onClose, deckTitle, deckUrl }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(deckUrl);
    success('Đã sao chép liên kết');
  };

  const handleSendEmail = () => {
    if (!email) {
      error('Vui lòng nhập email');
      return;
    }
    setLoading(true);
    // Simulate sending email
    setTimeout(() => {
      setLoading(false);
      success('Đã gửi email chia sẻ');
      setEmail('');
    }, 1000);
  };

  return (
    <Portal><div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-night-surface rounded-2xl w-full max-w-lg shadow-xl relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-night-elevated rounded-full">
          <X size={20} />
        </button>
        
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-night-text mb-6">Chia sẻ học phần này</h2>
          
          <div className="space-y-6">
            {/* Email Share */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Chia sẻ liên kết qua email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-gray-50 dark:bg-night-elevated border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-night-text"
              />
              <button 
                onClick={handleSendEmail}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl transition-colors whitespace-nowrap disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? 'Đang gửi...' : 'Gửi email'}
              </button>
            </div>

            {/* Copy Link */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                readOnly
                value={deckUrl}
                className="flex-1 bg-gray-50 dark:bg-night-elevated border-none px-4 py-3 rounded-xl text-gray-600 dark:text-night-muted"
              />
              <button 
                onClick={handleCopyLink}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl transition-colors whitespace-nowrap flex items-center justify-center gap-2"
              >
                Chép liên kết
              </button>
            </div>

          </div>
        </div>
      </div>
    </div></Portal>
  );
};

export default FlashcardShareModal;
