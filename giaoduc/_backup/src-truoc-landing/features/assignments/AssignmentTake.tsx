import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { assignmentApi, Assignment, AssignmentSubmission } from '../../services/assignmentApi';
import { uploadFile } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import TipTapEditor from '../../components/common/TipTapEditor';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import BackButton from '../../components/ui/BackButton';
import { formatScore } from '../../utils/formatUtils';
import { aiGradingApi, WritingAssessmentResponse } from '../../services/aiGradingApi';
import WritingAssessmentViewer from './components/WritingAssessmentViewer';

const AssignmentTake = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [assessment, setAssessment] = useState<WritingAssessmentResponse | null>(null);
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      try {
        const subData = await assignmentApi.getMySubmission(id!);
        setSubmission(subData);
        setContent(subData.content || '');
        setFileUrl(subData.fileUrl || '');

        // Lấy đánh giá chi tiết AI nếu có
        try {
          const assessRes = await aiGradingApi.getAssessment(subData.id);
          if (assessRes.data && assessRes.data.result) {
            setAssessment(assessRes.data);
          }
        } catch {}
      } catch (e) {
        // No submission yet, that's fine
      }
    } catch (err) {
      toast.error('Không tải được thông tin bài tập');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info('Đang tải file lên...');
      const res = await uploadFile(file);
      setFileUrl(res.fileUrl);
      toast.success('Tải file thành công!');
    } catch (err) {
      toast.error('Lỗi khi tải file lên');
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !fileUrl) {
      return toast.warning('Bạn phải nhập nội dung hoặc đính kèm file để nộp bài.');
    }
    if (!id) return;

    try {
      setSubmitting(true);
      await assignmentApi.submitAssignment(id, { content, fileUrl });
      toast.success('Nộp bài thành công!');
      loadData();
    } catch (err) {
      toast.error('Lỗi khi nộp bài');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingOverlay text="Đang tải..." />;
  if (!assignment) return <div className="p-10 text-center text-red-500">Bài tập không tồn tại</div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <BackButton fallbackUrl="/assignments" variant="ghost" label="Quay lại" className="mb-4" />

      {/* Assignment Info */}
      <div className="bg-white dark:bg-night-surface p-8 rounded-2xl border border-gray-100 dark:border-night-border shadow-sm mb-6">
        <h1 className="text-3xl font-extrabold text-vutru dark:text-night-text mb-4">{assignment.title}</h1>
        
        <div className="flex gap-4 mb-6 text-sm">
          <span className="bg-kem dark:bg-night-elevated text-camDam dark:text-cam px-3 py-1 rounded-lg font-bold">
            Điểm tối đa: {assignment.maxScore}
          </span>
          <span className="bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted px-3 py-1 rounded-lg font-bold">
            Hạn nộp: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : 'Không có hạn'}
          </span>
        </div>

        <div className="prose max-w-none text-vutruNhat dark:text-night-muted bg-gray-50 dark:bg-night-elevated/40 p-6 rounded-xl border border-gray-100 dark:border-night-border whitespace-pre-wrap">
          {assignment.description || 'Không có mô tả chi tiết.'}
        </div>

        {assignment.attachmentUrl && (
          <div className="mt-4 flex items-center gap-2">
            <span className="font-bold text-sm text-vutruNhat dark:text-night-muted">File đính kèm từ Giáo viên:</span>
            <a href={assignment.attachmentUrl} target="_blank" rel="noreferrer" className="text-camDam dark:text-cam hover:underline text-sm font-medium">
              Tải xuống / Xem
            </a>
          </div>
        )}
      </div>

      {/* Submission Area */}
      <div className="bg-white dark:bg-night-surface p-8 rounded-2xl border border-gray-100 dark:border-night-border shadow-sm">
        <h2 className="text-xl font-bold text-vutru dark:text-night-text mb-4">Bài Làm Của Bạn</h2>

        {submission?.status === 'GRADED' ? (
          <div className="space-y-6 mb-6">
            <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/40 p-6 rounded-xl">
              <h3 className="font-bold text-green-700 dark:text-green-400 text-lg mb-2">Đã Chấm Điểm Chính Thức</h3>
              <p className="text-3xl font-extrabold text-green-600 dark:text-green-400 mb-2 tabular-nums">{formatScore(submission.score)} / {formatScore(assignment.maxScore)}đ</p>
              {submission.feedback && (
                <p className="text-green-800 dark:text-green-300 font-medium whitespace-pre-wrap"><span className="font-bold">Nhận xét:</span> {submission.feedback}</p>
              )}
            </div>

            {assessment && (
              <div className="pt-2">
                <WritingAssessmentViewer assessment={assessment} showTeacherNotes={false} />
              </div>
            )}
          </div>
        ) : submission ? (
          <div className="space-y-6 mb-6">
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 p-4 rounded-xl text-blue-700 dark:text-blue-300 font-medium">
              Bạn đã nộp bài vào lúc {new Date(submission.submittedAt).toLocaleString('vi-VN')}. Bài nộp đang được hệ thống và giáo viên chấm điểm.
            </div>

            {assessment && assessment.result && (
              <div className="pt-2">
                <WritingAssessmentViewer assessment={assessment} showTeacherNotes={false} />
              </div>
            )}
          </div>
        ) : null}

        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 dark:text-night-muted mb-2">Nội dung bài làm (soạn thảo văn bản):</label>
          <TipTapEditor value={content} onChange={setContent} minHeight="200px" placeholder="Nhập bài làm của bạn vào đây..." />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 dark:text-night-muted mb-2">Hoặc đính kèm file (Word, PDF, Excel...):</label>
          <div className="flex items-center gap-4">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="btn bg-gray-100 dark:bg-night-elevated text-gray-700 dark:text-night-text hover:bg-gray-200 dark:hover:bg-night-border">
              Chọn File Upload
            </button>
            {fileUrl && (
              <a href={fileUrl} target="_blank" rel="noreferrer" className="text-camDam dark:text-cam hover:underline text-sm font-medium">
                Xem file đã tải lên
              </a>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-100 dark:border-night-border pt-6">
          <Button 
            onClick={handleSubmit} 
            disabled={submission?.status === 'GRADED'} 
            isLoading={submitting}
            variant="primary" 
            size="lg"
          >
            Nộp Bài Tập
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentTake;
