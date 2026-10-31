import { getApiErrorMessage } from '../../services/api';
import { Folder, FolderOpen } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { folderApi, ContentFolder } from '../../services/folderApi';
import { useToast } from '../../context/ToastContext';

interface FolderSelectorProps {
  value: string | null;
  onChange: (folderId: string | null) => void;
  label?: string;
}

const FolderSelector: React.FC<FolderSelectorProps> = ({
  value,
  onChange,
  label = 'Folder / Lớp học',
}) => {
  const toast = useToast();
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadFolders = async () => {
    try {
      const res = await folderApi.getMyFolders();
      setFolders(res.data?.content || []);
    } catch {
      /* optional for students */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await folderApi.createFolder({ name: newName.trim() });
      setFolders((prev) => [res.data, ...prev]);
      onChange(res.data.id);
      setNewName('');
      setShowCreate(false);
      toast.success('Đã tạo folder mới');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Không thể tạo folder'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-vutru">{label}</label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            value === null
              ? 'bg-cam text-white'
              : 'bg-white border border-gray-200 text-vutruNhat hover:border-cam/40'
          }`}
        >
          <FolderOpen size={16} className="inline mr-1.5" /> Không phân loại
        </button>
        {folders.map((folder) => (
          <button
            key={folder.id}
            type="button"
            onClick={() => onChange(folder.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              value === folder.id
                ? 'bg-cam text-white'
                : 'bg-white border border-gray-200 text-vutruNhat hover:border-cam/40'
            }`}
          >
            <Folder size={16} className="inline mr-1.5" /> {folder.name}
            {(folder.examCount ?? 0) + (folder.deckCount ?? 0) > 0 && (
              <span className="ml-1 opacity-70 text-xs">
                ({(folder.examCount ?? 0) + (folder.deckCount ?? 0)})
              </span>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="px-3 py-1.5 rounded-full text-sm font-semibold border-2 border-dashed border-cam/40 text-cam hover:bg-camNhat transition-colors"
        >
          + Tạo folder
        </button>
      </div>

      {showCreate && (
        <div className="flex gap-2 mt-2 animate-fade-in">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tên lớp / folder (VD: Lớp 10A1, TOEIC 2026...)"
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cam/30 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreate())}
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="btn btn-chinh text-sm py-2 disabled:opacity-50"
          >
            {creating ? '...' : 'Tạo'}
          </button>
        </div>
      )}

      {loading && <p className="text-xs text-vutruNhat">Đang tải folder...</p>}
      <p className="text-xs text-vutruNhat">
        Gom đề thi và Flashcard theo lớp học để quản lý dễ hơn
      </p>
    </div>
  );
};

export default FolderSelector;
