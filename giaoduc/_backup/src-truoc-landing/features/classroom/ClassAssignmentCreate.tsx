import { getApiErrorMessage } from '../../services/api';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assignmentApi } from '../../services/assignmentApi';
import { mediaApi } from '../../services/mediaApi';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Clock, Upload, Award, FileText, CheckCircle2, AlertCircle, Trash2, X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import DeadlinePicker from '../../components/common/DeadlinePicker';
import { toLocalDatetimeInput, toApiDatetimeString } from '../../utils/dateUtils';
import Alert from '../../components/ui/Alert';

const ClassAssignmentCreate: React.FC = () => {
  const { classId, assignmentId } = useParams<{ classId: string; assignmentId?: string }>();
  const classroomId = classId || '';
  const navigate = useNavigate();
  const toast = useToast();

  const isEditMode = !!assignmentId;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
    attachmentUrl: '',
    assignmentType: 'WRITING',
    instructions: '',
    minWordCount: '' as number | '',
    maxWordCount: '' as number | '',
    languageLevel: '',
    expectedAnswer: '',
  });

  const [showAiConfig, setShowAiConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode && assignmentId) {
      assignmentApi
        .getAssignmentById(assignmentId)
        .then((res) => {
          const assignment = res;
          setFormData({
            title: assignment.title || '',
            description: assignment.description || '',
            dueDate: toLocalDatetimeInput(assignment.dueDate),
            maxScore: assignment.maxScore || 100,
            attachmentUrl: assignment.attachmentUrl || '',
            assignmentType: assignment.assignmentType || 'WRITING',
            instructions: assignment.instructions || '',
            minWordCount: assignment.minWordCount ?? '',
            maxWordCount: assignment.maxWordCount ?? '',
            languageLevel: assignment.languageLevel || '',
            expectedAnswer: assignment.expectedAnswer || '',
          });
          if (assignment.minWordCount || assignment.maxWordCount || assignment.languageLevel || assignment.expectedAnswer) {
            setShowAiConfig(true);
          }
        })
        .catch((err) => {
          setError('Không thể tải thông tin bài tập');
          console.error(err);
        })
        .finally(() => {
          setInitialLoading(false);
        });
    }
  }, [isEditMode, assignmentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Kích thước tệp quá lớn (Tối đa 20MB)');
      return;
    }

    setIsUploading(true);
    try {
      const res = await mediaApi.uploadFile(file, 'uranus_assignments');
      setFormData({ ...formData, attachmentUrl: res.url });
      toast.success('Đã tải tệp lên thành công');
    } catch (err) {
      toast.error('Lỗi khi tải tệp lên');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Tiêu đề là bắt buộc');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: toApiDatetimeString(formData.dueDate),
        maxScore: Number(formData.maxScore) || 100,
        attachmentUrl: formData.attachmentUrl,
        classroomId: classroomId,
        assignmentType: formData.assignmentType || 'WRITING',
        instructions: formData.instructions?.trim() || undefined,
        minWordCount: formData.minWordCount !== '' ? Number(formData.minWordCount) : undefined,
        maxWordCount: formData.maxWordCount !== '' ? Number(formData.maxWordCount) : undefined,
        languageLevel: formData.languageLevel || undefined,
        expectedAnswer: formData.expectedAnswer?.trim() || undefined,
      };

      if (isEditMode && assignmentId) {
        await assignmentApi.updateAssignment(assignmentId, payload);
        toast.success('Cập nhật bài tập thành công');
      } else {
        await assignmentApi.createAssignment(payload);
        toast.success('Giao bài tập thành công');
      }

      navigate(`/classes/${classroomId}/classwork`);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Có lỗi xảy ra') || (isEditMode ? 'Lỗi khi cập nhật bài tập' : 'Lỗi khi tạo bài tập'));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <LoadingOverlay text="Đang tải thông tin bài tập..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-night-border">
        <div className="flex items-center gap-3">
          <Link
            to={`/classes/${classroomId}/classwork`}
            className="p-2 rounded-xl text-vutruNhat hover:text-vutru dark:hover:text-night-text hover:bg-gray-100 dark:hover:bg-night-elevated transition-colors"
            title="Quay lại danh sách bài tập"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-vutru dark:text-night-text">
              {isEditMode ? 'Chỉnh sửa bài tập tự luận' : 'Giao bài tập tự luận mới'}
            </h1>
            <p className="text-xs text-vutruNhat dark:text-night-muted">
              Cung cấp hướng dẫn, thời hạn nộp bài và thang điểm cho học viên
            </p>
          </div>
        </div>

        <Link
          to={`/classes/${classroomId}/classwork`}
          className="text-xs font-bold text-vutruNhat hover:text-vutru dark:hover:text-night-text px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-night-elevated transition-colors"
        >
          Hủy
        </Link>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-soft overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          <div>
            <label htmlFor="title" className="block text-xs font-semibold text-vutru dark:text-night-text mb-1.5">
              Tiêu đề bài tập <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-sm focus:border-cam focus:outline-none focus:ring-2 focus:ring-cam/20 transition-all font-medium text-vutru dark:text-night-text"
              placeholder="VD: Bài tập tự luận Chương 1: Đạo hàm & Khảo sát hàm số"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-semibold text-vutru dark:text-night-text mb-1.5">
              Nội dung & Hướng dẫn làm bài
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-sm focus:border-cam focus:outline-none focus:ring-2 focus:ring-cam/20 transition-all font-medium text-vutru dark:text-night-text"
              placeholder="Nhập yêu cầu đề bài, định dạng tệp nộp bài, hoặc các lưu ý chấm điểm cho học sinh..."
            />
          </div>

          {/* Deadline Picker & Max Score */}
          <div className="space-y-6">
            <DeadlinePicker
              value={formData.dueDate}
              onChange={(val) => setFormData((prev) => ({ ...prev, dueDate: val }))}
              label="Hạn nộp bài tập"
            />

            <div>
              <label htmlFor="maxScore" className="flex items-center gap-1.5 text-xs font-semibold text-vutru dark:text-night-text mb-1.5">
                <Award size={14} className="text-cam" />
                Thang điểm tối đa
              </label>
              <input
                type="number"
                id="maxScore"
                name="maxScore"
                min="1"
                max="100"
                value={formData.maxScore}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-sm focus:border-cam focus:outline-none focus:ring-2 focus:ring-cam/20 transition-all font-medium text-vutru dark:text-night-text"
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-semibold text-vutru dark:text-night-text mb-1.5">
              Tệp tài liệu đính kèm (Đề bài PDF, Word, Ảnh hướng dẫn)
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-night-elevated border border-dashed border-gray-300 dark:border-night-border rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-night-border transition-colors group">
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-cam border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload size={16} className="text-vutruNhat dark:text-night-muted group-hover:text-cam transition-colors" />
                )}
                <span className="text-xs font-semibold text-vutru dark:text-slate-200 group-hover:text-cam transition-colors">
                  {isUploading ? 'Đang tải tệp...' : 'Tải tệp đính kèm lên...'}
                </span>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>

              {formData.attachmentUrl && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 truncate max-w-sm">
                  <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                  <a href={formData.attachmentUrl} target="_blank" rel="noopener noreferrer" className="truncate hover:underline font-semibold">
                    {formData.attachmentUrl.split('/').pop()}
                  </a>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, attachmentUrl: '' })}
                    className="p-0.5 rounded text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
                    title="Xóa tệp đính kèm"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* AI Writing Grading Configuration (Optional) */}
          <div className="border border-indigo-100 dark:border-indigo-900/40 rounded-2xl bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 dark:from-indigo-950/20 dark:via-night-surface dark:to-purple-950/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAiConfig(!showAiConfig)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-night-text">Cấu hình AI Writing Grading</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">Tùy chọn</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-night-muted">Thiết lập số từ, cấp độ CEFR và dàn ý đáp án để AI chấm chính xác nhất</p>
                </div>
              </div>
              {showAiConfig ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {showAiConfig && (
              <div className="p-5 border-t border-indigo-100/60 dark:border-indigo-900/30 space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-night-text mb-1">
                      Cấp độ ngôn ngữ (CEFR)
                    </label>
                    <select
                      name="languageLevel"
                      value={formData.languageLevel}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-xs text-vutru dark:text-night-text focus:border-cam outline-none"
                    >
                      <option value="">Tự động (Theo lớp)</option>
                      <option value="A1">A1 - Beginner</option>
                      <option value="A2">A2 - Elementary</option>
                      <option value="B1">B1 - Intermediate</option>
                      <option value="B2">B2 - Upper-Intermediate</option>
                      <option value="C1">C1 - Advanced</option>
                      <option value="C2">C2 - Proficiency</option>
                      <option value="IELTS">IELTS Academic / General</option>
                      <option value="TOEIC">TOEIC Writing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-night-text mb-1">
                      Số từ tối thiểu (Min words)
                    </label>
                    <input
                      type="number"
                      name="minWordCount"
                      min="0"
                      value={formData.minWordCount}
                      onChange={handleChange}
                      placeholder="VD: 150"
                      className="w-full px-3 py-2 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-xs text-vutru dark:text-night-text focus:border-cam outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-night-text mb-1">
                      Số từ tối đa (Max words)
                    </label>
                    <input
                      type="number"
                      name="maxWordCount"
                      min="0"
                      value={formData.maxWordCount}
                      onChange={handleChange}
                      placeholder="VD: 250"
                      className="w-full px-3 py-2 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-xs text-vutru dark:text-night-text focus:border-cam outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-night-text mb-1">
                    Hướng dẫn chi tiết cho bài viết (Instructions)
                  </label>
                  <input
                    type="text"
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleChange}
                    placeholder="VD: Viết bức thư khoảng 150 từ phàn nàn về chất lượng dịch vụ khách sạn..."
                    className="w-full px-3 py-2 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-xs text-vutru dark:text-night-text focus:border-cam outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-night-text mb-1">
                    Dàn ý / Đáp án mẫu mong đợi (Expected Sample Answer)
                  </label>
                  <textarea
                    name="expectedAnswer"
                    rows={3}
                    value={formData.expectedAnswer}
                    onChange={handleChange}
                    placeholder="Nhập dàn ý chính, từ vựng hoặc bài mẫu để AI so sánh đối chiếu khi chấm..."
                    className="w-full px-3 py-2 bg-white dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-xs text-vutru dark:text-night-text focus:border-cam outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="px-6 sm:px-8 py-4 bg-gray-50/70 dark:bg-night-elevated/40 border-t border-gray-100 dark:border-night-border flex items-center justify-end gap-3">
          <Link
            to={`/classes/${classroomId}/classwork`}
            className="px-4 py-2 text-xs font-bold text-vutruNhat hover:text-vutru dark:hover:text-night-text"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={loading || isUploading || !formData.title.trim()}
            className="btn btn-chinh text-xs px-6 py-2.5 min-w-[130px]"
          >
            {loading ? 'Đang lưu...' : isEditMode ? 'Lưu thay đổi' : 'Giao bài tập'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClassAssignmentCreate;
