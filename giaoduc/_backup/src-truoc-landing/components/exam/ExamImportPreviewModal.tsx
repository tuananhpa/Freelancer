import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export interface ImportedOption {
  id: string;
  content: string;
  isCorrect: boolean;
}

export interface ImportedQuestion {
  id: string;
  content: string;
  points: number;
  skillTag: string;
  options: ImportedOption[];
}

interface ExamImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (questions: ImportedQuestion[]) => void;
  questions: ImportedQuestion[];
  meta?: {
    fileName?: string;
    sourceFormat?: string;
    parseMethod?: string;
    message?: string;
    totalExtracted?: number;
    mappedWithAnswerKey?: number;
  };
}

const METHOD_LABELS: Record<string, string> = {
  AZOTA: 'Mapping cấu trúc (Azota)',
  AI_SCAN: 'AI Scan',
  RULE_BASED: 'Mapping cấu trúc',
  AI: 'AI Scan',
};

const stripHtml = (html: string) =>
  html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const ExamImportPreviewModal: React.FC<ExamImportPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  questions: initialQuestions,
  meta,
}) => {
  const [questions, setQuestions] = useState(initialQuestions);

  React.useEffect(() => {
    if (isOpen) setQuestions(initialQuestions);
  }, [isOpen, initialQuestions]);

  const toggleCorrect = (qId: string, optId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id !== qId
          ? q
          : {
              ...q,
              options: q.options.map((o) => ({
                ...o,
                isCorrect: o.id === optId,
              })),
            }
      )
    );
  };

  const removeQuestion = (qId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xem trước & mapping đáp án" maxWidth="3xl">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {meta && (
          <div className="p-3 rounded-xl bg-kem dark:bg-night-elevated text-sm">
            <p className="font-semibold text-vutru">
              {meta.fileName} · {meta.sourceFormat} · {METHOD_LABELS[meta.parseMethod || ''] || meta.parseMethod}
            </p>
            <p className="text-vutruNhat mt-1">{meta.message}</p>
            <p className="text-xs text-vutruNhat mt-1">
              {meta.totalExtracted} câu · {meta.mappedWithAnswerKey} câu có đáp án mapped
            </p>
          </div>
        )}

        {questions.length === 0 ? (
          <p className="text-center text-vutruNhat py-8">Không còn câu hỏi nào để import.</p>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className="border border-gray-100 dark:border-night-border rounded-xl p-4">
              <div className="flex justify-between items-start gap-2 mb-3">
                <p className="font-bold text-vutru text-sm">
                  Câu {idx + 1}: {stripHtml(q.content).slice(0, 120)}
                  {stripHtml(q.content).length > 120 ? '…' : ''}
                </p>
                <button
                  type="button"
                  onClick={() => removeQuestion(q.id)}
                  className="text-xs text-red-500 hover:underline shrink-0"
                >
                  Xóa
                </button>
              </div>
              <div className="space-y-2">
                {q.options.map((o, oIdx) => (
                  <label
                    key={o.id}
                    className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer text-sm ${
                      o.isCorrect
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-night-elevated border border-transparent'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={o.isCorrect}
                      onChange={() => toggleCorrect(q.id, o.id)}
                      className="mt-0.5 accent-cam"
                    />
                    <span>
                      <span className="font-semibold text-vutruNhat mr-1">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      {stripHtml(o.content)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-night-border">
        <Button variant="outline" onClick={onClose}>Hủy</Button>
        <Button
          variant="primary"
          disabled={questions.length === 0}
          onClick={() => onConfirm(questions)}
        >
          Thêm {questions.length} câu vào đề thi
        </Button>
      </div>
    </Modal>
  );
};

export default ExamImportPreviewModal;
