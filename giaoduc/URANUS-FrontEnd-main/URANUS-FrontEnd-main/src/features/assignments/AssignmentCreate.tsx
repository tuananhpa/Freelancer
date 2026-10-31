import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentApi } from '../../services/assignmentApi';
import { uploadFile } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import TipTapEditor from '../../components/common/TipTapEditor';
import DeadlinePicker from '../../components/common/DeadlinePicker';
import { toApiDatetimeString } from '../../utils/dateUtils';
import BackButton from '../../components/ui/BackButton';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

const AssignmentCreate = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxScore, setMaxScore] = useState<number | ''>(100);
  const [dueDate, setDueDate] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // AI Writing fields
  const [showAiConfig, setShowAiConfig] = useState(false);
  const [languageLevel, setLanguageLevel] = useState('');
  const [minWordCount, setMinWordCount] = useState<number | ''>('');
  const [maxWordCount, setMaxWordCount] = useState<number | ''>('');
  const [instructions, setInstructions] = useState('');
  const [expectedAnswer, setExpectedAnswer] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info('Đang tải tệp lên...');
      const res = await uploadFile(file);
      setFileUrl(res.fileUrl);
      toast.success('Tải tệp thành công');
    } catch (err) {
      toast.error('Lỗi khi tải tệp');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.warning('Vui lòng nhập tiêu đề');
    if (!courseId) return;

    try {
      setSubmitting(true);
      await assignmentApi.createAssignment({
        title,
        description,
        maxScore: Number(maxScore) || 100,
        dueDate: toApiDatetimeString(dueDate) || undefined,
        attachmentUrl: fileUrl || undefined,
        courseId,
        assignmentType: 'WRITING',
        instructions: instructions.trim() || undefined,
        minWordCount: minWordCount !== '' ? Number(minWordCount) : undefined,
        maxWordCount: maxWordCount !== '' ? Number(maxWordCount) : undefined,
        languageLevel: languageLevel || undefined,
        expectedAnswer: expectedAnswer.trim() || undefined,
      });
      toast.success('Tạo bài tập thành công');
      navigate(`/courses/${courseId}/assignments`);
    } catch (err) {
      toast.error('Lỗi khi tạo bài tập');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <BackButton 
        fallbackUrl={courseId ? `/courses/${courseId}` : '/courses'} 
        variant="ghost" 
        label="Quay lại" 
        className="mb-4"
        confirmMessage={title.trim() ? "Bạn có chắc muốn thoát? Thông tin bài tập chưa lưu sẽ bị mất." : undefined}
      />

      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-extrabold text-vutru mb-6">Tạo Bài Tập Tự Luận</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề bài tập <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-cam outline-none"
              placeholder="VD: Bài luận tiếng Anh số 1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <DeadlinePicker
                label="Hạn nộp bài (Tùy chọn)"
                value={dueDate}
                onChange={setDueDate}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Điểm tối đa <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                required
                min="1"
                value={maxScore}
                onChange={e => setMaxScore(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-vutru dark:text-night-text text-sm focus:border-cam outline-none font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Đề bài (Mô tả chi tiết)</label>
            <TipTapEditor value={description} onChange={setDescription} minHeight="200px" placeholder="Nhập đề bài chi tiết..." />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">File đính kèm (Đề thi PDF/Word/Excel...)</label>
            <div className="flex items-center gap-4">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn bg-gray-100 text-gray-700 hover:bg-gray-200">
                Chọn File
              </button>
              {fileUrl && (
                <a href={fileUrl} target="_blank" rel="noreferrer" className="text-camDam hover:underline text-sm font-medium">
                  Xem file đã tải lên
                </a>
              )}
            </div>
          </div>

          {/* AI Writing Grading Configuration (Optional) */}
          <div className="border border-indigo-100 rounded-2xl bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAiConfig(!showAiConfig)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-indigo-50/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">Cấu hình AI Writing Grading</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Tùy chọn</span>
                  </div>
                  <p className="text-[11px] text-gray-500">Thiết lập số từ, cấp độ CEFR và dàn ý đáp án để AI chấm chính xác nhất</p>
                </div>
              </div>
              {showAiConfig ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {showAiConfig && (
              <div className="p-5 border-t border-indigo-100/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Cấp độ ngôn ngữ (CEFR)
                    </label>
                    <select
                      value={languageLevel}
                      onChange={e => setLanguageLevel(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-vutru focus:border-cam outline-none"
                    >
                      <option value="">Tự động</option>
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
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Số từ tối thiểu (Min words)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minWordCount}
                      onChange={e => setMinWordCount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="VD: 150"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-vutru focus:border-cam outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Số từ tối đa (Max words)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={maxWordCount}
                      onChange={e => setMaxWordCount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="VD: 250"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-vutru focus:border-cam outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Hướng dẫn chi tiết cho bài viết (Instructions)
                  </label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    placeholder="VD: Viết bức thư khoảng 150 từ phàn nàn về chất lượng dịch vụ khách sạn..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-vutru focus:border-cam outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Dàn ý / Đáp án mẫu mong đợi (Expected Sample Answer)
                  </label>
                  <textarea
                    rows={3}
                    value={expectedAnswer}
                    onChange={e => setExpectedAnswer(e.target.value)}
                    placeholder="Nhập dàn ý chính, từ vựng hoặc bài mẫu để AI so sánh đối chiếu khi chấm..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-vutru focus:border-cam outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button type="submit" disabled={submitting} className="btn btn-chinh px-8">
              {submitting ? 'Đang tạo...' : 'Tạo Bài Tập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentCreate;
