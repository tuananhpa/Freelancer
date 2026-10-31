import { getApiErrorMessage } from '../../services/api';
import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import classService, { Classroom } from '../../services/class.service';
import { courseApi } from '../../services/courseApi';
import { useToast } from '../../context/ToastContext';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';


interface ClassContext {
  classroom: Classroom;
  isTeacher: boolean;
}

interface LinkedCourse {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  status: string;
  linkedAt: string;
}

interface CourseOption {
  id: string;
  title: string;
}

const ClassCourses: React.FC = () => {
  const { classroom, isTeacher } = useOutletContext<ClassContext>();
  const toast = useToast();
  const [linked, setLinked] = useState<LinkedCourse[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const linkedRes = await classService.getLinkedCourses(classroom.id);
      setLinked(linkedRes.data || linkedRes || []);
      if (isTeacher) {
        const coursesRes = await courseApi.getTeacherCourses(0, 50);
        setTeacherCourses((coursesRes.content || []).map((c) => ({ id: c.id, title: c.title })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [classroom.id, isTeacher]);

  const handleLink = async () => {
    if (!selectedCourseId) return;
    setLinking(true);
    try {
      await classService.linkCourse(classroom.id, selectedCourseId);
      toast.success('Đã liên kết khóa học');
      setSelectedCourseId('');
      load();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Không thể liên kết'));
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (courseId: string) => {
    const ok = await toast.confirm('Gỡ liên kết khóa học này?', { title: 'Xác nhận', confirmLabel: 'Gỡ' });
    if (!ok) return;
    try {
      await classService.unlinkCourse(classroom.id, courseId);
      toast.success('Đã gỡ liên kết');
      load();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Không thể gỡ liên kết'));
    }
  };

  if (loading) return <LoadingOverlay text="Đang tải..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Khóa học liên kết</h2>
        <p className="text-gray-500 text-sm mt-1">Các khóa học được gắn với lớp {classroom.name}</p>
      </div>

      {isTeacher && (
        <div className="card flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="text-sm font-semibold text-vutruNhat block mb-1">Thêm khóa học</label>
            <Select
              value={selectedCourseId}
              onChange={(v) => setSelectedCourseId(v)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              options={[
                { value: '', label: 'Chọn khóa học...' },
                ...teacherCourses
                  .filter((c) => !linked.some((l) => l.courseId === c.id))
                  .map((c) => ({ value: c.id, label: c.title })),
              ]}
            />
          </div>
          <Button variant="primary" disabled={!selectedCourseId || linking} onClick={handleLink}>
            {linking ? 'Đang liên kết...' : 'Liên kết'}
          </Button>
        </div>
      )}

      {linked.length === 0 ? (
        <div className="card text-center py-12 text-vutruNhat">
          Chưa có khóa học nào được liên kết với lớp này.
        </div>
      ) : (
        <div className="space-y-3">
          {linked.map((course) => (
            <div key={course.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <Link to={`/courses/${course.courseId}/study`} className="text-lg font-bold text-vutru hover:text-camDam">
                  {course.title}
                </Link>
                {course.description && <p className="text-sm text-vutruNhat mt-1 line-clamp-2">{course.description}</p>}
                <p className="text-xs text-vutruNhat mt-1">
                  {course.status} · Liên kết {new Date(course.linkedAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link to={`/courses/${course.courseId}/study`} className="btn btn-chinh text-sm py-1.5">Học ngay</Link>
                {isTeacher && (
                  <button onClick={() => handleUnlink(course.courseId)} className="btn btn-phu text-sm py-1.5 text-red-600">
                    Gỡ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassCourses;
