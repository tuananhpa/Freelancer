import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import classService, { ClassFolder } from '../../services/class.service';
import { assignmentApi } from '../../services/assignmentApi';
import { useToast } from '../../context/ToastContext';
import { buildFolderTree, flattenTree, indentedLabel } from '../../utils/classFolderTree';
import { getApiErrorMessage } from '../../services/api';
import { Folder, Layers, BookOpen, PenTool, CheckCircle2 } from 'lucide-react';

interface MoveResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  item: {
    id: string;
    title: string;
    type: string;
    resourceId?: string;
    assignmentId?: string;
    folderId?: string;
  } | null;
  folders: ClassFolder[];
  onSuccess: () => void;
}

const MoveResourceModal: React.FC<MoveResourceModalProps> = ({
  isOpen,
  onClose,
  classId,
  item,
  folders,
  onSuccess,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && item) {
      setSelectedFolderId(item.folderId || '');
    }
  }, [isOpen, item]);

  if (!item) return null;

  const getResourceIcon = () => {
    switch (item.type) {
      case 'FLASHCARD':
        return <Layers size={18} className="text-cam shrink-0" />;
      case 'VOCAB':
        return <BookOpen size={18} className="text-emerald-500 shrink-0" />;
      case 'ASSIGNMENT':
        return <PenTool size={18} className="text-blue-500 shrink-0" />;
      default:
        return <Folder size={18} className="text-cam shrink-0" />;
    }
  };

  const getResourceTypeName = () => {
    switch (item.type) {
      case 'FLASHCARD':
        return 'Thẻ ghi nhớ (Flashcard)';
      case 'VOCAB':
        return 'Bộ từ vựng (Vocabulary)';
      case 'ASSIGNMENT':
        return 'Bài tập tự luận';
      default:
        return 'Tài liệu học tập';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (item.type === 'FLASHCARD' || item.type === 'VOCAB') {
        await classService.assignResource(classId, {
          resourceId: item.resourceId || item.id,
          resourceType: item.type === 'FLASHCARD' ? 'FLASHCARD' : 'VOCAB',
          folderId: selectedFolderId || undefined,
        });
        toast.success('Đã cập nhật chủ đề / thư mục thành công!');
      } else if (item.type === 'ASSIGNMENT' && (item.assignmentId || item.id)) {
        await assignmentApi.updateAssignment(item.assignmentId || item.id, {
          folderId: selectedFolderId || undefined,
        });
        toast.success('Đã cập nhật chủ đề / thư mục bài tập thành công!');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Không thể cập nhật chủ đề / thư mục'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cài đặt Vị trí & Chủ đề trong lớp"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 font-body">
        {/* Resource info banner */}
        <div className="flex items-start gap-3 p-3.5 bg-gray-50 dark:bg-night-elevated border border-gray-200/80 dark:border-night-border rounded-2xl">
          <div className="w-9 h-9 rounded-xl bg-white dark:bg-night-surface border border-gray-200/80 dark:border-night-border flex items-center justify-center shrink-0 shadow-2xs">
            {getResourceIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider block">
              {getResourceTypeName()}
            </span>
            <p className="font-bold text-sm text-vutru dark:text-night-text truncate mt-0.5">
              {item.title}
            </p>
          </div>
        </div>

        {/* Folder selection */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-vutru dark:text-night-text mb-2 flex items-center gap-1.5">
            <Folder size={15} className="text-cam" />
            Chọn Chủ đề / Thư mục đích
          </label>
          <div className="relative">
            <Select
              value={selectedFolderId}
              onChange={(v) => setSelectedFolderId(v)}
              className="w-full bg-white dark:bg-night-surface rounded-2xl border-2 border-gray-100 dark:border-night-border px-4 py-3 text-xs sm:text-sm font-medium text-vutru dark:text-night-text focus:outline-none focus:border-cam dark:focus:border-cam focus:ring-4 focus:ring-cam/15 transition-all"
              options={[
                { value: '', label: '-- Chưa phân loại (Hiển thị ở mục Chung) --' },
                ...flattenTree(buildFolderTree(folders)).map((f) => ({
                  value: f.id,
                  label: f.depth === 0 ? `📁 ${f.name}` : indentedLabel(f),
                })),
              ]}
            />
          </div>
          <p className="text-[11px] text-vutruNhat dark:text-night-muted mt-1.5">
            Tài nguyên sẽ được nhóm vào chủ đề tương ứng trên trang Bài tập của lớp học.
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-night-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={submitting}
            iconLeft={<CheckCircle2 size={16} />}
          >
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MoveResourceModal;
