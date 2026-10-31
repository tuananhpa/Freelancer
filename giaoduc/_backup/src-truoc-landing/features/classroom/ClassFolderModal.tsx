import React, { useState, useEffect, useMemo } from 'react';
import classService, { ClassFolder } from '../../services/class.service';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import {
  buildFolderTree,
  flattenTree,
  indentedLabel,
  descendantIds,
  folderPath,
  MAX_FOLDER_DEPTH,
} from '../../utils/classFolderTree';

interface ClassFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  editFolder?: ClassFolder | null;
  /** Danh sach chu de hien co cua lop, de chon chu de cha. */
  folders?: ClassFolder[];
  /** Chu de cha dat san khi bam "Thêm chủ đề con" tu mot chu de cu the. */
  defaultParentId?: string | null;
  onSuccess: () => void;
}

const ClassFolderModal: React.FC<ClassFolderModalProps> = ({
  isOpen,
  onClose,
  classId,
  editFolder,
  folders = [],
  defaultParentId = null,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const tree = useMemo(() => buildFolderTree(folders), [folders]);

  /**
   * Chon chinh no hoac mot chu de con lam cha se cat roi ca nhanh khoi cay, nen
   * loai ra khoi danh sach. Cung loai nhung chu de da o cap sau cung - them con
   * vao do se vuot qua gioi han cap.
   */
  const parentOptions = useMemo(() => {
    const blocked = editFolder ? descendantIds(tree, editFolder.id) : new Set<string>();
    return flattenTree(tree).filter(
      (n) => !blocked.has(n.id) && n.depth < MAX_FOLDER_DEPTH - 1,
    );
  }, [tree, editFolder]);

  useEffect(() => {
    if (isOpen) {
      setName(editFolder ? editFolder.name : '');
      setParentId((editFolder ? editFolder.parentId : defaultParentId) || '');
    }
  }, [isOpen, editFolder, defaultParentId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (editFolder) {
        await classService.updateClassFolder(classId, editFolder.id, name.trim(), parentId || null);
        toast.success('Cập nhật chủ đề thành công');
      } else {
        await classService.createClassFolder(classId, name.trim(), parentId || null);
        toast.success('Tạo chủ đề thành công');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      // Backend tra ve ly do cu the (vong lap, qua so cap) - hien dung ly do do
      // thay vi mot cau bao loi chung chung.
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editFolder ? 'Chỉnh sửa chủ đề' : 'Tạo chủ đề mới'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-vutru dark:text-night-text mb-1.5">
            Tên chủ đề / thư mục học phần <span className="text-red-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Chương 1: Hàm số và Đạo hàm..."
            required
            autoFocus
          />
          <p className="text-[11px] text-vutruNhat dark:text-night-muted mt-1">
            Chủ đề giúp bạn phân loại bài tập, đề thi và tài liệu học tập theo từng phần rõ ràng.
          </p>
        </div>

        <div>
          <label
            htmlFor="class-folder-parent"
            className="block text-xs font-semibold text-vutru dark:text-night-text mb-1.5"
          >
            Nằm trong chủ đề
          </label>
          <select
            id="class-folder-parent"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-sm text-vutru dark:text-night-text focus:ring-2 focus:ring-cam outline-none"
          >
            <option value="">— Không có (chủ đề cấp cao nhất) —</option>
            {parentOptions.map((node) => (
              <option key={node.id} value={node.id}>
                {indentedLabel(node)}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-vutruNhat dark:text-night-muted mt-1">
            {parentId
              ? `Chủ đề này sẽ nằm trong: ${folderPath(folders, parentId)}`
              : `Để trống nếu đây là chương lớn. Lồng được tối đa ${MAX_FOLDER_DEPTH} cấp.`}
          </p>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-night-border">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Đang lưu...' : editFolder ? 'Cập nhật' : 'Tạo chủ đề'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ClassFolderModal;
