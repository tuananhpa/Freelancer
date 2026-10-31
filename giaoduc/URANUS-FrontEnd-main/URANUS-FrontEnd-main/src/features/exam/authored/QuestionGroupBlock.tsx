import React from 'react';
import { Trash2, GripVertical, FileText } from 'lucide-react';
import TipTapEditor from '../../../components/common/TipTapEditor';
import QuestionCard, { Question } from './QuestionCard';
import KaTeXPreview from './KaTeXPreview';
import Button from '../../../components/ui/Button';

export interface QuestionGroup {
  id: string;
  groupTitle: string;
  passageText: string;
  questions: Question[];
}

interface QuestionGroupBlockProps {
  group: QuestionGroup;
  index: number;
  activeQuestionId: string | null;
  onActivateQuestion: (qId: string) => void;
  onRemoveGroup: () => void;
  onGroupChange: (field: keyof QuestionGroup, value: any) => void;
  onQuestionChange: (qId: string, field: keyof Question, value: any) => void;
  onRemoveQuestion: (qId: string, e: React.MouseEvent) => void;
  onAddQuestionToGroup: () => void;
  onAddOption: (qId: string) => void;
  onRemoveOption: (qId: string, optId: string) => void;
  onOptionChange: (qId: string, optId: string, value: string) => void;
  onOptionCorrectToggle: (qId: string, optId: string) => void;
}

const QuestionGroupBlock: React.FC<QuestionGroupBlockProps> = ({
  group,
  index,
  activeQuestionId,
  onActivateQuestion,
  onRemoveGroup,
  onGroupChange,
  onQuestionChange,
  onRemoveQuestion,
  onAddQuestionToGroup,
  onAddOption,
  onRemoveOption,
  onOptionChange,
  onOptionCorrectToggle
}) => {
  return (
    <div className="bg-indigo-50/50 rounded-xl border border-indigo-200 overflow-hidden mb-6">
      <div className="p-4 bg-indigo-100/50 border-b border-indigo-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <GripVertical className="w-5 h-5 text-indigo-400 cursor-grab" />
          <h3 className="font-semibold text-indigo-900">Nhóm câu hỏi {index + 1}</h3>
        </div>
        <button 
          onClick={onRemoveGroup}
          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
          title="Xóa nhóm câu hỏi"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Tiêu đề nhóm</label>
          <input
            type="text"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="VD: Đọc đoạn văn sau và trả lời câu hỏi"
            value={group.groupTitle}
            onChange={(e) => onGroupChange('groupTitle', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Nội dung bài đọc / Ngữ cảnh chung
          </label>
          <TipTapEditor
            value={group.passageText}
            onChange={(content) => onGroupChange('passageText', content)}
            placeholder="Nhập nội dung bài đọc..."
          />
          <KaTeXPreview text={group.passageText} />
        </div>

        <div className="mt-6 pt-4 border-t border-indigo-200 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-indigo-900">Các câu hỏi trong nhóm</h4>
            <Button size="sm" variant="outline" onClick={onAddQuestionToGroup}>
              + Thêm câu hỏi vào nhóm
            </Button>
          </div>

          <div className="space-y-4 pl-6 border-l-2 border-indigo-300">
            {group.questions.map((q, qIdx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={qIdx} // Có thể cần điều chỉnh index hiển thị toàn cục
                isActive={activeQuestionId === q.id}
                onActivate={() => onActivateQuestion(q.id)}
                onChange={(field, value) => onQuestionChange(q.id, field, value)}
                onRemove={(e) => onRemoveQuestion(q.id, e)}
                onAddOption={() => onAddOption(q.id)}
                onRemoveOption={(optId) => onRemoveOption(q.id, optId)}
                onOptionChange={(optId, value) => onOptionChange(q.id, optId, value)}
                onOptionCorrectToggle={(optId) => onOptionCorrectToggle(q.id, optId)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionGroupBlock;
