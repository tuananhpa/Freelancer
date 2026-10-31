import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DropResult } from '@hello-pangea/dnd';
import { BookOpen } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi, Course, Lesson, Section } from '../../services/courseApi';
import Card from '../../components/ui/Card';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PromptDialog from '../../components/ui/PromptDialog';
import Breadcrumb from '../../components/ui/Breadcrumb';

import LessonEditorModal from './editor/LessonEditorModal';
import OverviewTab from './editor/OverviewTab';
import CurriculumTab from './editor/CurriculumTab';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import { useToast } from '../../context/ToastContext';
import { getApiErrorMessage } from '../../services/api';


const CourseEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum'>('overview');
  const [course, setCourse] = useState<Course | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Dialog States
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [promptConfig, setPromptConfig] = useState<{ isOpen: boolean; type: 'section' | 'lesson'; title: string; secId?: string; } | null>(null);

  // React Query for Fetching
  const { data: fetchedCourse, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const data = await courseApi.getCourseById(id!);
      if (data.sections) {
        data.sections.sort((a: Section, b: Section) => (a.orderIndex || 0) - (b.orderIndex || 0));
        data.sections.forEach((s: Section) => {
          if (s.lessons) {
            s.lessons.sort((a: Lesson, b: Lesson) => (a.orderIndex || 0) - (b.orderIndex || 0));
          }
        });
      }
      return data;
    },
    enabled: !!id,
  });

  // Sync to local state for editing
  useEffect(() => {
    // /courses/create la duong tinh, khong co :id trong route nen useParams
    // luon tra ve undefined - truoc day so sanh id === 'create' khong bao gio
    // dung, "course" khong duoc khoi tao va trang dung mai o man hinh "Dang tai...".
    if (!id) {
      setCourse({
        id: 'draft',
        title: '',
        description: '',
        status: 'DRAFT',
        thumbnailUrl: '',
        sections: []
      } as Course);
    } else if (fetchedCourse) {
      setCourse(fetchedCourse);
    }
  }, [id, fetchedCourse]);

  // Mutations
  const createCourseMut = useMutation({
    mutationFn: (newCourse: any) => courseApi.createCourse(newCourse),
    onSuccess: (data) => {
      queryClient.setQueryData(['course', data.id], data);
      toast.success('Đã tạo khóa học');
      navigate(`/courses/${data.id}/edit`, { replace: true });
    },
    // Loi API thuc su da co toast tu dong o interceptor cua axios, nhung loi
    // mang (mat ket noi, timeout) khong co response nen bi bo qua o do - vá o day.
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không tạo được khóa học')),
  });

  const updateCourseMut = useMutation({
    mutationFn: (data: { id: string, payload: any }) => courseApi.updateCourse(data.id, data.payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.id] });
      // Truoc day khong co dong nay: luu thanh cong nhung khong co gi thay
      // doi tren man hinh, nguoi dung tuong nhu bam khong an thua gi.
      toast.success('Đã lưu thông tin khóa học');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không lưu được thông tin khóa học')),
  });

  const handleSaveOverview = async (updatedCourse: Course) => {
    // Loi da duoc bao qua onError cua tung mutation; bat o day chi de khong
    // bien thanh unhandled rejection va lam vo tinh trang loading cua nut Luu.
    try {
      if (!id || updatedCourse.id === 'draft') {
        await createCourseMut.mutateAsync({
          title: updatedCourse.title,
          description: updatedCourse.description,
          thumbnailUrl: updatedCourse.thumbnailUrl,
          status: 'PUBLISHED'
        });
      } else {
        await updateCourseMut.mutateAsync({
          id: updatedCourse.id,
          payload: {
            title: updatedCourse.title,
            description: updatedCourse.description,
            thumbnailUrl: updatedCourse.thumbnailUrl
          }
        });
      }
    } catch {
      // toast da hien qua onError cua mutation
    }
  };

  // Curriculum Mutations
  const addSectionMut = useMutation({
    mutationFn: (title: string) => courseApi.addSection(course!.id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      toast.success('Đã thêm phần học');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thêm được phần học')),
  });

  const deleteSectionMut = useMutation({
    mutationFn: (secId: string) => courseApi.deleteSection(secId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      toast.success('Đã xóa phần học');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không xóa được phần học')),
  });

  const addLessonMut = useMutation({
    mutationFn: ({ secId, title }: { secId: string, title: string }) => courseApi.addLesson(secId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      toast.success('Đã thêm bài học');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thêm được bài học')),
  });

  const updateLessonMut = useMutation({
    mutationFn: ({ lessonId, payload }: { lessonId: string, payload: any }) => courseApi.updateLesson(lessonId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      toast.success('Đã lưu bài học');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không lưu được bài học')),
  });

  const submitAddSection = async (title: string) => {
    // Dong modal du thanh cong hay that bai - truoc day loi se lam await nem
    // ra ngoai, dong lenh sau khong chay, modal dung im khong co dau hieu gi.
    try {
      await addSectionMut.mutateAsync(title);
    } finally {
      setPromptConfig(null);
    }
  };

  const submitAddLesson = async (title: string) => {
    try {
      if (promptConfig?.secId) {
        await addLessonMut.mutateAsync({ secId: promptConfig.secId, title });
      }
    } finally {
      setPromptConfig(null);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!course) return;
    const { destination, source, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newCourse = { ...course };
    const sections = Array.from(newCourse.sections || []);

    if (type === 'section') {
      const [moved] = sections.splice(source.index, 1);
      sections.splice(destination.index, 0, moved);
      newCourse.sections = sections;
      setCourse(newCourse);
      
      try {
        const updatePromises = sections.map((section, i) => {
          if (section.orderIndex !== i) {
            section.orderIndex = i;
            return courseApi.updateSection(section.id, section.title, i);
          }
          return Promise.resolve();
        });
        await Promise.all(updatePromises);
      } catch (err) { console.error(err); }
      
    } else if (type === 'lesson') {
      const sourceSecIndex = sections.findIndex(s => s.id === source.droppableId);
      const destSecIndex = sections.findIndex(s => s.id === destination.droppableId);
      
      const sourceLessons = Array.from(sections[sourceSecIndex].lessons || []);
      const destLessons = source.droppableId === destination.droppableId 
        ? sourceLessons 
        : Array.from(sections[destSecIndex].lessons || []);

      const [moved] = sourceLessons.splice(source.index, 1);
      destLessons.splice(destination.index, 0, moved);

      sections[sourceSecIndex].lessons = sourceLessons;
      if (source.droppableId !== destination.droppableId) {
        sections[destSecIndex].lessons = destLessons;
      }
      
      newCourse.sections = sections;
      setCourse(newCourse);

      try {
        if (source.droppableId !== destination.droppableId) {
           await courseApi.updateLesson(moved.id, { 
             section: { id: destination.droppableId }, 
             orderIndex: destination.index 
           } as Partial<Lesson>);
        } else {
           await courseApi.updateLesson(moved.id, { orderIndex: destination.index });
        }
      } catch (err) { console.error(err); }
    }
  };

  if (isLoading || !course) return <LoadingOverlay text="Đang tải..." />;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <Breadcrumb items={[
        { label: 'Khóa học', href: '/courses' },
        { label: course.id === 'draft' ? 'Tạo khóa học mới' : 'Chỉnh sửa khóa học' }
      ]} />
      {/* Header */}
      <Card padding="md" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cam/10 flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-cam" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-vutru font-heading">
              {course.id === 'draft' ? 'Tạo khóa học mới' : 'Quản lý khóa học'}
            </h1>
            <p className="text-vutruNhat text-sm font-medium">Xây dựng chương trình giảng dạy của bạn</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-2.5 rounded-full font-bold transition-all ${activeTab === 'overview' ? 'bg-vutru text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Tổng quan
          </button>
          <button 
            onClick={() => setActiveTab('curriculum')}
            className={`px-6 py-2.5 rounded-full font-bold transition-all ${activeTab === 'curriculum' ? 'bg-cam text-white shadow-lg shadow-cam/30' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Chương trình
          </button>
        </div>
      </Card>

      {/* Tabs Content */}
      <Card padding="lg">
        {activeTab === 'overview' && (
          <OverviewTab 
            course={course} 
            onChange={setCourse} 
            onSave={handleSaveOverview} 
            isSaving={createCourseMut.isPending || updateCourseMut.isPending} 
          />
        )}

        {activeTab === 'curriculum' && (
          <CurriculumTab 
            course={course}
            onDragEnd={handleDragEnd}
            onAddSection={() => setPromptConfig({ isOpen: true, type: 'section', title: 'Thêm Phần mới' })}
            onDeleteSection={(secId) => setSectionToDelete(secId)}
            onAddLesson={(secId) => setPromptConfig({ isOpen: true, type: 'lesson', title: 'Thêm Bài học mới', secId })}
            onEditLesson={(lesson) => setEditingLesson(lesson)}
            onGoToOverview={() => setActiveTab('overview')}
          />
        )}
      </Card>

      {/* LESSON EDITOR MODAL */}
      {editingLesson && (
        <LessonEditorModal 
          lesson={editingLesson}
          onClose={() => setEditingLesson(null)}
          onSave={async (data) => {
             await updateLessonMut.mutateAsync({ lessonId: editingLesson.id, payload: data });
             setEditingLesson(null);
          }}
        />
      )}

      {/* CONFIRM DELETE SECTION DIALOG */}
      <ConfirmDialog
        isOpen={!!sectionToDelete}
        onClose={() => setSectionToDelete(null)}
        onConfirm={async () => {
          if (sectionToDelete) {
            await deleteSectionMut.mutateAsync(sectionToDelete);
            setSectionToDelete(null);
          }
        }}
        title="Xóa Phần học"
        message="Bạn có chắc chắn muốn xóa phần học này cùng với toàn bộ bài học bên trong không? Hành động này không thể hoàn tác."
        confirmText="Xóa phần học"
        isDestructive={true}
      />

      {/* PROMPT ADD SECTION/LESSON DIALOG */}
      <PromptDialog
        isOpen={!!promptConfig}
        onClose={() => setPromptConfig(null)}
        onSubmit={(value) => {
          if (promptConfig?.type === 'section') {
            submitAddSection(value);
          } else if (promptConfig?.type === 'lesson') {
            submitAddLesson(value);
          }
        }}
        title={promptConfig?.title || ''}
        placeholder="Nhập tên..."
        submitText="Lưu"
        isLoading={
          promptConfig?.type === 'section' ? addSectionMut.isPending : addLessonMut.isPending
        }
      />
    </div>
  );
};

export default CourseEditor;
