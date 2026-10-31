import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Save, 
  Trash2, 
  Plus, 
  Edit2, 
  X, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Layers,
  PenTool,
  ThumbsUp
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { 
  WritingGradingResult, 
  GradingErrorItem, 
  GradingStrengthItem, 
  GradingImprovementItem,
  UpdateAssessmentRequest 
} from '../../../services/aiGradingApi';

import Portal from '../../../components/ui/Portal';
interface Props {
  initialResult: WritingGradingResult;
  maxScore: number;
  initialFinalScore?: number;
  onSave: (payload: UpdateAssessmentRequest) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export const TeacherGradingEditor: React.FC<Props> = ({
  initialResult,
  maxScore,
  initialFinalScore,
  onSave,
  onCancel,
  isSaving
}) => {
  // Deep copy initialResult to mutable state
  const [result, setResult] = useState<WritingGradingResult>(() => JSON.parse(JSON.stringify(initialResult)));
  
  // Final score on assignment scale (0 - maxScore)
  const defaultFinalScore = initialFinalScore ?? (result.overall?.score ? (result.overall.score / 10.0) * maxScore : 0);
  const [finalScore, setFinalScore] = useState<number>(Math.round(defaultFinalScore * 10) / 10);
  const [teacherAuditNote, setTeacherAuditNote] = useState<string>('');

  // Editing state for Errors modal / form
  const [editingErrorIndex, setEditingErrorIndex] = useState<number | null>(null);
  const [errorForm, setErrorForm] = useState<GradingErrorItem>({
    original: '',
    correction: '',
    explanation: '',
    category: 'grammar',
    severity: 'minor'
  });
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);

  // New item states
  const [newStrengthDesc, setNewStrengthDesc] = useState('');
  const [newStrengthEvidence, setNewStrengthEvidence] = useState('');
  const [showAddStrength, setShowAddStrength] = useState(false);

