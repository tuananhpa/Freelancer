import { getApiErrorMessage } from '../../services/api';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseApi, Course, Lesson } from '../../services/courseApi';
import { PlayCircle, CheckCircle2, Award, List } from 'lucide-react';
import DOMPurify from 'dompurify';
import Button from '../../components/ui/Button';
import { CommentSection } from './CommentSection';
import { certificateApi } from '../../services/certificateApi';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/ui/BackButton';
import { useToast } from '../../context/ToastContext';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import LessonMediaPlayer from '../../components/common/LessonMediaPlayer';


import Portal from '../../components/ui/Portal';
const CourseViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [issuingCert, setIssuingCert] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (id) {
      // Hoc sinh co the vao thang trang nay tu tab "Khoa hoc lien ket" cua lop
      // (ClassCourses.tsx) ma khong qua CourseDetail.tsx nen chua tung duoc
      // enroll - tien do van luu binh thuong nhung khoa hoc khong hien o "Khoa
      // hoc cua toi", va sau nay khong du dieu kien nhan chung chi (yeu cau da
      // enroll). Goi enroll o day, bo qua loi neu da tham gia roi.
      if (user && user.role === 'STUDENT') {
        courseApi.enrollInCourse(id).catch(() => {});
      }
      Promise.all([
        courseApi.getCourseById(id),
        courseApi.getCourseProgress(id).catch(() => [])
      ]).then(([courseData, progressData]) => {
        setCourse(courseData);
        if (courseData.sections?.[0]?.lessons?.[0]) {
          setActiveLesson(courseData.sections[0].lessons[0]);
        }
        if (progressData) {
          const completedIds = progressData.filter(p => p.isCompleted).map(p => p.lesson.id);
          setCompletedLessons(new Set(completedIds));
        }
      }).catch(console.error);
    }
  }, [id]);

  const handleMarkComplete = async () => {
    if (!activeLesson) return;
    try {
      await courseApi.markLessonComplete(activeLesson.id);
      setCompletedLessons(prev => new Set(prev).add(activeLesson.id));
    } catch (err) {
      console.error(err);
      // Fallback for UI if backend is not fully synced
      setCompletedLessons(prev => new Set(prev).add(activeLesson.id));
    }
  };

  if (!course) return <LoadingOverlay text="Đang tải..." />;

  const totalLessons = course.sections?.reduce((acc, sec) => acc + (sec.lessons?.length || 0), 0) || 0;
  const progressPercent = totalLessons === 0 ? 0 : Math.round((completedLessons.size / totalLessons) * 100);

  const handleIssueCertificate = async () => {
    if (!course || !user) return;
    setIssuingCert(true);
    try {
      const cert = await certificateApi.issue(course.id, user.id);
      toast.success('Đã cấp chứng chỉ thành công!');
      navigate(`/verify-certificate/${cert.uniqueCode}`);
    } catch (err: any) {
      if (getApiErrorMessage(err, 'Có lỗi xảy ra')?.includes('already issued')) {
        toast.info('Bạn đã có chứng chỉ khóa học này rồi!');
        // Ideally we would fetch the certificate code to redirect, but for simplicity:
        navigate('/profile/certificates');
      } else {
        toast.error('Lỗi khi cấp chứng chỉ');
      }
    } finally {
      setIssuingCert(false);
    }
  };

  return (
    <Portal><div className="fixed inset-0 z-50 bg-white flex flex-col md:flex-row overflow-hidden">
      {/* Mobile curriculum drawer overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          className="md:hidden fixed inset-0 z-[55] bg-black/40"
          aria-label="Đóng danh sách bài học"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Curriculum sidebar */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 z-[60] md:z-auto
          w-[min(20rem,88vw)] md:w-80 shrink-0
          border-r border-gray-200 bg-kem flex flex-col
          transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-4 border-b border-gray-200 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <BackButton to="/courses" size={20} className="w-10 h-10" />
            <h2 className="font-bold text-vutru truncate" title={course.title}>{course.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-xs font-bold text-gray-500 w-8">{progressPercent}%</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {course.sections?.map((section, idx) => (
            <div key={section.id} className="border-b border-gray-200">
              <div className="px-4 py-3 bg-gray-50/50 font-bold text-sm text-vutruNhat">
                Phần {idx + 1}: {section.title}
              </div>
              <div>
                {section.lessons?.map((lesson, lIdx) => {
                  const isActive = activeLesson?.id === lesson.id;
                  const isCompleted = completedLessons.has(lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        setActiveLesson(lesson);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                        isActive ? 'bg-cam/10 border-l-4 border-cam' : 'hover:bg-white border-l-4 border-transparent'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <PlayCircle className={`w-4 h-4 ${isActive ? 'text-cam' : 'text-gray-400'}`} />
                        )}
                      </div>
                      <span className={`text-sm ${isActive ? 'font-bold text-camDam' : 'font-medium text-vutru'}`}>
                        {lIdx + 1}. {lesson.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {progressPercent === 100 && (
            <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
              <Button
                variant="primary"
                className="w-full bg-cam border-none shadow-lg shadow-cam/30 text-white font-bold h-12"
                onClick={handleIssueCertificate}
                disabled={issuingCert}
                iconLeft={<Award className="w-5 h-5" />}
              >
                {issuingCert ? 'Đang cấp...' : 'Nhận chứng chỉ'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-white overflow-y-auto">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-10 flex items-center gap-2 px-3 py-3 border-b border-gray-100 bg-white/95 backdrop-blur">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-100 text-vutru"
            aria-label="Danh sách bài học"
          >
            <List size={22} />
          </button>
          <p className="font-bold text-sm text-vutru truncate flex-1 min-w-0">
            {activeLesson?.title || course.title}
          </p>
          <BackButton to="/courses" size={18} className="w-9 h-9" />
        </div>

        {activeLesson ? (
          <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-vutru font-heading mb-6">{activeLesson.title}</h1>
            
            {activeLesson.resourceUrl && (
              <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-8 shadow-lg">
                <LessonMediaPlayer url={activeLesson.resourceUrl} className="w-full h-full object-contain" />
              </div>
            )}
            
            {activeLesson.content && (
              <div className="prose prose-base sm:prose-lg prose-indigo max-w-none mb-12 overflow-x-auto" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activeLesson.content) }} />
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-6 border-t border-gray-100 mt-auto">
              <Button 
                onClick={handleMarkComplete}
                disabled={completedLessons.has(activeLesson.id)}
                variant={completedLessons.has(activeLesson.id) ? 'outline' : 'primary'}
                iconLeft={<CheckCircle2 className="w-5 h-5" />}
                className="w-full sm:w-auto"
              >
                {completedLessons.has(activeLesson.id) ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
              </Button>
            </div>

            <CommentSection lessonId={activeLesson.id} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 p-6 text-center">
            Vui lòng chọn bài học từ danh sách
          </div>
        )}
      </div>
    </div></Portal>
  );
};

export default CourseViewer;
