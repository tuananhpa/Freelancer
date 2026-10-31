import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { assignmentApi, Assignment } from '../../services/assignmentApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import EmptyState from '../../components/common/EmptyState';
import { BookOpen, Plus, FileText, Calendar, Award } from 'lucide-react';
import { formatShortDate } from '../../utils/dateUtils';

const AssignmentList = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { isTeacher } = useAuth();
  const toast = useToast();

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await assignmentApi.getAssignmentsByCourse(courseId!, 0, 50);
      setAssignments(res.content);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách bài tập');
    } finally {
      setLoading(false);
    }
  }, [courseId, toast]);

  useEffect(() => {
    if (courseId) {
      loadAssignments();
    }
  }, [courseId, loadAssignments]);

  const handleDelete = async (id: string) => {
    const confirmed = await toast.confirm('Bạn có chắc chắn muốn xóa bài tập này?', {
      title: 'Xác nhận xóa bài tập',
      confirmLabel: 'Xóa bài tập',
    });
    if (!confirmed) return;
    try {
      await assignmentApi.deleteAssignment(id);
      toast.success('Xóa bài tập thành công');
      loadAssignments();
    } catch (err) {
      toast.error('Lỗi khi xóa bài tập');
    }
  };

  if (loading) return <LoadingOverlay text="Đang tải danh sách bài tập..." />;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold font-heading text-vutru dark:text-night-text">Danh sách Bài Tập</h2>
          <p className="text-xs text-vutruNhat dark:text-night-muted mt-1">Các bài tập tự luận và nhiệm vụ cần hoàn thành</p>
        </div>
        {isTeacher && (
          <Link to={`/courses/${courseId}/assignments/create`} className="btn btn-chinh text-xs sm:text-sm font-bold flex items-center gap-1.5">
            <Plus size={16} /> Tạo Bài Tập Mới
          </Link>
        )}
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Chưa có bài tập nào"
          description="Khóa học này hiện chưa có bài tập tự luận nào được giao. Hãy quay lại sau hoặc tạo bài tập mới!"
          actionText={isTeacher ? "+ Tạo Bài Tập Ngay" : undefined}
          actionHref={isTeacher ? `/courses/${courseId}/assignments/create` : undefined}
        />
      ) : (
        <div className="grid gap-4">
          {assignments.map((a) => (
            <div key={a.id} className="card p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-cam/30 transition-colors">
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-vutru dark:text-night-text">{a.title}</h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-vutruNhat dark:text-night-muted font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} className="text-cam" />
                    Hạn nộp (dd/mm/yyyy): <strong className="text-vutru dark:text-night-text">{a.dueDate ? new Date(a.dueDate).toLocaleDateString('vi-VN') : 'Không có hạn'}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Award size={13} className="text-cam" />
                    Điểm tối đa: <strong className="text-vutru dark:text-night-text">{a.maxScore}</strong>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                {isTeacher ? (
                  <>
                    <Link to={`/assignments/${a.id}/grade`} className="btn btn-phu text-xs font-bold py-2 px-3">
                      Chấm Bài
                    </Link>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="btn bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 border border-red-200 dark:border-red-800/40 text-xs font-bold py-2 px-3"
                    >
                      Xóa
                    </button>
                  </>
                ) : (
                  <Link to={`/assignments/${a.id}/take`} className="btn btn-chinh text-xs font-bold py-2 px-4">
                    Làm Bài
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentList;
