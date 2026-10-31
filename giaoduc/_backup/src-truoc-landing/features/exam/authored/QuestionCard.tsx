import React, { useState } from 'react';
import { Trash2, Plus, GripVertical, FileText, CheckCircle } from 'lucide-react';
import TipTapEditor from '../../../components/common/TipTapEditor';
import Button from '../../../components/ui/Button';
import KaTeXPreview from './KaTeXPreview';

export interface Option {
  id: string;
  content: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  content: string;
  points: number;
  skillTag: string;
  questionType: string;
  options: Option[];
  explanation?: string;
  groupId?: string;
}

interface QuestionCardProps {
  question: Question;
  index: number;
  isActive: boolean;
  onActivate: () => void;
  onChange: (field: keyof Question, value: any) => void;
  onRemove: (e: React.MouseEvent) => void;
  onAddOption: () => void;
  onRemoveOption: (optId: string) => void;
  onOptionChange: (optId: string, value: string) => void;
  onOptionCorrectToggle: (optId: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  isActive,
  onActivate,
  onChange,
  onRemove,
  onAddOption,
  onRemoveOption,
  onOptionChange,
  onOptionCorrectToggle
}) => {
  const [showExplanation, setShowExplanation] = useState(!!question.explanation);
  
  return (
    <div 
      id={`question-${question.id}`}
      className={`bg-white rounded-xl shadow-sm border transition-all duration-200 overflow-hidden cursor-pointer ${
        isActive ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200 hover:border-blue-300'
      }`}
      onClick={onActivate}
    >
      <div className={`px-4 py-3 border-b flex justify-between items-center ${isActive ? 'bg-blue-50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
          <h3 className="font-semibold text-gray-700">Câu hỏi {index + 1}</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Điểm:</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={question.points}
              onChange={(e) => onChange('points', parseFloat(e.target.value) || 0)}
              className="w-16 px-2 py-1 text-sm border rounded"
              onClick={e => e.stopPropagation()}
            />
          </div>
          <button 
            onClick={onRemove}
            className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
            title="Xóa câu hỏi"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isActive && (
        <div className="p-5 space-y-6 cursor-default" onClick={e => e.stopPropagation()}>
          {/* Editor nội dung */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Nội dung câu hỏi</label>
            <TipTapEditor
              value={question.content}
              onChange={(content) => onChange('content', content)}
              placeholder="Nhập nội dung câu hỏi (Hỗ trợ LaTeX: $...$)"
            />
            <KaTeXPreview text={question.content} />
          </div>

          {/* Đáp án */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">Đáp án</label>
              <Button size="sm" variant="outline" onClick={onAddOption}>
                <Plus className="w-4 h-4 mr-1" /> Thêm lựa chọn
              </Button>
            </div>
            
            <div className="space-y-2">
              {question.options.map((opt, optIdx) => (
                <div key={opt.id} className={`flex items-start gap-3 p-3 rounded-lg border ${opt.isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <button
                    onClick={() => onOptionCorrectToggle(opt.id)}
                    className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
                      opt.isCorrect ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white hover:border-green-400'
                    }`}
                    title="Đánh dấu là đáp án đúng"
                  >
                    {opt.isCorrect && <CheckCircle className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none focus:ring-0 p-0 text-gray-800"
                      placeholder={`Lựa chọn ${String.fromCharCode(65 + optIdx)}`}
                      value={opt.content}
                      onChange={(e) => onOptionChange(opt.id, e.target.value)}
                    />
                    <KaTeXPreview text={opt.content} />
                  </div>
                  <button onClick={() => onRemoveOption(opt.id)} className="text-gray-400 hover:text-red-500 mt-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {question.options.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4 border-2 border-dashed rounded-lg">
                  Chưa có lựa chọn nào. Bấm "Thêm lựa chọn" để bắt đầu.
                </p>
              )}
            </div>
          </div>

          {/* Explanation Toggle */}
          <div className="pt-4 border-t border-gray-100">
            <button 
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <FileText className="w-4 h-4" />
              {showExplanation ? 'Ẩn giải thích đáp án' : 'Thêm giải thích đáp án'}
            </button>
            
            {showExplanation && (
              <div className="mt-3 space-y-2">
                <textarea
                  className="w-full p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 resize-y min-h-[100px]"
                  placeholder="Giải thích chi tiết vì sao chọn đáp án này..."
                  value={question.explanation || ''}
                  onChange={(e) => onChange('explanation', e.target.value)}
                />
                <KaTeXPreview text={question.explanation || ''} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
