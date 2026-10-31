import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseApi, Course, Enrollment } from '../../services/courseApi';
import { BookOpen, Clock, PlayCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';

import PageHeader from '../../components/ui/PageHeader';
import { GraduationCap } from 'lucide-react';
const CourseList = () => {
  const { isTeacher } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const initialTab = searchParams.get('tab') === 'my_courses' ? 'MY_COURSES' : 'EXPLORE';
  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'MY_COURSES'>(initialTab);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab]);

  useEffect(() => {
    fetchData(currentPage);
  }, [activeTab, currentPage]);

  const fetchData = async (page: number) => {
    try {
      if (isTeacher) {
        const data = await courseApi.getTeacherCourses(page, 9);
        setCourses(data.content);
        setTotalPages(data.totalPages);
      } else if (activeTab === 'EXPLORE') {
        const data = await courseApi.getAllPublished(page, 9);
        setCourses(data.content);
        setTotalPages(data.totalPages);
      } else {
        const data = await courseApi.getMyEnrollments(page, 9);
        setEnrollments(data.content);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        className="mb-8"
        icon={GraduationCap}
        title="Khóa học"
        subtitle="Khám phá lộ trình học tập được thiết kế bởi các chuyên gia."
        actions={isTeacher && (
          <Button onClick={() => navigate('/courses/create')} variant="primary" size="md">
            + Tạo khóa học
          </Button>
        )}
      />

      {/* Tabs */}
      {!isTeacher && (
        <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-night-border">
          <button
            onClick={() => setActiveTab('EXPLORE')}
            className={`pb-4 px-2 font-bold text-lg transition-colors ${activeTab === 'EXPLORE' ? 'theme-tab-active' : 'text-gray-400 hover:text-vutruNhat'}`}
          >
            Khám phá
          </button>
          <button
            onClick={() => setActiveTab('MY_COURSES')}
            className={`pb-4 px-2 font-bold text-lg transition-colors ${activeTab === 'MY_COURSES' ? 'theme-tab-active' : 'text-gray-400 hover:text-vutruNhat'}`}
          >
            Khóa học của tôi
          </button>
        </div>
      )}

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isTeacher || activeTab === 'EXPLORE' ? (
          courses.length === 0 ? (
            <p className="text-gray-500 col-span-full text-center py-10">Chưa có khóa học nào.</p>
          ) : (
            courses.map(course => (
              <Card 
                key={course.id} 
                hoverable 
                padding="none"
                onClick={() => navigate(isTeacher ? `/courses/${course.id}/edit` : `/courses/${course.id}`)}
                className="flex flex-col h-full"
              >
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-camNhat/50">
                      <BookOpen className="w-12 h-12 text-cam/40" />
                    </div>
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-vutru font-heading mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-vutruNhat text-sm line-clamp-2 mb-4 flex-1">{course.description || 'Chưa có mô tả'}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 font-medium mt-auto border-t border-gray-50 pt-4">
                    <span className="flex items-center gap-1"><PlayCircle className="w-4 h-4" /> {course.sections?.reduce((acc, sec) => acc + (sec.lessons?.length || 0), 0) || 0} bài học</span>
                    {isTeacher && (
                      <Badge variant={course.status === 'PUBLISHED' ? 'success' : 'neutral'}>{course.status}</Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )
        ) : (
          enrollments.length === 0 ? (
            <p className="text-gray-500 col-span-full text-center py-10">Bạn chưa đăng ký khóa học nào.</p>
          ) : (
            enrollments.map(enrollment => (
              <Card 
                key={enrollment.id} 
                hoverable 
                padding="none"
                onClick={() => navigate(`/courses/${enrollment.course.id}/study`)}
                className="flex flex-col h-full"
              >
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {enrollment.course.thumbnailUrl ? (
                    <img src={enrollment.course.thumbnailUrl} alt={enrollment.course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                      <BookOpen className="w-12 h-12 text-blue-300" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <Badge variant="info">Đang học</Badge>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-vutru font-heading mb-2 line-clamp-2">{enrollment.course.title}</h3>
                  <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-sm text-vutruNhat">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Đã tham gia: {new Date(enrollment.enrolledAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </Card>
            ))
          )
        )}
      </div>

      <div className="mt-8">
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default CourseList;
