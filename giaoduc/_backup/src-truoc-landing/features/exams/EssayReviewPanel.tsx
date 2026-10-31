import React, { useEffect, useState, useMemo } from "react";
import { 
  Sparkles, 
  CheckCircle2, 
  User as UserIcon, 
  Clock, 
  RefreshCw, 
  Edit3, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  ThumbsUp, 
  PenLine, 
  BookOpen,
  Send,
  ExternalLink
} from "lucide-react";
import api from "../../services/api";
import { getApiErrorMessage } from "../../services/api";
import Button from "../../components/ui/Button";
import { useToast } from "../../context/ToastContext";
import AiFeedbackView, { parseAiFeedback, StructuredFeedback } from "./AiFeedbackView";

interface PendingEssay {
  answerId: string;
  resultId: string;
  studentName: string;
  studentEmail: string;
  questionContent: string;
  studentAnswer: string;
  maxPoints: number;
  aiSuggestedScore: number | null;
  aiFeedback: string | null;
  submittedAt: string;
}

const stripHtml = (html?: string | null) => (html || "").replace(/<[^>]+>/g, "").trim();

const typeBadgeClass = (type: string) => {
  const t = (type || "").toLowerCase();
  if (t.includes("chính tả")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200";
  if (t.includes("ngữ pháp")) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200";
  if (t.includes("từ vựng")) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200";
  return "bg-gray-100 text-gray-700 dark:bg-night-elevated dark:text-night-muted border-gray-200";
};

const EssayReviewCard = ({ item, onReviewed }: { item: PendingEssay; onReviewed: (answerId: string) => void }) => {
  const toast = useToast();
  const [score, setScore] = useState(item.aiSuggestedScore ?? 0);
  const [teacherNote, setTeacherNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [regrading, setRegrading] = useState(false);

  // In-place direct editing of AI feedback
  const parsed = useMemo(() => parseAiFeedback(item.aiFeedback), [item.aiFeedback]);
  const [feedbackData, setFeedbackData] = useState<StructuredFeedback>(() => parsed || {
    summary: item.aiFeedback || '',
    strengths: [],
    errors: [],
    vocabularySuggestions: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Synchronize when item changes or regrades
  useEffect(() => {
    const nextParsed = parseAiFeedback(item.aiFeedback) || {
      summary: item.aiFeedback || '',
      strengths: [],
      errors: [],
      vocabularySuggestions: []
    };
    setFeedbackData(nextParsed);
    setIsDirty(false);
    setIsEditing(false);
  }, [item.aiFeedback]);

  const handleRegrade = async () => {
    setRegrading(true);
    try {
      const res = await api.post(`/exams/answers/${item.answerId}/regrade-ai`);
      if (res.data) {
        const newScore = res.data.aiSuggestedScore ?? 0;
        setScore(newScore);
        item.aiSuggestedScore = newScore;
        item.aiFeedback = res.data.aiFeedback;
        const newParsed = parseAiFeedback(res.data.aiFeedback) || {
          summary: res.data.aiFeedback || '',
          strengths: [],
          errors: [],
          vocabularySuggestions: []
        };
        setFeedbackData(newParsed);
        setIsDirty(false);
        setIsEditing(false);
        toast.success(`AI đã chấm lại thành công: ${newScore}/${item.maxPoints}đ`);
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Không thể chấm lại câu tự luận. Hãy kiểm tra kết nối backend nhé."));
    } finally {
      setRegrading(false);
    }
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      let finalFeedback: string | undefined = undefined;
      if (isDirty || isEditing) {
        finalFeedback = JSON.stringify(feedbackData);
      } else if (teacherNote.trim()) {
        finalFeedback = teacherNote.trim();
      }
      const payload: { score: number; feedback?: string } = { score };
      if (finalFeedback) payload.feedback = finalFeedback;

      await api.patch(`/exams/answers/${item.answerId}/review`, payload);
      toast.success(`Đã duyệt & gửi điểm cho ${item.studentName}: ${score}/${item.maxPoints}đ`);
      onReviewed(item.answerId);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Không thể lưu điểm duyệt. Thử lại nhé."));
    } finally {
      setSaving(false);
    }
  };

  // Helper mutations for editing feedback
  const updateSummary = (val: string) => {
    setFeedbackData(prev => ({ ...prev, summary: val }));
    setIsDirty(true);
  };

  const updateStrength = (index: number, val: string) => {
    setFeedbackData(prev => {
      const updated = [...(prev.strengths || [])];
      updated[index] = val;
      return { ...prev, strengths: updated };
    });
    setIsDirty(true);
  };

  const addStrength = () => {
    setFeedbackData(prev => ({
      ...prev,
      strengths: [...(prev.strengths || []), ""]
    }));
    setIsDirty(true);
  };

  const removeStrength = (index: number) => {
    setFeedbackData(prev => ({
      ...prev,
      strengths: (prev.strengths || []).filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  };

  const updateError = (index: number, field: "original" | "corrected" | "type", val: string) => {
    setFeedbackData(prev => {
      const updated = [...(prev.errors || [])];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, errors: updated };
    });
    setIsDirty(true);
  };

  const addError = () => {
    setFeedbackData(prev => ({
      ...prev,
      errors: [...(prev.errors || []), { original: "", corrected: "", type: "Ngữ pháp" }]
    }));
    setIsDirty(true);
  };

  const removeError = (index: number) => {
    setFeedbackData(prev => ({
      ...prev,
      errors: (prev.errors || []).filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  };

  const updateVocab = (index: number, val: string) => {
    setFeedbackData(prev => {
      const updated = [...(prev.vocabularySuggestions || [])];
      updated[index] = val;
      return { ...prev, vocabularySuggestions: updated };
    });
    setIsDirty(true);
  };

  const addVocab = () => {
    setFeedbackData(prev => ({
      ...prev,
      vocabularySuggestions: [...(prev.vocabularySuggestions || []), ""]
    }));
    setIsDirty(true);
  };

  const removeVocab = (index: number) => {
    setFeedbackData(prev => ({
      ...prev,
      vocabularySuggestions: (prev.vocabularySuggestions || []).filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  };

  return (
    <div className="bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border rounded-2xl p-5 shadow-soft space-y-4">
      {/* Student Meta Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-bold text-vutru dark:text-night-text flex-wrap">
          <UserIcon size={16} className="text-vutruNhat dark:text-night-muted" aria-hidden="true" />
          {item.studentName}
          <span className="font-normal text-vutruNhat dark:text-night-muted">({item.studentEmail})</span>
          {item.resultId && (
            <a
              href={`/exams/results/${item.resultId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-cam hover:underline ml-2 bg-cam/10 hover:bg-cam/20 px-2 py-0.5 rounded-md transition-colors"
              title="Mở trang chi tiết toàn bộ bài thi của học sinh"
            >
              <span>Xem cả bài thi</span>
              <ExternalLink size={11} />
            </a>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-vutruNhat dark:text-night-muted">
          <Clock size={13} aria-hidden="true" />
          {new Date(item.submittedAt).toLocaleString("vi-VN")}
        </div>
      </div>

      {/* Question Prompt */}
      <div className="bg-gray-50 dark:bg-night-elevated rounded-xl p-3.5 border border-gray-100 dark:border-night-border">
        <p className="text-xs font-bold uppercase tracking-wide text-vutruNhat dark:text-night-muted mb-1">Đề bài</p>
        <p className="text-sm text-vutru dark:text-night-text leading-relaxed">{stripHtml(item.questionContent)}</p>
      </div>

      {/* Student Essay Answer */}
      <div className="bg-gray-50 dark:bg-night-elevated rounded-xl p-3.5 border border-gray-100 dark:border-night-border">
        <p className="text-xs font-bold uppercase tracking-wide text-vutruNhat dark:text-night-muted mb-1">Bài làm của học sinh</p>
        <p className="text-sm text-vutru dark:text-night-text leading-relaxed whitespace-pre-wrap">{item.studentAnswer || "(không có nội dung)"}</p>
      </div>

      {/* AI Feedback & In-Place Direct Editor Section */}
      <div className="bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 dark:from-amber-950/20 dark:via-night-surface dark:to-orange-950/10 rounded-2xl p-4 border border-cam/25 text-vutru dark:text-night-text space-y-3.5">
        {/* Banner Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-cam/15">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-camDam dark:text-cam flex items-center gap-1.5">
              <Sparkles size={14} aria-hidden="true" /> AI chấm nháp — {item.aiSuggestedScore ?? 0}/{item.maxPoints} điểm
            </p>
            {isDirty && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                Đã chỉnh sửa bởi GV
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors shadow-xs ${
                isEditing
                  ? "bg-cam text-white border-cam hover:bg-camDam"
                  : "bg-white dark:bg-night-elevated border-gray-200 dark:border-night-border text-vutru dark:text-night-text hover:border-cam/50"
              }`}
            >
              <Edit3 size={13} />
              {isEditing ? "Đang sửa trực tiếp" : "Sửa trực tiếp nhận xét"}
            </button>

            <button
              type="button"
              onClick={handleRegrade}
              disabled={regrading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated text-vutru dark:text-night-text hover:border-cam/50 transition-colors shadow-xs"
              title="Yêu cầu AI đánh giá lại câu trả lời này"
            >
              <RefreshCw size={13} className={regrading ? "animate-spin text-cam" : ""} />
              {regrading ? "Đang chấm lại..." : "Chấm lại bằng AI"}
            </button>
          </div>
        </div>

        {/* VIEW MODE: Structured, Beautiful Cards */}
        {!isEditing ? (
          <div className="space-y-3.5">
            {/* 1. Summary Card */}
            {feedbackData.summary && (
              <div className="bg-white/80 dark:bg-night-elevated/70 p-3.5 rounded-xl border border-gray-100 dark:border-night-border">
                <p className="text-xs sm:text-sm leading-relaxed text-vutru dark:text-night-text">
                  {feedbackData.summary}
                </p>
              </div>
            )}

            {/* 2. Strengths Section */}
            {feedbackData.strengths && feedbackData.strengths.length > 0 && (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                  <ThumbsUp size={13} aria-hidden="true" /> Điểm mạnh đạt được
                </p>
                <div className="space-y-1.5">
                  {feedbackData.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-emerald-900 dark:text-emerald-300">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Errors Section */}
            {feedbackData.errors && feedbackData.errors.length > 0 ? (
              <div className="bg-rose-50/40 dark:bg-rose-950/20 p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/30">
                <p className="text-[11px] font-bold uppercase tracking-wide text-rose-800 dark:text-rose-400 flex items-center gap-1.5 mb-2">
                  <PenLine size={13} aria-hidden="true" /> Lỗi cần sửa ({feedbackData.errors.length})
                </p>
                <div className="space-y-2">
                  {feedbackData.errors.map((e, i) => (
                    <div key={i} className="text-xs sm:text-sm bg-white dark:bg-night-surface rounded-lg px-3 py-2 border border-rose-200/60 dark:border-rose-800/40 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${typeBadgeClass(e.type)}`}>
                          {e.type}
                        </span>
                        <span className="line-through text-rose-600 dark:text-rose-400 font-medium">
                          {e.original}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {e.corrected}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 px-3 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Không phát hiện lỗi ngữ pháp hay từ vựng cơ bản.</span>
              </div>
            )}

            {/* 4. Vocabulary Suggestions */}
            {feedbackData.vocabularySuggestions && feedbackData.vocabularySuggestions.length > 0 && (
              <div className="bg-indigo-50/40 dark:bg-indigo-950/20 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5 mb-2">
                  <BookOpen size={13} aria-hidden="true" /> Từ vựng & Cách diễn đạt nâng cao hơn
                </p>
                <div className="space-y-1.5">
                  {feedbackData.vocabularySuggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-indigo-950 dark:text-indigo-200">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* EDIT MODE: Interactive Form for Teacher */
          <div className="space-y-4 pt-1 animate-fade-in">
            {/* Edit Summary */}
            <div>
              <label className="block text-xs font-bold text-vutru dark:text-night-text mb-1">
                Nhận xét tổng quan của giáo viên:
              </label>
              <textarea
                value={feedbackData.summary || ""}
                onChange={e => updateSummary(e.target.value)}
                rows={3}
                placeholder="Nhập nhận xét tổng quan..."
                className="w-full px-3 py-2 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-xs text-vutru dark:text-night-text focus:outline-none focus:border-cam"
              />
            </div>

            {/* Edit Strengths */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <ThumbsUp size={12} /> Các điểm mạnh:
                </label>
                <button
                  type="button"
                  onClick={addStrength}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Plus size={13} /> Thêm điểm mạnh
                </button>
              </div>
              {(feedbackData.strengths || []).map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={s}
                    onChange={e => updateStrength(i, e.target.value)}
                    placeholder="VD: Dùng từ vựng phong phú, bố cục rõ ràng..."
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-lg text-xs text-vutru dark:text-night-text focus:outline-none focus:border-cam"
                  />
                  <button
                    type="button"
                    onClick={() => removeStrength(i)}
                    className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                    title="Xóa ý này"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Edit Errors */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-rose-800 dark:text-rose-400 flex items-center gap-1.5">
                  <PenLine size={12} /> Danh sách lỗi phát hiện:
                </label>
                <button
                  type="button"
                  onClick={addError}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Plus size={13} /> Thêm lỗi
                </button>
              </div>
              {(feedbackData.errors || []).map((err, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 bg-white dark:bg-night-elevated rounded-xl border border-gray-200 dark:border-night-border items-center">
                  <div className="sm:col-span-3">
                    <select
                      value={err.type}
                      onChange={e => updateError(i, "type", e.target.value)}
                      className="w-full px-2 py-1 bg-gray-50 dark:bg-night-surface border border-gray-200 dark:border-night-border rounded-md text-[11px] font-bold"
                    >
                      <option value="Chính tả">Chính tả</option>
                      <option value="Ngữ pháp">Ngữ pháp</option>
                      <option value="Từ vựng">Từ vựng</option>
                      <option value="Nội dung">Nội dung</option>
                    </select>
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={err.original}
                      onChange={e => updateError(i, "original", e.target.value)}
                      placeholder="Chỗ sai nguyên văn"
                      className="w-full px-2 py-1 bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border rounded-md text-xs line-through text-rose-600"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={err.corrected}
                      onChange={e => updateError(i, "corrected", e.target.value)}
                      placeholder="Sửa lại đúng"
                      className="w-full px-2 py-1 bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border rounded-md text-xs font-bold text-emerald-700"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeError(i)}
                      className="p-1 text-gray-400 hover:text-rose-500 transition-colors"
                      title="Xóa lỗi này"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Vocabulary Suggestions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                  <BookOpen size={12} /> Gợi ý từ vựng nâng cao:
                </label>
                <button
                  type="button"
                  onClick={addVocab}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus size={13} /> Thêm gợi ý từ vựng
                </button>
              </div>
              {(feedbackData.vocabularySuggestions || []).map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={v}
                    onChange={e => updateVocab(i, e.target.value)}
                    placeholder="VD: good → outstanding (nâng cấp phong phú)"
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-lg text-xs text-vutru dark:text-night-text focus:outline-none focus:border-cam"
                  />
                  <button
                    type="button"
                    onClick={() => removeVocab(i)}
                    className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                    title="Xóa gợi ý này"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Action Buttons for Edit Mode */}
            <div className="flex justify-end gap-2 pt-2 border-t border-cam/20">
              <button
                type="button"
                onClick={() => {
                  setFeedbackData(parsed || { summary: item.aiFeedback || '', strengths: [], errors: [], vocabularySuggestions: [] });
                  setIsEditing(false);
                }}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-night-border text-xs font-bold hover:bg-gray-100 dark:hover:bg-night-elevated transition-colors"
              >
                Hủy thay đổi
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setIsDirty(true);
                  toast.info("Đã cập nhật nhận xét tạm thời. Hãy bấm 'Duyệt điểm' để chốt nhé!");
                }}
                className="btn btn-chinh text-xs px-4 py-1.5"
              >
                <Check size={13} className="mr-1" /> Hoàn tất chỉnh sửa
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scoring and Final Approval Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end pt-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-vutruNhat dark:text-night-muted" htmlFor={`score-${item.answerId}`}>
            Điểm chính thức (tối đa {item.maxPoints})
          </label>
          <input
            id={`score-${item.answerId}`}
            type="number"
            min={0}
            max={item.maxPoints}
            step={0.25}
            value={score}
            onChange={(e) => setScore(Math.max(0, Math.min(item.maxPoints, Number(e.target.value))))}
            className="w-32 px-3 py-2 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated text-vutru dark:text-night-text font-bold focus:outline-none focus:ring-2 focus:ring-cam/50"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1 w-full">
          <label className="text-xs font-bold text-vutruNhat dark:text-night-muted" htmlFor={`feedback-${item.answerId}`}>
            Ghi chú riêng cho học sinh (tuỳ chọn — để trống sẽ giữ nguyên nhận xét có cấu trúc ở trên)
          </label>
          <textarea
            id={`feedback-${item.answerId}`}
            value={teacherNote}
            onChange={(e) => setTeacherNote(e.target.value)}
            rows={2}
            placeholder="Ví dụ: cô đã xem qua, đồng ý với nhận xét của AI..."
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated text-vutru dark:text-night-text text-sm focus:outline-none focus:ring-2 focus:ring-cam/50 resize-none placeholder:text-gray-400 dark:placeholder:text-night-muted"
          />
        </div>
        <Button onClick={handleApprove} isLoading={saving} variant="primary" size="md" className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
          <Send size={15} aria-hidden="true" /> Duyệt & Gửi điểm
        </Button>
      </div>
    </div>
  );
};

const EssayReviewPanel = ({ examId }: { examId: string }) => {
  const [items, setItems] = useState<PendingEssay[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [batchRegrading, setBatchRegrading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const toast = useToast();

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/exams/${examId}/pending-essay-reviews`);
      setItems(res.data);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Không tải được danh sách bài chờ duyệt."));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const handleReviewed = (answerId: string) => {
    setItems((prev) => (prev ? prev.filter((i) => i.answerId !== answerId) : prev));
  };

  const handleBatchRegradeAll = async () => {
    if (!items || items.length === 0) return;
    setBatchRegrading(true);
    setBatchProgress({ current: 0, total: items.length });

    try {
      // Try backend batch endpoint first
      try {
        const res = await api.post(`/exams/${examId}/regrade-all-essays`);
        if (res.data) {
          toast.success(res.data.message || 'Đã hoàn tất chấm lại bằng AI cho toàn bộ câu tự luận!');
          await fetchPending();
          return;
        }
      } catch {
        // Fallback to sequential calls
      }

      let successCount = 0;
      for (let i = 0; i < items.length; i++) {
        setBatchProgress({ current: i + 1, total: items.length });
        try {
          await api.post(`/exams/answers/${items[i].answerId}/regrade-ai`);
          successCount++;
        } catch {
          // continue
        }
      }
      toast.success(`Đã chấm lại thành công ${successCount}/${items.length} câu tự luận!`);
      await fetchPending();
    } catch {
      toast.error('Lỗi khi chấm lại hàng loạt. Vui lòng thử lại.');
    } finally {
      setBatchRegrading(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  if (loading) {
    return <p className="text-sm text-vutruNhat dark:text-night-muted py-8 text-center">Đang tải danh sách bài chờ duyệt...</p>;
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40 rounded-2xl p-8 text-center">
        <CheckCircle2 className="mx-auto mb-2 text-green-600 dark:text-green-400" size={28} aria-hidden="true" />
        <p className="font-bold text-green-700 dark:text-green-400">Không còn bài tự luận nào chờ duyệt</p>
        <p className="text-green-700/70 dark:text-green-400/70 text-sm mt-1">Mọi câu AI chấm nháp đã được giáo viên xác nhận điểm.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-cam/5 dark:bg-cam/10 border border-cam/20 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-camDam dark:text-cam font-bold">
          <Sparkles size={15} aria-hidden="true" />
          <span><b>{items.length}</b> câu tự luận đang chờ duyệt điểm.</span>
        </div>
        <button
          type="button"
          onClick={handleBatchRegradeAll}
          disabled={batchRegrading}
          className="btn btn-chinh text-xs px-3.5 py-1.5 flex items-center gap-1.5 shadow-xs shrink-0"
          title="Yêu cầu AI chấm lại toàn bộ danh sách câu hỏi này"
        >
          <RefreshCw size={13} className={batchRegrading ? 'animate-spin' : ''} />
          <span>
            {batchRegrading
              ? `Đang chấm lại (${batchProgress.current}/${batchProgress.total})...`
              : '⚡ Chấm lại toàn bộ bằng AI'}
          </span>
        </button>
      </div>
      {items.map((item) => (
        <EssayReviewCard key={item.answerId} item={item} onReviewed={handleReviewed} />
      ))}
    </div>
  );
};

export default EssayReviewPanel;
