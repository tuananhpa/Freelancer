import { getApiErrorMessage } from '../../services/api';
import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import classService, { ClassFolder } from '../../services/class.service';
import { flashcardApi } from '../../services/flashcardApi';
import { useToast } from '../../context/ToastContext';
import { buildFolderTree, flattenTree, indentedLabel } from '../../utils/classFolderTree';
import { useNavigate } from 'react-router-dom';
import { Layers, BookOpen, Plus, Folder, ChevronDown, CheckCircle2 } from 'lucide-react';

interface AttachResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onSuccess: () => void;
  resourceType: 'FLASHCARD' | 'VOCAB';
}

interface ResourceItem {
  id: string;
  title: string;
  description?: string;
  itemCount: number;
}

const AttachResourceModal: React.FC<AttachResourceModalProps> = ({
  isOpen,
  onClose,
  classId,
  onSuccess,
  resourceType,
}) => {
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [folders, setFolders] = useState<ClassFolder[]>([]);

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setSelectedResourceId('');
      setSelectedFolderId('');
      fetchData();
    }
  }, [isOpen, resourceType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [foldersRes] = await Promise.all([classService.getClassFolders(classId)]);
      setFolders(foldersRes || []);

      const deckType = resourceType === 'VOCAB' ? 'VOCABULARY' : 'FLASHCARD';
      const res = await flashcardApi.getMyDecks(0, 100, undefined, undefined, deckType);
      let content = res.data?.content || [];
      // Fallback if none found with deckType filter
      if (content.length === 0 && resourceType === 'FLASHCARD') {
        const fallbackRes = await flashcardApi.getMyDecks(0, 100);
        content = (fallbackRes.data?.content || []).filter((d: any) => d.deckType !== 'VOCABULARY');
      }
      setItems(
        content.map((deck: any) => ({
          id: deck.id,
          title: deck.title,
          description: deck.description,
          itemCount: deck.cardCount || (deck.cards ? deck.cards.length : 0),
        }))
      );
    } catch {
      toast.error('Không thể tải danh sách học liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResourceId) {
      toast.warning('Vui lòng chọn một tài nguyên');
      return;
    }

    setSubmitting(true);
    try {
      await classService.assignResource(classId, {
        resourceId: selectedResourceId,
        resourceType: resourceType,
        folderId: selectedFolderId || null,
      });
      toast.success('Đã gắn tài nguyên thành công!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi gắn tài nguyên'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNew = () => {
    if (resourceType === 'FLASHCARD') {
      navigate(`/flashcards/create?classId=${classId}`);
    } else {
      navigate(`/vocabulary/create?classId=${classId}`);
    }
  };

  if (!isOpen) return null;

  const modalTitle = resourceType === 'FLASHCARD' ? 'Gắn bộ thẻ ghi nhớ vào lớp' : 'Gắn bộ từ vựng vào lớp';
  const selectLabel = resourceType === 'FLASHCARD' ? 'Chọn bộ thẻ ghi nhớ' : 'Chọn bộ từ vựng';
  const emptyMessage = resourceType === 'FLASHCARD' ? 'Bạn chưa tạo bộ thẻ ghi nhớ nào trong tài khoản.' : 'Bạn chưa tạo bộ từ vựng nào trong tài khoản.';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <div className="w-[500px] max-w-full p-1 text-vutru dark:text-night-text">
        {loading ? (
          <LoadingOverlay inline={true} text="Đang tải dữ liệu..." />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-vutru dark:text-night-text mb-2">
                {resourceType === 'FLASHCARD' ? <Layers size={14} className="text-emerald-500" /> : <BookOpen size={14} className="text-purple-500" />}
                {selectLabel} <span className="text-red-500">*</span>
              </label>
              {items.length === 0 ? (
                <div className="text-xs text-vutruNhat dark:text-night-muted italic p-4 bg-gray-50 dark:bg-night-elevated rounded-xl border border-dashed border-gray-200 dark:border-night-border text-center">
                  <p>{emptyMessage}</p>
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="mt-2 text-xs font-bold text-cam hover:text-camDam inline-flex items-center gap-1"
                  >
                    <Plus size={13} /> Tạo mới ngay
                  </button>
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface divide-y divide-gray-100 dark:divide-night-border">
                  {items.map((item) => {
                    const isSelected = selectedResourceId === item.id;
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-night-elevated transition-colors ${
                          isSelected ? 'bg-camNhat/20 dark:bg-cam/10 font-semibold' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="resourceSelect"
                          value={item.id}
                          checked={isSelected}
                          onChange={(e) => setSelectedResourceId(e.target.value)}
                          className="accent-cam"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-vutru dark:text-night-text truncate">
                            {item.title}
                          </div>
                          {item.description && (
                            <div className="text-[11px] text-vutruNhat dark:text-night-muted truncate">
                              {item.description}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-vutruNhat dark:text-night-muted bg-gray-100 dark:bg-night-elevated px-2 py-0.5 rounded-full shrink-0">
                          {item.itemCount} thẻ
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-vutru dark:text-night-text mb-1.5">
                <Folder size={14} className="text-cam" />
                Chủ đề / Thư mục <span className="text-[11px] font-normal text-vutruNhat dark:text-night-muted">(Không bắt buộc)</span>
              </label>
              <div className="relative">
                <Select
                  value={selectedFolderId}
                  onChange={(v) => setSelectedFolderId(v)}
                  className="w-full bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-cam transition-all"
                  options={[
                    { value: '', label: '-- Chưa phân loại --' },
                    ...flattenTree(buildFolderTree(folders)).map((folder) => ({
                      value: folder.id,
                      label: indentedLabel(folder),
                    })),
                  ]}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-night-border">
              <button
                type="button"
                onClick={handleCreateNew}
                className="text-xs font-bold text-cam hover:text-camDam flex items-center gap-1 transition-colors"
              >
                <Plus size={13} /> Tạo bộ mới
              </button>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" disabled={!selectedResourceId || submitting} isLoading={submitting}>
                  Xác nhận gắn
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default AttachResourceModal;