  const [newImpDesc, setNewImpDesc] = useState('');
  const [newImpAction, setNewImpAction] = useState('');
  const [newImpPriority, setNewImpPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [showAddImp, setShowAddImp] = useState(false);

  // Calculate overall score automatically when criteria change
  const recalculateOverall = (updatedCriteria: WritingGradingResult['criteria']) => {
    if (!updatedCriteria) return;
    const s1 = updatedCriteria.taskAchievement?.score ?? 0;
    const s2 = updatedCriteria.coherenceAndCohesion?.score ?? 0;
    const s3 = updatedCriteria.lexicalResource?.score ?? 0;
    const s4 = updatedCriteria.grammaticalRangeAndAccuracy?.score ?? 0;
    const avg = Math.round(((s1 + s2 + s3 + s4) / 4.0) * 10) / 10;
    
    setResult((prev) => ({
      ...prev,
      overall: {
        score: avg,
        maxScore: 10,
        percentage: Math.round(avg * 10 * 10) / 10
      },
      criteria: updatedCriteria
    }));

    // Cập nhật điểm thang điểm assignment theo tỉ lệ
    setFinalScore(Math.round(((avg / 10.0) * maxScore) * 10) / 10);
  };

  const handleCriterionScoreChange = (key: keyof NonNullable<WritingGradingResult['criteria']>, newScoreStr: string) => {
    const val = Math.max(0, Math.min(10, Number(newScoreStr) || 0));
    const updatedCriteria = {
      ...result.criteria,
      [key]: {
        ...result.criteria?.[key],
        score: val
      }
    };
    recalculateOverall(updatedCriteria);
  };

  const handleCriterionFeedbackChange = (key: keyof NonNullable<WritingGradingResult['criteria']>, newFeedback: string) => {
    setResult((prev) => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [key]: {
          ...prev.criteria?.[key],
          feedback: newFeedback
        }
      }
    }));
  };

  // Error handlers
  const handleOpenAddError = () => {
    setEditingErrorIndex(null);
    setErrorForm({
      id: `err-${Date.now()}`,
      category: 'grammar',
      severity: 'minor',
      original: '',
      correction: '',
      explanation: ''
    });
    setShowErrorModal(true);
  };

  const handleOpenEditError = (index: number) => {
    const item = result.errors?.[index];
    if (!item) return;
    setEditingErrorIndex(index);
    setErrorForm({ ...item });
    setShowErrorModal(true);
  };

  const handleSaveError = () => {
    if (!errorForm.original.trim() || !errorForm.correction.trim()) return;

    setResult((prev) => {
      const list = [...(prev.errors || [])];
      if (editingErrorIndex !== null) {
        list[editingErrorIndex] = { ...errorForm };
      } else {
        list.push({ ...errorForm, id: `err-${Date.now()}` });
      }
      return { ...prev, errors: list };
    });
    setShowErrorModal(false);
  };

  const handleDeleteError = (index: number) => {
    setResult((prev) => ({
      ...prev,
      errors: prev.errors?.filter((_, i) => i !== index) || []
    }));
  };

  // Strength handlers
  const handleAddStrength = () => {
    if (!newStrengthDesc.trim()) return;
    setResult((prev) => ({
      ...prev,
      strengths: [
        ...(prev.strengths || []),
        {
          description: newStrengthDesc.trim(),
          evidence: newStrengthEvidence.trim() || undefined,
          category: 'task'
        }
      ]
    }));
    setNewStrengthDesc('');
    setNewStrengthEvidence('');
    setShowAddStrength(false);
  };

  const handleDeleteStrength = (index: number) => {
    setResult((prev) => ({
      ...prev,
      strengths: prev.strengths?.filter((_, i) => i !== index) || []
    }));
  };

  // Improvement handlers
  const handleAddImprovement = () => {
    if (!newImpDesc.trim()) return;
    setResult((prev) => ({
      ...prev,
      improvements: [
        ...(prev.improvements || []),
        {
          description: newImpDesc.trim(),
          action: newImpAction.trim() || undefined,
          priority: newImpPriority,
          category: 'grammar'
        }
      ]
    }));
    setNewImpDesc('');
    setNewImpAction('');
    setShowAddImp(false);
  };

  const handleDeleteImprovement = (index: number) => {
    setResult((prev) => ({
      ...prev,
      improvements: prev.improvements?.filter((_, i) => i !== index) || []
    }));
  };

  const handleFinalSubmit = (publishToStudent: boolean) => {
    onSave({
      result,
      finalScore: Number(finalScore),
      note: teacherAuditNote.trim() || undefined,
      publishToStudent
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-vutru dark:text-night-text">
      {/* Header Banner */}
      <div className="bg-cam/10 dark:bg-cam/15 border border-cam/30 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-camDam dark:text-cam">
          <Edit2 size={18} />
          <span>Chế độ Chỉnh sửa Đánh giá của Giáo viên</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-night-border text-xs font-bold hover:bg-gray-100 dark:hover:bg-night-elevated"
          >
            Hủy bỏ
          </button>
          <Button
            onClick={() => handleFinalSubmit(false)}
            isLoading={isSaving}
            variant="secondary"
            size="sm"
          >
            <Save size={14} className="mr-1" /> Lưu Bản Nháp
          </Button>
          <Button
            onClick={() => handleFinalSubmit(true)}
            isLoading={isSaving}
            variant="primary"
            size="sm"
          >
            <CheckCircle2 size={14} className="mr-1" /> Duyệt & Chốt Điểm
          </Button>
        </div>
      </div>

      {/* Điểm Chốt & Ghi chú */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-night-surface p-5 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
        <div className="md:col-span-1 space-y-1">
          <label className="text-xs font-bold text-vutruNhat dark:text-night-muted">
            Điểm Chốt Chính Thức (Tối đa {maxScore})
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={maxScore}
              step={0.25}
              value={finalScore}
              onChange={(e) => setFinalScore(Math.max(0, Math.min(maxScore, Number(e.target.value))))}
              className="w-full text-2xl font-black text-camDam dark:text-cam p-2.5 rounded-xl border-2 border-cam/40 focus:border-cam bg-white dark:bg-night-elevated outline-none"
            />
            <span className="text-sm font-bold text-vutruNhat dark:text-night-muted">/{maxScore}</span>
          </div>
          <p className="text-[11px] text-vutruNhat dark:text-night-muted">
            Tương đương {((finalScore / maxScore) * 10).toFixed(1)}/10đ thang chuẩn
          </p>
        </div>

        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-bold text-vutruNhat dark:text-night-muted">
            Ghi Chú Kiểm Tra / Lý Do Thay Đổi (Lưu lịch sử Audit)
          </label>
          <input
            type="text"
            value={teacherAuditNote}
            onChange={(e) => setTeacherAuditNote(e.target.value)}
            placeholder="Ví dụ: Đã xem xét lại lỗi chia thì, cộng thêm 0.5 điểm..."
            className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated text-sm outline-none focus:border-cam"
          />
        </div>
      </div>

      {/* 4 Tiêu Chí Rubric (Chỉnh sửa điểm và feedback) */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted flex items-center gap-1.5">
          <Layers size={14} className="text-cam" />
          Chỉnh sửa Điểm & Nhận Xét 4 Tiêu Chí
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Task Achievement */}
          <CriterionEditorCard
            title="1. Task Achievement / Response"
            score={result.criteria?.taskAchievement?.score ?? 0}
            feedback={result.criteria?.taskAchievement?.feedback ?? ''}
            onScoreChange={(s) => handleCriterionScoreChange('taskAchievement', s)}
            onFeedbackChange={(fb) => handleCriterionFeedbackChange('taskAchievement', fb)}
          />

          {/* Coherence & Cohesion */}
          <CriterionEditorCard
            title="2. Coherence & Cohesion"
            score={result.criteria?.coherenceAndCohesion?.score ?? 0}
            feedback={result.criteria?.coherenceAndCohesion?.feedback ?? ''}
            onScoreChange={(s) => handleCriterionScoreChange('coherenceAndCohesion', s)}
            onFeedbackChange={(fb) => handleCriterionFeedbackChange('coherenceAndCohesion', fb)}
          />

          {/* Lexical Resource */}
          <CriterionEditorCard
            title="3. Lexical Resource"
            score={result.criteria?.lexicalResource?.score ?? 0}
            feedback={result.criteria?.lexicalResource?.feedback ?? ''}
            onScoreChange={(s) => handleCriterionScoreChange('lexicalResource', s)}
            onFeedbackChange={(fb) => handleCriterionFeedbackChange('lexicalResource', fb)}
          />

          {/* Grammatical Range & Accuracy */}
          <CriterionEditorCard
            title="4. Grammatical Range & Accuracy"
            score={result.criteria?.grammaticalRangeAndAccuracy?.score ?? 0}
            feedback={result.criteria?.grammaticalRangeAndAccuracy?.feedback ?? ''}
            onScoreChange={(s) => handleCriterionScoreChange('grammaticalRangeAndAccuracy', s)}
            onFeedbackChange={(fb) => handleCriterionFeedbackChange('grammaticalRangeAndAccuracy', fb)}
          />
        </div>
      </div>

      {/* Chỉnh sửa Lỗi (Errors List) */}
      <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border p-5 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <PenTool size={14} />
            Danh Sách Lỗi Cụ Thể ({result.errors?.length || 0})
          </h4>
          <button
            onClick={handleOpenAddError}
            className="text-xs font-bold text-camDam dark:text-cam hover:underline flex items-center gap-1"
          >
            <Plus size={14} /> Thêm lỗi mới
          </button>
        </div>

        {(!result.errors || result.errors.length === 0) ? (
          <p className="text-xs text-vutruNhat dark:text-night-muted italic py-3 text-center">
            Chưa có lỗi nào trong danh sách. Bấm "Thêm lỗi mới" nếu bạn phát hiện sai sót.
          </p>
        ) : (
          <div className="space-y-2.5">
            {result.errors.map((err, idx) => (
              <div 
                key={err.id || idx}
                className="p-3 rounded-xl border border-gray-100 dark:border-night-border bg-gray-50/80 dark:bg-night-elevated flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700 dark:text-night-text bg-white dark:bg-night-surface px-2 py-0.5 rounded border border-gray-200 dark:border-night-border text-[10px] uppercase">
                      {err.category}
                    </span>
                    <span className="font-mono line-through text-rose-600 dark:text-rose-400">
                      {err.original}
                    </span>
                    <span>→</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {err.correction}
                    </span>
                  </div>
                  <p className="text-vutruNhat dark:text-night-muted">
                    {err.explanation}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEditError(idx)}
                    className="p-1.5 text-vutruNhat hover:text-cam rounded-lg hover:bg-white dark:hover:bg-night-surface"
                    title="Chỉnh sửa lỗi"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteError(idx)}
                    className="p-1.5 text-vutruNhat hover:text-rose-500 rounded-lg hover:bg-white dark:hover:bg-night-surface"
                    title="Xóa lỗi"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chỉnh sửa Điểm Mạnh & Cải Thiện */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <ThumbsUp size={14} /> Điểm Mạnh ({result.strengths?.length || 0})
            </h4>
            <button
              onClick={() => setShowAddStrength(true)}
              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
            >
              <Plus size={13} /> Thêm
            </button>
          </div>

          {showAddStrength && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-2 text-xs">
              <input
                type="text"
                placeholder="Mô tả điểm mạnh..."
                value={newStrengthDesc}
                onChange={(e) => setNewStrengthDesc(e.target.value)}
                className="w-full p-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-night-surface outline-none"
              />
              <input
                type="text"
                placeholder="Dẫn chứng từ bài viết (tuỳ chọn)..."
                value={newStrengthEvidence}
                onChange={(e) => setNewStrengthEvidence(e.target.value)}
                className="w-full p-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-night-surface outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddStrength(false)}
                  className="px-2.5 py-1 text-xs rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddStrength}
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                >
                  Lưu
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {result.strengths?.map((s, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-night-elevated text-xs">
                <div className="space-y-0.5">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">✓ {s.description}</p>
                  {s.evidence && <p className="text-[11px] text-vutruNhat italic">Dẫn chứng: "{s.evidence}"</p>}
                </div>
                <button onClick={() => handleDeleteStrength(idx)} className="text-gray-400 hover:text-rose-500 p-1">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Improvements */}
        <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <TrendingUp size={14} /> Gợi Ý Cải Thiện ({result.improvements?.length || 0})
            </h4>
            <button
              onClick={() => setShowAddImp(true)}
              className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
            >
              <Plus size={13} /> Thêm
            </button>
          </div>

          {showAddImp && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 space-y-2 text-xs">
              <input
                type="text"
                placeholder="Điều cần cải thiện..."
                value={newImpDesc}
                onChange={(e) => setNewImpDesc(e.target.value)}
                className="w-full p-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-night-surface outline-none"
              />
              <input
                type="text"
                placeholder="Hành động gợi ý..."
                value={newImpAction}
                onChange={(e) => setNewImpAction(e.target.value)}
                className="w-full p-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-night-surface outline-none"
              />
              <div className="flex items-center justify-between">
                <select
                  value={newImpPriority}
                  onChange={(e) => setNewImpPriority(e.target.value as any)}
                  className="p-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-night-surface"
                >
                  <option value="high">Ưu tiên cao</option>
                  <option value="medium">Trung bình</option>
                  <option value="low">Thấp</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddImp(false)} className="px-2.5 py-1 text-xs">Hủy</button>
                  <button onClick={handleAddImprovement} className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold">Lưu</button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {result.improvements?.map((imp, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-night-elevated text-xs">
                <div className="space-y-0.5">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">! {imp.description}</p>
                  {imp.action && <p className="text-[11px] text-vutruNhat">Hành động: {imp.action}</p>}
                </div>
                <button onClick={() => handleDeleteImprovement(idx)} className="text-gray-400 hover:text-rose-500 p-1">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nhận xét học sinh & Tóm tắt giáo viên */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-night-surface p-5 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
        <div className="space-y-2">
          <label className="text-xs font-bold text-vutruNhat dark:text-night-muted">
            Lời Động Viên & Hướng Dẫn Gửi Cho Học Sinh
          </label>
          <textarea
            rows={3}
            value={result.studentFeedback?.positive || ''}
            onChange={(e) => setResult((prev) => ({
              ...prev,
              studentFeedback: { ...prev.studentFeedback, positive: e.target.value }
            }))}
            className="w-full p-2.5 text-xs rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated outline-none focus:border-cam resize-none"
            placeholder="Khen ngợi nỗ lực của học sinh..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-vutruNhat dark:text-night-muted">
            Tóm Tắt Nhanh Cho Giáo Viên (Teacher Overview)
          </label>
          <textarea
            rows={3}
            value={result.teacherSummary?.overallComment || ''}
            onChange={(e) => setResult((prev) => ({
              ...prev,
              teacherSummary: { ...prev.teacherSummary, overallComment: e.target.value }
            }))}
            className="w-full p-2.5 text-xs rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated outline-none focus:border-cam resize-none"
            placeholder="Nhận định tổng quan bài làm..."
          />
        </div>
      </div>

      {/* Error Edit / Add Modal */}
      {showErrorModal && (
        <Portal><div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-200 dark:border-night-border p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-night-border">
              <h3 className="font-bold text-base text-vutru dark:text-night-text">
                {editingErrorIndex !== null ? 'Chỉnh Sửa Lỗi' : 'Thêm Lỗi Mới'}
              </h3>
              <button onClick={() => setShowErrorModal(false)} className="text-vutruNhat hover:text-vutru">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Chỗ sai trong bài học sinh (Original) *</label>
                <input
                  type="text"
                  required
                  value={errorForm.original}
                  onChange={(e) => setErrorForm({ ...errorForm, original: e.target.value })}
                  placeholder="Ví dụ: He go to school"
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated font-mono"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Cách sửa đúng (Correction) *</label>
                <input
                  type="text"
                  required
                  value={errorForm.correction}
                  onChange={(e) => setErrorForm({ ...errorForm, correction: e.target.value })}
                  placeholder="Ví dụ: He went to school"
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated font-mono font-bold text-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Phân loại</label>
                  <select
                    value={errorForm.category}
                    onChange={(e) => setErrorForm({ ...errorForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated"
                  >
                    <option value="grammar">Ngữ pháp (Grammar)</option>
                    <option value="vocabulary">Từ vựng (Vocabulary)</option>
                    <option value="spelling">Chính tả (Spelling)</option>
                    <option value="punctuation">Dấu câu (Punctuation)</option>
                    <option value="coherence">Mạch lạc (Coherence)</option>
                    <option value="task">Đề bài (Task)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Mức độ</label>
                  <select
                    value={errorForm.severity}
                    onChange={(e) => setErrorForm({ ...errorForm, severity: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated"
                  >
                    <option value="minor">Lỗi nhỏ (Minor)</option>
                    <option value="major">Lỗi lớn (Major)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Giải thích vì sao sai</label>
                <textarea
                  rows={2}
                  value={errorForm.explanation}
                  onChange={(e) => setErrorForm({ ...errorForm, explanation: e.target.value })}
                  placeholder="Quy tắc ngữ pháp hoặc lý do..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-night-border">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-night-elevated"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveError}
                className="btn btn-chinh px-5 py-2 text-xs"
              >
                Lưu Lỗi
              </button>
            </div>
          </div>
        </div></Portal>
      )}
    </div>
  );
};

interface CriterionEditorCardProps {
  title: string;
  score: number;
  feedback: string;
  onScoreChange: (score: string) => void;
  onFeedbackChange: (feedback: string) => void;
}

const CriterionEditorCard: React.FC<CriterionEditorCardProps> = ({
  title,
  score,
  feedback,
  onScoreChange,
  onFeedbackChange
}) => {
  return (
    <div className="p-4 rounded-2xl border border-gray-100 dark:border-night-border bg-white dark:bg-night-surface shadow-soft space-y-2.5">
      <div className="flex items-center justify-between">
        <h5 className="font-bold text-xs text-vutru dark:text-night-text">{title}</h5>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={score}
            onChange={(e) => onScoreChange(e.target.value)}
            className="w-16 p-1 text-center font-bold text-sm rounded-lg border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated text-cam"
          />
          <span className="text-xs text-vutruNhat">/10</span>
        </div>
      </div>

      <textarea
        rows={2}
        value={feedback}
        onChange={(e) => onFeedbackChange(e.target.value)}
        placeholder="Nhận xét cụ thể cho tiêu chí này..."
        className="w-full p-2 text-xs rounded-xl border border-gray-200 dark:border-night-border bg-gray-50/50 dark:bg-night-elevated resize-none outline-none focus:border-cam"
      />
    </div>
  );
};

export default TeacherGradingEditor;
