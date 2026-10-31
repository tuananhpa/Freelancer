import React, { useState, useEffect } from 'react';
import { Flag, X, Edit2, Check } from 'lucide-react';
import DOMPurify from 'dompurify';
import TipTapEditor from '../common/TipTapEditor';
import PdfViewer from '../../features/exam/pdf-import/PdfViewer';
import { SlimAudioPlayer, ExamAudioTracksPlayer } from '../common/LessonMediaPlayer';
import { getStatementLabel } from '../../features/exam/examQuestionTypes';

import Portal from '../ui/Portal';
interface Option {
  id: string;
  content: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  content: string;
  points: number;
  questionType?: string;
  groupId?: string;
  options: Option[];
}

interface PassageGroup {
  id: string;
  groupTitle: string;
  passageText: string;
}

interface ExamPreviewModalProps {
  questions: Question[];
  questionGroups: PassageGroup[];
  examData: {
    title: string;
    durationMinutes: number;
    examType?: string;
    pdfUrl?: string | null;
    audioUrl?: string | null;
    audioTracks?: { label: string; url: string }[];
  };
  onClose: () => void;
  onUpdateQuestion?: (qId: string, updates: Partial<Question>) => void;
  onUpdatePassage?: (groupId: string, updates: Partial<PassageGroup>) => void;
}

