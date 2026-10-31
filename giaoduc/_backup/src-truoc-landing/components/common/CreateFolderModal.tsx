import { getApiErrorMessage } from '../../services/api';
import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { folderApi } from '../../services/folderApi';
import { useToast } from '../../context/ToastContext';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (folderId: string) => void;
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ isOpen, onClose, onCreated }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await folderApi.createFolder({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      toast.success('Đã tạo folder thành công');
      setName('');
      setDescription('');
      onClose();
      onCreated?.(res.data.id);
      navigate(`/library/folders/${res.data.id}`);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Không thể tạo folder'));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-vutru/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className="bg-white dark:bg-night-surface rounded-2xl shadow-2xl w-full max-w-md border border-cam/10 dark:border-night-border overflow-hidden my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-night-border">
            <h2 className="text-xl font-bold text-vutru">Tạo folder mới</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-vutruNhat hover:text-vutru text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-night-elevated"
            >
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-vutru mb-2">Tên folder / Lớp học</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Lớp 9 Thầy Hoàng, TOEIC 2026..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated focus:outline-none focus:ring-2 focus:ring-cam/30"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-vutru mb-2">Mô tả (tùy chọn)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi chú về lớp hoặc môn học..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated focus:outline-none focus:ring-2 focus:ring-cam/30 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-vien flex-1 text-sm">
                Hủy
              </button>
              <button type="submit" disabled={loading} className="btn btn-chinh flex-1 text-sm disabled:opacity-60">
                {loading ? 'Đang tạo...' : 'Tạo folder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CreateFolderModal;
