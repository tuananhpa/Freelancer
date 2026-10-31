import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import TipTapEditor from '../common/TipTapEditor';
import { useToast } from '../../context/ToastContext';

import Portal from '../ui/Portal';
export interface ImportedOption {
  id: string;
  content: string;
  isCorrect: boolean;
}

export interface ImportedPassage {
  id: string;
  instruction?: string;
  content: string;
  questionNumbers?: number[];
}

export interface ImportedQuestion {
  id: string;
  sourceNumber: number;
  sectionId?: string | null;
  stem: string;
  content: string;
  points: number;
  skillTag: string;
  options: ImportedOption[];
}

interface ExamImportAzotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (questions: ImportedQuestion[], passages: ImportedPassage[]) => void;
  questions: ImportedQuestion[];
  passages: ImportedPassage[];
  fileUrl?: string | null;
  fileName?: string;
  meta?: {
    parseMethod?: string;
    message?: string;
    totalExtracted?: number;
    mappedWithAnswerKey?: number;
  };
}

const stripHtml = (html: string) =>
  html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const ExamImportAzotaModal: React.FC<ExamImportAzotaModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  questions: initialQuestions,
  passages,
  fileUrl,
  fileName,
  meta,
}) => {
  const toast = useToast();
  const [questions, setQuestions] = useState(initialQuestions);
  const [localPassages, setLocalPassages] = useState(passages);
  const [activeNum, setActiveNum] = useState(1);
  const [auditMode, setAuditMode] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setQuestions(initialQuestions);
      setLocalPassages(passages);
      setActiveNum(initialQuestions[0]?.sourceNumber ?? 1);
      setAuditMode(true);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialQuestions, passages]);

  const hasAnswerKey = (meta?.mappedWithAnswerKey ?? 0) > 0;

  const active = questions.find((q) => q.sourceNumber === activeNum) ?? questions[0];
  const activePassage = active?.sectionId
    ? localPassages.find((p) => p.id === active.sectionId)
    : null;

  const missingAnswerNums = useMemo(
    () =>
      questions
        .filter((q) => !q.options.some((o) => o.isCorrect))
        .map((q) => q.sourceNumber),
    [questions]
  );

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

  const updatePoints = (qId: string, points: number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, points } : q))
    );
  };

  const updateStem = (qId: string, html: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId ? { ...q, stem: html, content: html } : q
      )
    );
  };

  const updatePassageContent = (passageId: string, content: string) => {
    setLocalPassages((prev) =>
      prev.map((p) => (p.id === passageId ? { ...p, content } : p))
    );
  };

  const updateOptionContent = (qId: string, optId: string, content: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id !== qId
          ? q
          : {
              ...q,
              options: q.options.map((o) =>
                o.id === optId ? { ...o, content } : o
              ),
            }
      )
    );
  };

  const removeQuestion = (qId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const addQuestion = () => {
    const newId = Date.now().toString() + Math.random().toString();
    const maxNumber = questions.length > 0 ? Math.max(...questions.map(q => q.sourceNumber)) : 0;
    const newQuestion: ImportedQuestion = {
      id: newId,
      sourceNumber: maxNumber + 1,
      stem: '',
      content: '',
      points: 1,
      skillTag: 'GENERAL',
      options: [
        { id: Date.now().toString() + 'A', content: '', isCorrect: true },
        { id: Date.now().toString() + 'B', content: '', isCorrect: false },
        { id: Date.now().toString() + 'C', content: '', isCorrect: false },
        { id: Date.now().toString() + 'D', content: '', isCorrect: false },
      ]
    };
    setQuestions((prev) => [...prev, newQuestion]);
    setActiveNum(newQuestion.sourceNumber);
  };

  const addOption = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const newOption: ImportedOption = {
          id: Date.now().toString() + Math.random().toString(),
          content: '',
          isCorrect: q.options.length === 0,
        };
        return { ...q, options: [...q.options, newOption] };
      })
    );
  };

  const removeOption = (qId: string, optId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const newOptions = q.options.filter((o) => o.id !== optId);
        // Ensure at least one correct option if there are any options left
        if (!newOptions.some((o) => o.isCorrect) && newOptions.length > 0) {
          newOptions[0].isCorrect = true;
        }
        return { ...q, options: newOptions };
      })
    );
  };

  // Prevent rendering if there's no active question and we can't find one
  if (!isOpen) return null;

  const canSave = questions.length > 0;

  const handleContinue = async () => {
    if (missingAnswerNums.length > 0) {
      const ok = await toast.confirm(
        `${missingAnswerNums.length} câu chưa chọn đáp án đúng. File không có bảng đáp án — bạn có thể chỉnh sau trong màn soạn đề. Tiếp tục thêm vào đề thi?`,
        { title: 'Thiếu đáp án', confirmLabel: 'Tiếp tục', cancelLabel: 'Hủy' },
      );
      if (!ok) return;
    }
    onConfirm(questions, localPassages);
  };

  const content = (
    <Portal><div className="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-night-bg">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-night-border bg-white dark:bg-night-surface shrink-0">
        <div className="min-w-0">
          <p className="font-bold text-vutru truncate">{fileName || 'Import đề thi'}</p>
          <p className="text-xs text-vutruNhat truncate">{meta?.message}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-2 text-sm text-vutruNhat cursor-pointer">
            <input
              type="checkbox"
              checked={auditMode}
              onChange={(e) => setAuditMode(e.target.checked)}
              className="accent-cam"
            />
            Soát lỗi
          </label>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button
            variant="primary"
            disabled={!canSave}
            onClick={handleContinue}
          >
            Tiếp tục
          </Button>
        </div>
      </div>

      {/* Warning banner */}
      {auditMode && missingAnswerNums.length > 0 && (
        <div className={`px-4 py-3 border-b text-sm shrink-0 ${
          hasAnswerKey
            ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900'
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
        }`}>
          <p className={`font-semibold ${
            hasAnswerKey ? 'text-red-700 dark:text-red-300' : 'text-amber-800 dark:text-amber-200'
          }`}>
            {hasAnswerKey
              ? 'Chưa thể lưu — vui lòng chọn đáp án cho các câu sau:'
              : `File không có bảng đáp án — ${missingAnswerNums.length} câu chưa chọn đáp án (có thể chỉnh sau)`}
          </p>
          {hasAnswerKey && (
            <p className="text-red-600 dark:text-red-400 mt-1 text-xs">
              {missingAnswerNums.length <= 12
                ? `Câu ${missingAnswerNums.join(', Câu ')}`
                : `${missingAnswerNums.length} câu: Câu ${missingAnswerNums.slice(0, 8).join(', Câu ')}…`}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        {/* Question navigator */}
        <aside className="lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-night-border bg-white dark:bg-night-surface overflow-y-auto max-h-40 lg:max-h-none">
          <div className="p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-vutruNhat uppercase">Đi đến câu</p>
              <button onClick={addQuestion} className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                <Plus className="w-3 h-3" /> Thêm
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {questions.map((q) => {
                const hasError = auditMode && hasAnswerKey && !q.options.some((o) => o.isCorrect);
                const needsAnswer = auditMode && !hasAnswerKey && !q.options.some((o) => o.isCorrect);
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setActiveNum(q.sourceNumber)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                      activeNum === q.sourceNumber
                        ? 'bg-cam text-white'
                        : hasError
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          : needsAnswer
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                            : 'bg-gray-100 dark:bg-night-elevated text-vutruNhat hover:bg-cam/10'
                    }`}
                  >
                    {q.sourceNumber}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Editor */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 min-w-0">
          {!active ? (
            <div className="text-center py-10 text-gray-500">Chưa có câu hỏi nào. Nhấn Thêm để tạo câu mới.</div>
          ) : (
            <>
              {activePassage && (
            <div className="rounded-xl border-2 border-cam/30 bg-kem/50 dark:bg-night-elevated p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-camDam uppercase">Đoạn đọc (dùng chung)</p>
                <span className="text-[10px] text-vutruNhat">Chỉnh sửa nếu mapping thiếu/sai</span>
              </div>
              {activePassage.instruction && (
                <p className="text-xs text-vutruNhat italic">{stripHtml(activePassage.instruction)}</p>
              )}
              <TipTapEditor
                key={activePassage.id}
                value={activePassage.content}
                onChange={(html) => updatePassageContent(activePassage.id, html)}
                minHeight="120px"
                placeholder="Nội dung đoạn đọc..."
              />
            </div>
          )}

          <div className={`rounded-xl border p-4 ${
            auditMode && hasAnswerKey && !active.options.some((o) => o.isCorrect)
              ? 'border-red-300 dark:border-red-800 bg-red-50/30 dark:bg-red-950/20'
              : auditMode && !hasAnswerKey && !active.options.some((o) => o.isCorrect)
                ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20'
                : 'border-gray-200 dark:border-night-border bg-white dark:bg-night-surface'
          }`}>
            <div className="flex justify-between items-start gap-2 mb-3">
              <p className="font-bold text-vutru shrink-0">Question {active.sourceNumber}.</p>
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-xs text-vutruNhat flex items-center gap-1">
                  Điểm
                  <input
                    type="number"
                    min={0.1}
                    step={0.05}
                    value={active.points}
                    onChange={(e) => updatePoints(active.id, parseFloat(e.target.value) || 0.25)}
                    className="w-16 px-2 py-1 rounded border border-gray-200 dark:border-night-border text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeQuestion(active.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Xóa
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-vutruNhat uppercase block mb-1.5">
                Nội dung câu hỏi
              </label>
              <TipTapEditor
                key={active.id}
                value={active.stem}
                onChange={(html) => updateStem(active.id, html)}
                minHeight="100px"
                placeholder={`Nội dung câu ${active.sourceNumber}...`}
              />
            </div>

            <div className="flex justify-between items-center mb-2 mt-4">
              <p className="text-xs font-bold text-vutruNhat uppercase">Đáp án</p>
              <button 
                onClick={() => addOption(active.id)}
                className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700"
              >
                <Plus className="w-3 h-3" /> Thêm lựa chọn
              </button>
            </div>
            <div className="space-y-2">
              {active.options.map((o, oIdx) => (
                <div
                  key={o.id}
                  className={`flex items-start gap-2 p-3 rounded-lg text-sm border ${
                    o.isCorrect
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-night-elevated border-gray-100 dark:border-night-border'
                  }`}
                >
                  <input
                    type="radio"
                    name={`correct-${active.id}`}
                    checked={o.isCorrect}
                    onChange={() => toggleCorrect(active.id, o.id)}
                    className="mt-2 accent-cam shrink-0"
                    title="Chọn đáp án đúng"
                  />
                  <span className="font-bold text-vutruNhat mt-1.5 shrink-0 w-5 text-center">
                    {String.fromCharCode(65 + oIdx)}.
                  </span>
                  <div className="flex-1">
                    <TipTapEditor
                      value={o.content}
                      onChange={(html) => updateOptionContent(active.id, o.id, html)}
                      minHeight="60px"
                    />
                  </div>
                  <button
                    onClick={() => removeOption(active.id, o.id)}
                    className="text-gray-400 hover:text-red-500 p-2 shrink-0 mt-1"
                    title="Xóa lựa chọn"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {auditMode && !active.options.some((o) => o.isCorrect) && active.options.length > 0 && (
              <p className={`text-xs mt-3 ${hasAnswerKey ? 'text-red-600' : 'text-amber-700 dark:text-amber-300'}`}>
                {hasAnswerKey
                  ? 'Vui lòng chọn đáp án cho câu hỏi này'
                  : 'Chưa chọn đáp án — có thể bỏ qua và chỉnh sau'}
              </p>
            )}
          </div>
          </>
          )}
        </main>

        {/* PDF preview */}
        {fileUrl && (
          <aside className="hidden xl:block xl:w-[42%] border-l border-gray-200 dark:border-night-border bg-gray-100 dark:bg-night-bg shrink-0">
            <iframe
              title="PDF preview"
              src={fileUrl}
              className="w-full h-full min-h-[400px]"
            />
          </aside>
        )}
      </div>
    </div></Portal>
  );

  return createPortal(content, document.body);
};

export default ExamImportAzotaModal;