const ExamPreviewModal: React.FC<ExamPreviewModalProps> = ({ 
  questions, 
  questionGroups, 
  examData, 
  onClose,
  onUpdateQuestion,
  onUpdatePassage
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fontSize, setFontSize] = useState<number>(0); // 0: normal, 1: large, 2: x-large

  // Edit states
  const [editingPassage, setEditingPassage] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);

  // Group Map cho dễ truy xuất
  const passageGroupsMap = questionGroups.reduce((acc, g) => {
    acc[g.id] = g;
    return acc;
  }, {} as Record<string, PassageGroup>);

  // Nếu không có câu hỏi nào thì khỏi render
  if (!questions || questions.length === 0) {
    return (
      <Portal><div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center animate-fade-in p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Đề thi chưa có câu hỏi nào!</h2>
        <p className="text-gray-500 mb-6">Vui lòng thêm câu hỏi trước khi xem trước.</p>
        <button onClick={onClose} className="px-6 py-2 bg-cam text-white font-bold rounded-lg hover:bg-camDam">
          Quay lại Soạn đề
        </button>
      </div></Portal>
    );
  }

  // Chống lỗi khi currentIdx vượt quá số câu hỏi
  const safeCurrentIdx = Math.min(currentIdx, questions.length - 1);
  const currentQ = questions[safeCurrentIdx];

  // Tự động tắt edit khi chuyển câu
  useEffect(() => {
    setEditingPassage(false);
    setEditingQuestion(false);
    setEditingOptionId(null);
  }, [currentIdx]);

  const totalCount = questions.length;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalCount - answeredCount;

  const toggleFlag = (qId: string) => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleSelectOption = (qId: string, optId: string) => {
    setAnswers(prev => ({ ...prev, [qId]: optId }));
  };

  const handleTextResponse = (qId: string, val: string) => {
    setAnswers(prev => {
      const next = { ...prev };
      if (!val.trim()) delete next[qId];
      else next[qId] = val;
      return next;
    });
  };

  const handleStatementAnswer = (questionId: string, optionId: string, isTrue: boolean) => {
    setAnswers((prev) => {
      let current: Record<string, boolean> = {};
      try {
        const raw = prev[questionId];
        if (raw && raw.trim().startsWith('{')) current = JSON.parse(raw);
      } catch {
        current = {};
      }
      return {
        ...prev,
        [questionId]: JSON.stringify({ ...current, [optionId]: isTrue }),
      };
    });
  };

  const getStatementAnswers = (questionId: string): Record<string, boolean> => {
    try {
      const raw = answers[questionId];
      if (raw && raw.trim().startsWith('{')) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return {};
  };

  return (
    <Portal><div className="fixed inset-0 z-[100] bg-kem dark:bg-night-page flex flex-col animate-fade-in overflow-hidden">
      
      {/* ── HEADER (Mô phỏng ExamTake header) ── */}
      <div className="bg-white dark:bg-night-surface border-b border-gray-200 dark:border-night-border shrink-0 sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              title="Đóng Xem Trước"
            >
              <X size={20} strokeWidth={3} />
            </button>
            <div className="hidden sm:block">
              <p className="font-bold text-lg text-vutru truncate max-w-lg">
                {examData?.title || 'Bài thi chưa có tên'}
              </p>
              <p className="text-xs font-bold text-cam">Chế độ xem trước (Preview Mode)</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex bg-gray-100 dark:bg-night-border rounded-xl p-1 mr-2 border border-gray-200 dark:border-night-elevated">
              <button onClick={() => setFontSize(Math.max(0, fontSize - 1))} className="px-3 py-1 font-bold hover:bg-white dark:hover:bg-night-surface rounded-lg transition-colors text-vutru text-sm">A-</button>
              <button onClick={() => setFontSize(Math.min(2, fontSize + 1))} className="px-3 py-1 font-bold hover:bg-white dark:hover:bg-night-surface rounded-lg transition-colors text-vutru text-base">A+</button>
            </div>
            <div className="font-mono text-xl font-bold px-4 py-1.5 rounded-xl bg-cam/15 text-cam">
              {examData.durationMinutes}:00
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Thoát Preview
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── SIDEBAR: Bảng câu hỏi ── */}
        <div className="hidden lg:flex flex-col w-72 bg-white dark:bg-night-surface border-r border-gray-200 dark:border-night-border p-5 overflow-y-auto custom-scrollbar">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-60 text-vutru">Danh sách câu hỏi</h3>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-green-500 inline-block"></span>Đã làm</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-yellow-400 inline-block"></span>Đánh dấu</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-gray-200 inline-block"></span>Chưa làm</span>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isFlagged = flagged.has(q.id);
              const isCurrent = idx === safeCurrentIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  title={`Câu ${idx + 1}`}
                  className={`
                    w-9 h-9 rounded-lg text-xs font-bold transition-all border-2
                    ${isCurrent ? 'border-camDam scale-110 shadow-md' : 'border-transparent'}
                    ${isFlagged ? 'bg-yellow-400 text-white' : isAnswered ? 'bg-green-500 text-white' : 'bg-gray-100 text-vutruNhat hover:bg-gray-200'}
                  `}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-sm space-y-1 text-vutruNhat">
            <div className="flex justify-between"><span>Tổng số câu:</span><span className="font-bold text-vutru">{totalCount}</span></div>
            <div className="flex justify-between"><span>Đã trả lời:</span><span className="font-bold text-green-600">{answeredCount}</span></div>
            <div className="flex justify-between"><span>Chưa làm:</span><span className="font-bold text-gray-500">{unansweredCount}</span></div>
            <div className="flex justify-between"><span>Đánh dấu:</span><span className="font-bold text-yellow-600">{flagged.size}</span></div>
          </div>
        </div>

        {/* ── QUESTION AREA ── */}
        <div className="flex-1 overflow-y-auto">
          <div className={`${(examData.examType === 'ANSWER_SHEET' && examData.pdfUrl) || (currentQ.groupId && passageGroupsMap[currentQ.groupId]) ? 'max-w-[1600px] w-full flex flex-col xl:flex-row gap-6' : 'max-w-7xl'} mx-auto p-4 md:p-8 pb-32`}>
            
            {/* PDF Viewer + Audio bài nghe (neu co) */}
            {examData.examType === 'ANSWER_SHEET' && examData.pdfUrl && (
              <div className="flex-1 flex flex-col gap-3 mb-6 xl:mb-0 xl:sticky xl:top-4 xl:h-[calc(100vh-140px)]">
                {examData.audioTracks && examData.audioTracks.length > 0 ? (
                  <div className="shrink-0">
                    <ExamAudioTracksPlayer tracks={examData.audioTracks} className="w-full" />
                  </div>
                ) : examData.audioUrl && (
                  <div className="shrink-0">
                    <SlimAudioPlayer url={examData.audioUrl} className="w-full" />
                  </div>
                )}
                <div className="flex-1 bg-white dark:bg-night-elevated border-gray-200 dark:border-night-border shadow-sm rounded-2xl p-2 md:p-4 border overflow-hidden exam-focus-card custom-scrollbar min-h-0">
                  <PdfViewer url={examData.pdfUrl} />
                </div>
              </div>
            )}

            {/* Passage Panel (nếu có) */}
            {currentQ.groupId && passageGroupsMap[currentQ.groupId] && (
              <div className={`flex-1 bg-white dark:bg-night-elevated border-gray-200 dark:border-night-border shadow-sm rounded-2xl p-6 md:p-8 mb-6 xl:mb-0 border overflow-y-auto xl:sticky xl:top-4 xl:h-[calc(100vh-140px)] exam-focus-card custom-scrollbar ${fontSize === 0 ? 'text-base' : fontSize === 1 ? 'text-lg' : 'text-xl'}`}>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-camDam">
                    {passageGroupsMap[currentQ.groupId].groupTitle || 'Đoạn đọc'}
                  </h3>
                  {onUpdatePassage && (
                    <button onClick={() => setEditingPassage(!editingPassage)} className={`p-1.5 rounded transition-colors ${editingPassage ? 'bg-cam/10 text-cam' : 'text-gray-400 hover:bg-gray-100'}`} title={editingPassage ? 'Xong' : 'Sửa đoạn đọc'}>
                      {editingPassage ? <Check size={18} /> : <Edit2 size={18} />}
                    </button>
                  )}
                </div>
                {editingPassage && onUpdatePassage ? (
                  <TipTapEditor
                    value={passageGroupsMap[currentQ.groupId].passageText}
                    onChange={(val) => onUpdatePassage(currentQ.groupId!, { passageText: val })}
                  />
                ) : (
                  <div 
                    className="prose dark:prose-invert max-w-none tiptap-content text-vutru leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(passageGroupsMap[currentQ.groupId].passageText) }}
                  />
                )}
              </div>
            )}

            {/* Question Card */}
            <div className={`exam-focus-card flex flex-col min-w-0 ${(currentQ.groupId && passageGroupsMap[currentQ.groupId]) || (examData.examType === 'ANSWER_SHEET' && examData.pdfUrl) ? 'flex-1 mb-0' : 'w-full mb-6'}`}>
            <div className={`bg-white dark:bg-night-elevated border-gray-200 dark:border-night-border shadow-sm rounded-2xl p-6 md:p-8 border ${fontSize === 0 ? 'text-base' : fontSize === 1 ? 'text-lg' : 'text-xl'}`}>

              {/* Question Header */}
              <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
                <div className="flex gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-2xl bg-cam/10 text-cam flex items-center justify-center font-bold text-lg">
                    {safeCurrentIdx + 1}
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-start justify-between gap-4">
                      {editingQuestion && onUpdateQuestion ? (
                        <div className="w-full flex-1">
                          <TipTapEditor
                            value={currentQ.content}
                            onChange={(val) => onUpdateQuestion(currentQ.id, { content: val })}
                          />
                        </div>
                      ) : (
                        <div
                          className={`prose dark:prose-invert max-w-none text-vutru tiptap-content flex-1 ${fontSize === 0 ? 'text-xl md:text-2xl' : fontSize === 1 ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'}`}
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentQ.content) }}
                        />
                      )}
                      {onUpdateQuestion && (
                        <button onClick={() => setEditingQuestion(!editingQuestion)} className={`shrink-0 p-1.5 rounded transition-colors ${editingQuestion ? 'bg-cam/10 text-cam' : 'text-gray-400 hover:bg-gray-100'}`} title={editingQuestion ? 'Xong' : 'Sửa câu hỏi'}>
                          {editingQuestion ? <Check size={18} /> : <Edit2 size={18} />}
                        </button>
                      )}
                    </div>
                    <div className="mt-3 text-xs font-bold text-gray-400 bg-gray-50 inline-block px-2 py-1 rounded">
                      {currentQ.points} Điểm
                    </div>
                  </div>
                </div>

                {/* Flag button */}
                <button
                  onClick={() => toggleFlag(currentQ.id)}
                  title={flagged.has(currentQ.id) ? 'Bỏ đánh dấu' : 'Đánh dấu câu này'}
                  className={`shrink-0 w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all
                    ${flagged.has(currentQ.id) ? 'bg-yellow-400 border-yellow-500 text-white' : 'border-gray-200 text-gray-400 hover:border-yellow-400 hover:text-yellow-500'}`}
                >
                  <Flag size={16} strokeWidth={2.5} fill={flagged.has(currentQ.id) ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Options or Essay Input */}
              <div className="space-y-3">
                {currentQ.questionType === 'ESSAY' || currentQ.questionType === 'SHORT_ANSWER' || currentQ.questionType === 'FILL_BLANK' ? (
                  <textarea
                    placeholder={currentQ.questionType === 'ESSAY' ? "Nhập câu trả lời của bạn vào đây..." : "Nhập đáp án ngắn của bạn..."}
                    className={`w-full p-5 border-2 border-gray-200 rounded-xl focus:border-cam outline-none resize-y text-lg text-vutru ${currentQ.questionType === 'ESSAY' ? 'min-h-[200px]' : 'min-h-[96px]'}`}
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleTextResponse(currentQ.id, e.target.value)}
                  />
                ) : currentQ.questionType === 'TRUE_FALSE' ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 mb-1">Với mỗi ý, chọn Đúng hoặc Sai:</p>
                    {currentQ.options.map((opt, oIndex) => {
                      const selected = getStatementAnswers(currentQ.id)[opt.id];
                      return (
                        <div
                          key={opt.id}
                          className="border-2 border-gray-100 rounded-xl p-4 bg-white"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <span className="font-extrabold text-camDam shrink-0">
                              {getStatementLabel(oIndex)})
                            </span>
                            {examData.examType !== 'ANSWER_SHEET' && (
                              <div
                                className="prose dark:prose-invert max-w-none text-vutru tiptap-content flex-1 text-sm md:text-base"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(opt.content) }}
                              />
                            )}
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleStatementAnswer(currentQ.id, opt.id, true)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all border-2 ${
                                selected === true
                                  ? 'bg-green-500 border-green-500 text-white shadow-md'
                                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-green-300 hover:bg-green-50 hover:text-green-600'
                              }`}
                            >
                              <Check size={18} strokeWidth={3} /> ĐÚNG
                            </button>
                            <button
                              onClick={() => handleStatementAnswer(currentQ.id, opt.id, false)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all border-2 ${
                                selected === false
                                  ? 'bg-red-500 border-red-500 text-white shadow-md'
                                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600'
                              }`}
                            >
                              <X size={18} strokeWidth={3} /> SAI
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  currentQ.options.map((opt, optIdx) => {
                    const isSelected = answers[currentQ.id] === opt.id;
                    const isEditing = editingOptionId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={`group flex items-start gap-4 p-4 border-2 rounded-xl transition-all
                          ${isSelected
                            ? 'border-cam bg-cam/5 shadow-sm'
                            : 'border-gray-100 hover:border-cam/30 hover:bg-gray-50 cursor-pointer'
                          }`}
                      >
                        <div onClick={() => !isEditing && handleSelectOption(currentQ.id, opt.id)} className={`w-6 h-6 md:w-7 md:h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors mt-1 ${isSelected ? 'border-cam bg-cam text-white' : 'border-gray-300 bg-white group-hover:border-cam text-gray-500'}`}>
                          <span className="font-bold text-xs md:text-sm">{String.fromCharCode(65 + optIdx)}</span>
                        </div>
                        <div className="flex-1 overflow-hidden min-w-0">
                          {isEditing && onUpdateQuestion ? (
                            <div className="w-full bg-white relative z-10" onClick={e => e.stopPropagation()}>
                              <TipTapEditor
                                value={opt.content}
                                onChange={(val) => {
                                  const newOptions = currentQ.options.map(o => o.id === opt.id ? { ...o, content: val } : o);
                                  onUpdateQuestion(currentQ.id, { options: newOptions });
                                }}
                                minHeight="60px"
                              />
                            </div>
                          ) : (
                            <div onClick={() => handleSelectOption(currentQ.id, opt.id)} className={`tiptap-content text-sm md:text-base pt-1.5 ${isSelected ? 'text-camDam font-bold' : 'text-gray-600'}`}>
                              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(opt.content) }} />
                            </div>
                          )}
                        </div>
                        {onUpdateQuestion && (
                          <button onClick={(e) => { e.stopPropagation(); setEditingOptionId(isEditing ? null : opt.id); }} className={`shrink-0 p-1.5 rounded transition-colors ${isEditing ? 'bg-cam/10 text-cam' : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-200'}`} title={isEditing ? 'Xong' : 'Sửa đáp án'}>
                            {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer navigation */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                  disabled={currentIdx === 0}
                  className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  &larr; Quay lại
                </button>
                <button
                  onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
                  disabled={currentIdx === questions.length - 1}
                  className="px-6 py-2.5 rounded-xl font-bold bg-gray-50 hover:bg-gray-100 text-gray-700 disabled:opacity-30 transition-colors"
                >
                  Tiếp theo &rarr;
                </button>
              </div>
            </div>
            </div>

          </div>
        </div>
      </div>
    </div></Portal>
  );
};

export default ExamPreviewModal;
