import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Layers, BookOpen, X, Plus, FolderOpen } from 'lucide-react';

import Portal from '../../components/ui/Portal';
interface ClassworkCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  selectedFolderId?: string;
  onOpenExamPicker: () => void;
  onOpenResourcePicker: (type: 'FLASHCARD' | 'VOCAB') => void;
}

const ClassworkCreateModal: React.FC<ClassworkCreateModalProps> = ({
  isOpen,
  onClose,
  classId,
  selectedFolderId,
  onOpenExamPicker,
  onOpenResourcePicker,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const folderQuery = selectedFolderId ? `&classFolderId=${selectedFolderId}` : '';

  const resourceTypes = [
    {
      id: 'exam',
      title: 'Đề thi trắc nghiệm',
      description: 'Gắn đề thi có sẵn từ kho hoặc tạo đề thi chi tiết / đề thi PDF mới.',
      icon: <FileText size={24} />,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40',
      actions: [
        {
          label: 'Chọn từ kho đề',
          icon: <FolderOpen size={13} />,
          onClick: () => {
            onClose();
            onOpenExamPicker();
          },
        },
        {
          label: 'Tạo đề chi tiết',
          icon: <Plus size={13} />,
          onClick: () => {
            onClose();
            navigate(`/exams/create?type=DETAILED&classId=${classId}${folderQuery}`);
          },
        },
        {
          label: 'Tạo đề PDF',
          icon: <Plus size={13} />,
          onClick: () => {
            onClose();
            navigate(`/exams/create?type=ANSWER_SHEET&classId=${classId}${folderQuery}`);
          },
        },
      ],
    },
    {
      id: 'flashcard',
      title: 'Bộ thẻ ghi nhớ (Flashcard)',
      description: 'Đính kèm bộ thẻ ghi nhớ để học sinh tự ôn tập và kiểm tra kiến thức.',
      icon: <Layers size={24} />,
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40',
      actions: [
        {
          label: 'Chọn từ kho thẻ',
          icon: <FolderOpen size={13} />,
          onClick: () => {
            onClose();
            onOpenResourcePicker('FLASHCARD');
          },
        },
        {
          label: 'Tạo bộ thẻ mới',
          icon: <Plus size={13} />,
          onClick: () => {
            onClose();
            navigate(`/flashcards/create?classId=${classId}${folderQuery}`);
          },
        },
      ],
    },
    {
      id: 'vocab',
      title: 'Bộ từ vựng (Vocabulary)',
      description: 'Gắn danh sách từ vựng kèm phát âm và phiên âm để học sinh ôn luyện.',
      icon: <BookOpen size={24} />,
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40',
      actions: [
        {
          label: 'Chọn từ kho từ vựng',
          icon: <FolderOpen size={13} />,
          onClick: () => {
            onClose();
            onOpenResourcePicker('VOCAB');
          },
        },
        {
          label: 'Tạo danh sách mới',
          icon: <Plus size={13} />,
          onClick: () => {
            onClose();
            navigate(`/vocabulary/create?classId=${classId}${folderQuery}`);
          },
        },
      ],
    },
  ];

  return (
    <Portal><div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vutru/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white dark:bg-night-surface rounded-2xl shadow-soft max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 dark:border-night-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-night-border flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg sm:text-xl font-bold text-vutru dark:text-night-text">
              Thêm bài tập & tài nguyên lớp học
            </h2>
            <p className="text-xs text-vutruNhat dark:text-night-muted">
              Chọn định dạng học liệu bạn muốn giao cho học sinh
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-night-elevated text-vutruNhat dark:text-night-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content Grid */}
        <div className="p-6 overflow-y-auto bg-gray-50/50 dark:bg-night-page/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resourceTypes.map((type) => (
              <div
                key={type.id}
                className="p-5 rounded-2xl border border-gray-200/90 dark:border-night-border bg-white dark:bg-night-surface hover:border-cam/50 dark:hover:border-cam/50 hover:shadow-soft transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${type.color} group-hover:scale-105 transition-transform`}>
                    {type.icon}
                  </div>
                  <h3 className="font-heading text-base font-bold text-vutru dark:text-night-text mb-1">
                    {type.title}
                  </h3>
                  <p className="text-xs text-vutruNhat dark:text-night-muted leading-relaxed mb-4">
                    {type.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100 dark:border-night-border/80 mt-auto">
                  {type.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-camNhat/40 dark:bg-night-elevated dark:hover:bg-night-border text-xs font-bold text-vutru dark:text-slate-200 hover:text-camDam dark:hover:text-cam flex items-center gap-1.5 transition-all"
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div></Portal>
  );
};

export default ClassworkCreateModal;
