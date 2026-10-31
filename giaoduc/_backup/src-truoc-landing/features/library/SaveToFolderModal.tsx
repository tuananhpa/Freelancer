import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { folderApi, ContentFolder } from '../../services/folderApi';
import { resourceApi } from '../../services/resourceApi';
import { useToast } from '../../context/ToastContext';
import { Folder, Bookmark, Plus } from 'lucide-react';
import CreateFolderModal from '../../components/common/CreateFolderModal';

interface SaveToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
  resourceTitle: string;
  onSaved?: () => void;
}

const SaveToFolderModal: React.FC<SaveToFolderModalProps> = ({
  isOpen,
  onClose,
  resourceId,
  resourceTitle,
  onSaved,
}) => {
  const toast = useToast();
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const res = await folderApi.getMyFolders(0, 50);
      setFolders(res.data.content || []);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedFolderId('');
      loadFolders();
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await resourceApi.toggleBookmark(resourceId, selectedFolderId || undefined);
      toast.success('Đã lưu tài liệu vào kho của bạn!');
      onSaved?.();
      onClose();
    } catch (err: any) {
      toast.error('Lỗi khi lưu tài liệu: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Lưu tài liệu vào kho cá nhân" maxWidth="md">
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-cam/10 border border-cam/20 flex items-start gap-3">
            <Bookmark className="text-cam shrink-0 mt-0.5" size={18} />
            <div className="min-w-0">
              <p className="text-xs text-vutruNhat dark:text-night-muted font-medium">Lưu vào bộ sưu tập</p>
              <h4 className="text-sm font-bold text-vutru dark:text-night-text truncate">{resourceTitle}</h4>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider">
                Chọn thư mục lưu trữ (Tùy chọn)
              </label>
              <button
                type="button"
                onClick={() => setCreateFolderOpen(true)}
                className="text-xs font-bold text-cam hover:text-camDam flex items-center gap-1"
              >
                <Plus size={13} /> Tạo folder mới
              </button>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-gray-400">Đang tải danh sách thư mục...</div>
            ) : folders.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-gray-50 dark:bg-night-elevated border border-dashed border-gray-200 dark:border-night-border">
                <Folder size={24} className="mx-auto text-gray-400 mb-1" />
                <p className="text-xs text-vutruNhat dark:text-night-muted">Chưa có thư mục nào</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Tài liệu sẽ được lưu vào danh sách "Đã lưu"</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => setSelectedFolderId('')}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    selectedFolderId === ''
                      ? 'border-cam bg-cam/5 text-cam'
                      : 'border-gray-100 dark:border-night-border hover:bg-gray-50 dark:hover:bg-night-elevated text-vutru dark:text-night-text'
                  }`}
                >
                  <Bookmark size={15} />
                  <span>Kho đã lưu chung (Không phân thư mục)</span>
                </button>

                {folders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFolderId(f.id)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2.5 transition-all ${
                      selectedFolderId === f.id
                        ? 'border-cam bg-cam/5 text-cam'
                        : 'border-gray-100 dark:border-night-border hover:bg-gray-50 dark:hover:bg-night-elevated text-vutru dark:text-night-text'
                    }`}
                  >
                    <Folder size={15} className="text-cam" />
                    <span className="truncate">{f.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-night-border">
            <Button variant="ghost" type="button" onClick={onClose} disabled={saving}>
              Hủy
            </Button>
            <Button variant="primary" type="button" onClick={handleSave} isLoading={saving}>
              Lưu ngay
            </Button>
          </div>
        </div>
      </Modal>

      <CreateFolderModal
        isOpen={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        onCreated={loadFolders}
      />
    </>
  );
};

export default SaveToFolderModal;
