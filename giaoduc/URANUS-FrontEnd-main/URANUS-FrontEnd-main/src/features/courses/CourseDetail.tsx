import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseApi, Course } from '../../services/courseApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../services/api';
import axios from 'axios';
import { BookOpen, CheckCircle2, PlayCircle, MessageSquare, FileText } from 'lucide-react';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import BackButton from '../../components/ui/BackButton';

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (id) {
      courseApi.getCourseById(id).then(setCourse).catch(console.error);
    }
  }, [id]);

  const handleEnroll = async () => {
    if (!id) return;
    // Giao vien/TA/admin xem bai giang de quan ly/preview, khong phai "tham
    // gia khoa hoc" nhu hoc sinh - goi enroll cho ho se tao nham enrollment
    // va bao loi "da tham gia" ngay khi vao lai.
    if (user && user.role !== 'STUDENT') {
      navigate(`/courses/${id}/study`);
      return;
    }
    try {
      setEnrolling(true);
      await courseApi.enrollInCourse(id);
      toast.success('Đăng ký khóa học thành công!');
      navigate(`/courses/${id}/study`);
    } catch (err) {
      // "Vào Học Ngay" goi enroll ngay ca khi hoc vien da tham gia roi (khong
      // co co isEnrolled tren Course de kiem truoc). Truong hop nay backend
      // tra 400 "da tham gia" - khong phai loi that, chi can vao hoc binh thuong.
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        navigate(`/courses/${id}/study`);
        return;
      }
      toast.error(getApiErrorMessage(err, 'Không thể tham gia khóa học'));
    } finally {
      setEnrolling(false);
    }
  };

  if (!course) return <LoadingOverlay text="Đang tải thông tin khóa học..." />;

  const totalLessons = course.sections?.reduce((acc, sec) => acc + (sec.lessons?.length || 0), 0) || 0;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <BackButton to="/courses" variant="ghost" label="Quay lại danh sách khóa học" className="mb-4" />

      <div className="bg-white dark:bg-night-surface rounded-[32px] overflow-hidden shadow-sm border border-gray-100 dark:border-night-border">
        <div className="aspect-[21/9] bg-camNhat/30 dark:bg-night-elevated relative flex items-center justify-center">
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <BookOpen className="w-20 h-20 text-cam/30" />
          )}
        </div>
        
        <div className="p-6 sm:p-10 md:p-12">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-vutru dark:text-night-text font-heading mb-4">{course.title}</h1>
          <p className="text-sm sm:text-base text-vutruNhat dark:text-night-muted mb-8 leading-relaxed whitespace-pre-wrap">{course.description}</p>
          
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="flex items-center gap-2 bg-camNhat/40 dark:bg-cam/10 px-3.5 py-2 rounded-xl text-camDam dark:text-cam font-bold text-xs sm:text-sm">
              <PlayCircle className="w-4 h-4" /> {totalLessons} bài học
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-2 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4" /> Truy cập trọn đời
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-night-border">
            <button 
              onClick={handleEnroll}
              disabled={enrolling}
              className="btn btn-chinh text-sm sm:text-base font-bold py-3 px-8 shadow-soft"
            >
              {enrolling ? 'Đang vào học...' : 'Vào Học Ngay'}
            </button>
            <button
              onClick={() => navigate(`/courses/${id}/assignments`)}
              className="btn btn-phu text-sm sm:text-base font-bold py-3 px-6 flex items-center gap-2"
            >
              <FileText size={16} /> Bài Tập (Assignments)
            </button>
            <button
              onClick={() => navigate(`/courses/${id}/discussions`)}
              className="btn btn-vien text-sm sm:text-base font-bold py-3 px-6 flex items-center gap-2"
            >
              <MessageSquare size={16} /> Hỏi đáp & Thảo luận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
