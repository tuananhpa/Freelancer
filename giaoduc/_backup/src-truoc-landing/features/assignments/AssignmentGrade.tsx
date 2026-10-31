import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { assignmentApi, Assignment, AssignmentSubmission } from '../../services/assignmentApi';
import { 
  aiGradingApi, 
  WritingAssessmentResponse, 
  UpdateAssessmentRequest 
} from '../../services/aiGradingApi';
import { useToast } from '../../context/ToastContext';
import { 
  Paperclip, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Edit3, 
  FileText, 
  Eye, 
  CheckSquare, 
  Square,
  AlertTriangle,
  Clock,
  BookOpen
} from 'lucide-react';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import BackButton from '../../components/ui/BackButton';
import Button from '../../components/ui/Button';
import { formatScore } from '../../utils/formatUtils';
import WritingAssessmentViewer from './components/WritingAssessmentViewer';
import TeacherGradingEditor from './components/TeacherGradingEditor';
import BatchGradingModal from './components/BatchGradingModal';

import Portal from '../../components/ui/Portal';
export const AssignmentGrade: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Submission
  const [selectedSub, setSelectedSub] = useState<AssignmentSubmission | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'assessment'>('assessment');
  const [isEditMode, setIsEditMode] = useState(false);

  // Current Writing Assessment
  const [currentAssessment, setCurrentAssessment] = useState<WritingAssessmentResponse | null>(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [aiGradingSubmitting, setAiGradingSubmitting] = useState(false);

  // Batch Grading State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  // Re-grade confirmation modal
  const [regradeConfirmOpen, setRegradeConfirmOpen] = useState(false);

  // Traditional manual grade form fallback
  const [manualScore, setManualScore] = useState<number | ''>('');
  const [manualFeedback, setManualFeedback] = useState('');
  const [manualGrading, setManualGrading] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const assignData = await assignmentApi.getAssignmentById(id!);
      setAssignment(assignData);

      const subData = await assignmentApi.getSubmissions(id!, 0, 100);
      setSubmissions(subData.content);
    } catch (err) {
      toast.error('Lỗi khi tải thông tin bài tập');
    } finally {
      setLoading(false);
    }
  };

  // Load assessment whenever selectedSub changes
  useEffect(() => {
    if (selectedSub) {
      setManualScore(selectedSub.score ?? '');
      setManualFeedback(selectedSub.feedback || '');
      setIsEditMode(false);
      loadAssessment(selectedSub.id);
    } else {
      setCurrentAssessment(null);
    }
  }, [selectedSub]);

  const loadAssessment = async (submissionId: string) => {
    try {
      setLoadingAssessment(true);
      const res = await aiGradingApi.getAssessment(submissionId);
      if (res.data) {
        setCurrentAssessment(res.data);
        if (res.data.status === 'COMPLETED' || res.data.status === 'TEACHER_EDITED') {
          setActiveTab('assessment');
        } else {
          setActiveTab('content');
        }
      }
    } catch (e) {
      console.error('Không tải được đánh giá AI:', e);
      setCurrentAssessment(null);
      setActiveTab('content');
    } finally {
      setLoadingAssessment(false);
    }
  };

  // Single AI Grade trigger
  const handleTriggerAiGrade = async () => {
    if (!selectedSub) return;
    try {
      setAiGradingSubmitting(true);
      const res = await aiGradingApi.gradeSubmission(selectedSub.id);
      if (res.data) {
        setCurrentAssessment(res.data);
        setActiveTab('assessment');
        toast.success('AI đã hoàn tất đánh giá bài viết!');
        loadData();
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể hoàn tất chấm AI. Thử lại sau nhé.');
      loadAssessment(selectedSub.id);
    } finally {
      setAiGradingSubmitting(false);
    }
  };

  // Re-grade with AI
  const handleRegradeConfirm = async () => {
    if (!selectedSub) return;
    setRegradeConfirmOpen(false);
    try {
      setAiGradingSubmitting(true);
      const res = await aiGradingApi.regradeSubmission(selectedSub.id);
      if (res.data) {
        setCurrentAssessment(res.data);
        setIsEditMode(false);
        setActiveTab('assessment');
        toast.success('Đã chấm lại phiên bản mới thành công!');
        loadData();
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Lỗi khi chấm lại bằng AI');
    } finally {
      setAiGradingSubmitting(false);
    }
  };

  // Save teacher edits
  const handleSaveTeacherAssessment = async (payload: UpdateAssessmentRequest) => {
    if (!selectedSub) return;
    try {
      setAiGradingSubmitting(true);
      const res = await aiGradingApi.updateAssessment(selectedSub.id, payload);
      if (res.data) {
        setCurrentAssessment(res.data);
        setIsEditMode(false);
        toast.success(payload.publishToStudent ? 'Đã duyệt và chốt điểm chính thức!' : 'Đã lưu bản nháp đánh giá!');
        loadData();
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Lỗi khi lưu đánh giá');
    } finally {
      setAiGradingSubmitting(false);
    }
  };

  // Fallback manual grade
  const handleManualGradeSubmit = async () => {
    if (!selectedSub) return;
    if (manualScore === '' || manualScore < 0 || manualScore > (assignment?.maxScore || 100)) {
      return toast.warning(`Điểm số không hợp lệ (0 - ${assignment?.maxScore})`);
    }

    try {
      setManualGrading(true);
      await assignmentApi.gradeSubmission(selectedSub.id, { 
        score: Number(manualScore), 
        feedback: manualFeedback 
      });
      toast.success('Chấm điểm thành công!');
      loadData();
      loadAssessment(selectedSub.id);
    } catch (err) {
      toast.error('Lỗi khi chấm điểm');
    } finally {
      setManualGrading(false);
    }
  };

  // Multi-select handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === submissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(submissions.map((s) => s.id));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Batch AI Grade triggers
  const handleBatchGradeSelected = async () => {
    if (selectedIds.length === 0 || !id) return;
    try {
      setLoading(true);
      const res = await aiGradingApi.batchGradeSelected(id, selectedIds);
      if (res.data) {
        setActiveBatchId(res.data.batchId);
        setBatchModalOpen(true);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể bắt đầu chấm hàng loạt');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchGradeAll = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await aiGradingApi.gradeAllInAssignment(id);
      if (res.data) {
        setActiveBatchId(res.data.batchId);
        setBatchModalOpen(true);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể bắt đầu chấm toàn bộ bài');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingOverlay text="Đang tải dữ liệu bài tập..." />;
  if (!assignment) return <div className="p-10 text-center text-rose-500 font-bold">Bài tập không tồn tại</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <BackButton fallbackUrl="/assignments" variant="ghost" label="Quay lại" className="mb-2" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-vutru dark:text-night-text tracking-tight flex items-center gap-3">
            <span>Chấm bài: {assignment.title}</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cam/15 text-camDam dark:text-cam border border-cam/30 flex items-center gap-1">
              <Sparkles size={13} /> AI Writing Assistant
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-kem dark:bg-night-elevated text-camDam dark:text-cam px-4 py-2 rounded-xl font-bold border border-cam/20 text-sm">
            Thang điểm tối đa: {assignment.maxScore}đ
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Submissions List with Batch Actions (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-soft overflow-hidden flex flex-col h-[calc(100vh-180px)]">
          {/* Submissions Header & Batch Toolbar */}
          <div className="p-4 bg-gray-50 dark:bg-night-elevated border-b border-gray-100 dark:border-night-border space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-xs font-bold text-vutru dark:text-night-text hover:text-cam transition-colors"
              >
                {selectedIds.length === submissions.length && submissions.length > 0 ? (
                  <CheckSquare size={16} className="text-cam" />
                ) : (
                  <Square size={16} className="text-gray-400" />
                )}
                <span>Chọn tất cả ({submissions.length})</span>
              </button>

              <button
                onClick={handleBatchGradeAll}
                disabled={submissions.length === 0}
                className="text-[11px] font-bold text-camDam dark:text-cam hover:underline flex items-center gap-1"
                title="Tự động chấm tất cả bài chưa chấm xong"
              >
                <Sparkles size={12} /> Chấm toàn bộ AI
              </button>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-cam/10 border border-cam/30 text-xs">
                <span className="font-semibold text-camDam dark:text-cam">Đã chọn {selectedIds.length} bài</span>
                <Button
                  onClick={handleBatchGradeSelected}
                  variant="primary"
                  size="sm"
                  className="text-xs py-1 px-2.5 h-auto"
                >
                  <Sparkles size={12} className="mr-1" /> Chấm {selectedIds.length} bài
                </Button>
              </div>
            )}
          </div>

          {/* Submissions List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {submissions.length === 0 && (
              <div className="text-center p-8 text-gray-400 dark:text-night-muted text-xs">
                Chưa có học viên nào nộp bài tập này.
              </div>
            )}
            {submissions.map((sub) => {
              const isSelected = selectedSub?.id === sub.id;
              const isChecked = selectedIds.includes(sub.id);

              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSub(sub)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-cam/10 border-cam/40 text-camDam dark:text-cam shadow-xs'
                      : 'bg-white dark:bg-night-surface border-gray-100 dark:border-night-border hover:border-gray-300 dark:hover:border-night-border hover:bg-gray-50/80 dark:hover:bg-night-elevated text-vutru dark:text-night-text'
                  }`}
                >
                  <button
                    onClick={(e) => toggleSelectOne(sub.id, e)}
                    className="mt-0.5 text-gray-400 hover:text-cam"
                  >
                    {isChecked ? (
                      <CheckSquare size={16} className="text-cam" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-sm truncate">{sub.studentName}</p>
                      {sub.score !== null && sub.score !== undefined && (
                        <span className="text-xs font-black text-camDam dark:text-cam tabular-nums">
                          {formatScore(sub.score)}đ
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sub.status === 'GRADED'
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                      }`}>
                        {sub.status === 'GRADED' ? 'Đã duyệt điểm' : 'Chờ duyệt'}
                      </span>

                      <span className="text-[11px] text-vutruNhat dark:text-night-muted">
                        {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Grading & AI Assessment (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-soft overflow-hidden flex flex-col h-[calc(100vh-180px)]">
          {!selectedSub ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-vutruNhat dark:text-night-muted">
              <BookOpen size={40} className="mb-3 text-gray-300 dark:text-night-border" />
              <p className="font-bold text-base text-vutru dark:text-night-text">Chọn một bài nộp bên danh sách</p>
              <p className="text-xs max-w-sm mt-1">
                Xem nội dung bài viết, phân tích 4 tiêu chí rubric bằng AI và duyệt điểm chính thức cho học sinh.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top Bar for Selected Submission */}
              <div className="p-4 bg-gray-50/90 dark:bg-night-elevated/70 border-b border-gray-100 dark:border-night-border flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-vutru dark:text-night-text">
                      {selectedSub.studentName}
                    </h3>
                    {currentAssessment?.wordCount !== undefined && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border text-vutruNhat dark:text-night-muted">
                        {currentAssessment.wordCount} từ
                        {assignment.minWordCount || assignment.maxWordCount ? ` (Y/c: ${assignment.minWordCount || '0'}-${assignment.maxWordCount || '∞'})` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-vutruNhat dark:text-night-muted">
                    Nộp lúc {new Date(selectedSub.submittedAt).toLocaleString('vi-VN')}
                  </p>
                </div>

                {/* AI Actions Buttons */}
                <div className="flex items-center gap-2">
                  {currentAssessment?.status === 'COMPLETED' || currentAssessment?.status === 'TEACHER_EDITED' ? (
                    <>
                      <button
                        onClick={() => setRegradeConfirmOpen(true)}
                        disabled={aiGradingSubmitting}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-night-border text-xs font-bold hover:bg-white dark:hover:bg-night-surface flex items-center gap-1.5 transition-colors"
                        title="Chấm lại phiên bản mới bằng AI (bảo toàn lịch sử chỉnh sửa)"
                      >
                        <RefreshCw size={13} className={aiGradingSubmitting ? 'animate-spin' : ''} />
                        Chấm lại bằng AI
                      </button>

                      {!isEditMode && (
                        <Button
                          onClick={() => setIsEditMode(true)}
                          variant="secondary"
                          size="sm"
                          className="text-xs py-1.5"
                        >
                          <Edit3 size={13} className="mr-1" /> Chỉnh sửa đánh giá
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      onClick={handleTriggerAiGrade}
                      isLoading={aiGradingSubmitting}
                      variant="primary"
                      size="sm"
                      className="text-xs"
                    >
                      <Sparkles size={14} className="mr-1.5" /> Chấm bằng AI
                    </Button>
                  )}
                </div>
              </div>

              {/* View Toggle Tabs */}
              <div className="flex items-center px-4 border-b border-gray-100 dark:border-night-border bg-white dark:bg-night-surface">
                <button
                  onClick={() => setActiveTab('assessment')}
                  className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'assessment'
                      ? 'border-cam text-camDam dark:text-cam'
                      : 'border-transparent text-vutruNhat hover:text-vutru dark:hover:text-night-text'
                  }`}
                >
                  <Sparkles size={14} /> AI Đánh Giá Chi Tiết
                </button>
                <button
                  onClick={() => setActiveTab('content')}
                  className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'content'
                      ? 'border-cam text-camDam dark:text-cam'
                      : 'border-transparent text-vutruNhat hover:text-vutru dark:hover:text-night-text'
                  }`}
                >
                  <FileText size={14} /> Bài Làm Của Học Sinh
                </button>
              </div>

              {/* Tab Content Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/40 dark:bg-night-elevated/20">
                {loadingAssessment ? (
                  <div className="py-16 text-center text-vutruNhat dark:text-night-muted text-xs">
                    <Sparkles size={24} className="animate-spin mx-auto mb-2 text-cam" />
                    Đang tải đánh giá AI...
                  </div>
                ) : activeTab === 'content' ? (
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-night-surface p-6 rounded-2xl border border-gray-200 dark:border-night-border min-h-[220px]">
                      {selectedSub.content ? (
                        <div 
                          className="prose max-w-none text-vutru dark:text-night-text text-sm leading-relaxed whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: selectedSub.content }}
                        />
                      ) : (
                        <p className="text-gray-400 dark:text-night-muted italic text-xs">
                          Học viên không nhập văn bản trực tiếp.
                        </p>
                      )}
                    </div>

                    {selectedSub.fileUrl && (
                      <div className="p-4 bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border rounded-xl flex items-center gap-3">
                        <Paperclip size={20} className="text-cam shrink-0" />
                        <div>
                          <p className="font-bold text-sm text-vutru dark:text-night-text">Tệp đính kèm bài làm:</p>
                          <a 
                            href={selectedSub.fileUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-cam hover:underline text-xs font-medium"
                          >
                            Xem / Tải xuống tệp nộp bài
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Assessment Tab */
                  <div>
                    {isEditMode && currentAssessment?.result ? (
                      <TeacherGradingEditor
                        initialResult={currentAssessment.result}
                        maxScore={assignment.maxScore}
                        initialFinalScore={selectedSub.score ?? undefined}
                        onSave={handleSaveTeacherAssessment}
                        onCancel={() => setIsEditMode(false)}
                        isSaving={aiGradingSubmitting}
                      />
                    ) : currentAssessment && (currentAssessment.status === 'COMPLETED' || currentAssessment.status === 'TEACHER_EDITED') ? (
                      <WritingAssessmentViewer 
                        assessment={currentAssessment} 
                        showTeacherNotes={true} 
                      />
                    ) : (
                      <div className="py-12 text-center bg-white dark:bg-night-surface rounded-2xl border border-gray-200 dark:border-night-border p-8 space-y-3">
                        <Sparkles size={36} className="mx-auto text-cam" />
                        <h4 className="font-bold text-base text-vutru dark:text-night-text">
                          Bài viết chưa được chấm bằng AI
                        </h4>
                        <p className="text-xs text-vutruNhat dark:text-night-muted max-w-sm mx-auto">
                          Bấm nút bên dưới để AI tự động phân tích theo 4 tiêu chí rubric CEFR và tìm ra các lỗi cụ thể.
                        </p>
                        <Button
                          onClick={handleTriggerAiGrade}
                          isLoading={aiGradingSubmitting}
                          variant="primary"
                          size="md"
                        >
                          <Sparkles size={14} className="mr-1.5" /> Bắt đầu Chấm bằng AI
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Quick Manual Scoring Bar (Optional fallback) */}
              <div className="p-4 border-t border-gray-200 dark:border-night-border bg-white dark:bg-night-surface">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-vutruNhat dark:text-night-muted">
                      Chấm tay nhanh:
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={assignment.maxScore}
                      step={0.25}
                      value={manualScore}
                      onChange={(e) => setManualScore(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={`/${assignment.maxScore}`}
                      className="w-24 p-1.5 text-center font-bold text-sm rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated text-cam outline-none"
                    />
                    <input
                      type="text"
                      value={manualFeedback}
                      onChange={(e) => setManualFeedback(e.target.value)}
                      placeholder="Ghi chú nhận xét nhanh..."
                      className="w-64 sm:w-80 p-1.5 text-xs rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated outline-none"
                    />
                    <button
                      onClick={handleManualGradeSubmit}
                      disabled={manualGrading}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-night-elevated hover:bg-gray-200 dark:hover:bg-night-border rounded-xl text-xs font-bold"
                    >
                      {manualGrading ? 'Đang lưu...' : 'Lưu Điểm Nhanh'}
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedSub(null)}
                    className="text-xs font-bold text-vutruNhat hover:text-vutru dark:hover:text-night-text"
                  >
                    Đóng chi tiết
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Batch Grading Progress Modal */}
      {batchModalOpen && activeBatchId && id && (
        <BatchGradingModal
          assignmentId={id}
          batchId={activeBatchId}
          onClose={() => setBatchModalOpen(false)}
          onComplete={() => {
            loadData();
            if (selectedSub) loadAssessment(selectedSub.id);
          }}
        />
      )}

      {/* Re-grade Confirmation Modal */}
      {regradeConfirmOpen && (
        <Portal><div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-200 dark:border-night-border p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-base text-vutru dark:text-night-text">Xác nhận chấm lại bằng AI?</h3>
            </div>
            <p className="text-xs text-vutruNhat dark:text-night-muted leading-relaxed">
              Hệ thống sẽ gọi AI đánh giá lại bài làm từ đầu. Mọi chỉnh sửa trước đó của bạn sẽ được <b>tự động bảo toàn trong lịch sử phiên bản (Audit Log)</b> để bạn có thể xem lại bất cứ lúc nào.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-night-border">
              <button
                onClick={() => setRegradeConfirmOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-night-elevated"
              >
                Hủy bỏ
              </button>
              <Button
                onClick={handleRegradeConfirm}
                variant="primary"
                size="sm"
              >
                Tiếp tục Chấm Lại
              </Button>
            </div>
          </div>
        </div></Portal>
      )}
    </div>
  );
};

export default AssignmentGrade;
