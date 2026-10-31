import React, { useState, useEffect } from 'react';
import { useParams, Outlet, Link, useLocation } from 'react-router-dom';
import classService, { Classroom } from '../../services/class.service';
import { useAuth } from '../../context/AuthContext';
import { Video, ChevronDown, BookOpen, ArrowLeft, Settings, Users, Calendar, Flame, Sparkles, Clock } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import BackButton from '../../components/ui/BackButton';
import { compareClassesByUrgency } from '../../utils/classTaxonomy';
import { formatDeadline } from '../../utils/dateUtils';

const ClassDetailLayout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [myClasses, setMyClasses] = useState<Classroom[]>([]);
  const [isClassSelectorOpen, setClassSelectorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMeetingModalOpen, setMeetingModalOpen] = useState(false);
  const [meetingLinkInput, setMeetingLinkInput] = useState('');
  const [isTeacher, setIsTeacher] = useState(false);
  const location = useLocation();
  const { user, isTeacher: authIsTeacher, isAdmin, isTeachingAssistant, isOffice } = useAuth();

  useEffect(() => {
    if (id) {
      fetchClassDetails(id);
    }
  }, [id, user?.id, user?.role]);

  const fetchClassDetails = async (classId: string) => {
    try {
      setLoading(true);
      const [data, membersData] = await Promise.all([
        classService.getClassById(classId),
        classService.getMembers(classId).catch(() => []),
      ]);
      setClassroom(data);
      setMeetingLinkInput(data.meetingLink || '');
      
      const memberList = Array.isArray(membersData) ? membersData : (membersData as any)?.data || [];
      const currentMember = memberList.find((m: any) => m.userId === user?.id || m.user?.id === user?.id);
      const isMemberStaff = currentMember?.role === 'TEACHER' || currentMember?.role === 'TA';
      const isGlobalStaff = authIsTeacher || isAdmin || isTeachingAssistant || isOffice || user?.role === 'TEACHER' || user?.role === 'TEACHING_ASSISTANT' || user?.role === 'ADMIN' || user?.role === 'OFFICE';
      const isOwner = data.teacherId === user?.id;

      const teacherStatus = isOwner || isGlobalStaff || isMemberStaff;
      setIsTeacher(teacherStatus);

      const classesData = await classService.getMyClasses();
      const list = Array.isArray(classesData)
        ? classesData
        : classesData?.content || (classesData as any)?.data?.content || (classesData as any)?.data || [];
      const sorted = [...list].sort(compareClassesByUrgency);
      setMyClasses(sorted);
    } catch (error) {
      console.error('Error fetching class details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setClassSelectorOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return <LoadingOverlay text="Đang tải thông tin lớp học…" />;
  }

  if (!classroom) {
    return (
      <div className="text-center py-20 bg-slate-50 dark:bg-night-page min-h-screen">
        <h2 className="text-xl font-bold text-slate-800 dark:text-night-text">Không tìm thấy lớp học</h2>
        <div className="mt-4 flex justify-center">
          <BackButton to="/classes" label="Quay lại danh sách lớp" variant="ghost" />
        </div>
      </div>
    );
  }

  const handleUpdateMeetingLink = async () => {
    if (!id) return;
    try {
      await classService.updateMeetingLink(id, meetingLinkInput);
      setClassroom({ ...classroom, meetingLink: meetingLinkInput });
      setMeetingModalOpen(false);
    } catch (error) {
      console.error('Error updating meeting link:', error);
    }
  };
  
  const tabs = [
    { name: 'Bảng tin', path: `/classes/${id}` },
    { name: 'Bài tập trên lớp', path: `/classes/${id}/classwork` },
  ];

  if (isTeacher) {
    tabs.push({ name: 'Mọi người', path: `/classes/${id}/people` });
    tabs.push({ name: 'Điểm số', path: `/classes/${id}/grades` });
  }

  const currentClassItem = myClasses.find(c => c.id === classroom.id);
  const currentPendingCount = currentClassItem?.pendingCount || classroom.pendingCount || 0;

  return (
    <div className="min-h-screen bg-kem/40 dark:bg-night-page text-vutru dark:text-night-text flex flex-col">
      {/* Top Academic Navigation Bar */}
      <div className="bg-white dark:bg-night-surface border-b border-gray-200 dark:border-night-border sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            
            {/* Left: Class Switcher & Info */}
            <div className="flex items-center h-14 md:h-16 shrink-0 gap-3">
              <BackButton to="/classes" />

              <div className="relative">
                <button 
                  onClick={() => setClassSelectorOpen(!isClassSelectorOpen)}
                  aria-expanded={isClassSelectorOpen}
                  aria-haspopup="listbox"
                  aria-label="Chuyển lớp học"
                  className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-night-elevated px-2.5 py-1.5 rounded-xl transition-colors text-left focus-visible:ring-2 focus-visible:ring-cam outline-none group"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <h1 className="font-heading text-sm sm:text-base font-bold text-vutru dark:text-night-text leading-tight truncate max-w-[170px] sm:max-w-xs group-hover:text-cam transition-colors">
                        {classroom.name}
                      </h1>
                      {currentPendingCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-cam text-white shrink-0 flex items-center gap-0.5 shadow-2xs animate-pulse" title={`${currentPendingCount} bài cần làm`}>
                          <Flame size={10} />
                          {currentPendingCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-vutruNhat dark:text-night-muted truncate max-w-[200px] sm:max-w-xs">
                      <span className="font-medium">{classroom.subject || 'Lớp học'}</span>
                      {classroom.section && <span>• {classroom.section}</span>}
                    </div>
                  </div>
                  <ChevronDown size={16} className={`text-vutruNhat transition-transform duration-200 ${isClassSelectorOpen ? 'rotate-180 text-cam' : ''}`} />
                </button>
                
                {isClassSelectorOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setClassSelectorOpen(false)} />
                    <div
                      role="listbox"
                      className="absolute top-full left-0 mt-1.5 w-80 bg-white dark:bg-night-surface rounded-2xl shadow-soft border border-gray-100 dark:border-night-border z-50 overflow-hidden animate-fade-in"
                    >
                      <div className="px-3.5 py-2.5 bg-gray-50/70 dark:bg-night-elevated/50 border-b border-gray-100 dark:border-night-border text-xs font-bold text-vutruNhat dark:text-night-muted flex items-center justify-between">
                        <span>Chuyển nhanh lớp học ({myClasses.length})</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
                        {myClasses.map(cls => {
                          const isCurrent = cls.id === classroom.id;
                          const pCount = cls.pendingCount || 0;
                          const dl = cls.nearestDeadline ? formatDeadline(cls.nearestDeadline) : null;

                          return (
                            <Link 
                              key={cls.id} 
                              to={`/classes/${cls.id}`}
                              role="option"
                              aria-selected={isCurrent}
                              onClick={() => setClassSelectorOpen(false)}
                              className={`block px-3 py-2.5 rounded-xl transition-all ${
                                isCurrent
                                  ? 'bg-camNhat/30 text-camDam dark:text-cam font-bold border border-cam/25'
                                  : 'hover:bg-gray-50 dark:hover:bg-night-elevated text-vutru dark:text-night-text border border-transparent'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-xs sm:text-sm font-semibold truncate flex-1">{cls.name}</div>
                                {pCount > 0 && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 flex items-center gap-1 shadow-2xs ${
                                    dl?.isOverdue
                                      ? 'bg-rose-500 text-white'
                                      : dl?.isUrgent
                                      ? 'bg-cam text-white animate-pulse'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  }`}>
                                    <Flame size={10} />
                                    {pCount} bài
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-vutruNhat dark:text-night-muted mt-0.5">
                                <span className="truncate">{cls.subject || 'Chung'}{cls.section ? ` • ${cls.section}` : ''}</span>
                                {pCount > 0 && dl && (
                                  <span className={`text-[10px] shrink-0 font-medium ${dl.isOverdue ? 'text-rose-600 dark:text-rose-400' : dl.isUrgent ? 'text-cam font-bold' : ''}`}>
                                    {dl.label}
                                  </span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Center: Navigation Tabs */}
            <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar scroll-smooth">
              {tabs.map((tab) => {
                const isActive = location.pathname === tab.path;
                const isClassworkTab = tab.name === 'Bài tập trên lớp';
                return (
                  <Link
                    key={tab.name}
                    to={tab.path}
                    className={`inline-flex items-center px-4 py-2 border-b-2 font-heading text-sm font-bold h-12 md:h-16 transition-all whitespace-nowrap gap-1.5 ${
                      isActive
                        ? 'border-cam text-cam dark:border-cam dark:text-cam'
                        : 'border-transparent text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text hover:border-gray-200'
                    }`}
                  >
                    <span>{tab.name}</span>
                    {isClassworkTab && currentPendingCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-cam text-white shadow-2xs">
                        {currentPendingCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            
            {/* Right: Meeting Link & Actions */}
            <div className="flex items-center shrink-0 gap-2 pb-2 md:pb-0">
              {classroom.meetingLink && (
                <a 
                  href={classroom.meetingLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-chinh text-xs px-3.5 py-1.5 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Video size={14} />
                  <span>Phòng học online</span>
                </a>
              )}
              {isTeacher && (
                <button 
                  onClick={() => setMeetingModalOpen(true)}
                  className="text-vutruNhat hover:text-cam dark:hover:text-night-text p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-night-elevated transition-colors shrink-0"
                  title="Cài đặt phòng học"
                  aria-label="Cài đặt phòng học"
                >
                  <Settings size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Outlet context={{ classroom, isTeacher }} />
      </div>

      {/* Meeting Link Config Modal */}
      <Modal
        isOpen={isMeetingModalOpen}
        onClose={() => setMeetingModalOpen(false)}
        title="Cài đặt phòng học trực tuyến"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-vutru dark:text-night-text mb-1.5">
              Đường dẫn phòng học (Google Meet / Zoom / MS Teams)
            </label>
            <Input
              value={meetingLinkInput}
              onChange={(e) => setMeetingLinkInput(e.target.value)}
              placeholder="https://meet.google.com/..."
            />
            <p className="text-[11px] text-vutruNhat dark:text-night-muted mt-1">
              Học viên sẽ thấy nút truy cập nhanh vào phòng học này ở thanh điều hướng trên cùng.
            </p>
          </div>
          <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-night-border">
            <Button variant="outline" onClick={() => setMeetingModalOpen(false)}>Hủy</Button>
            <Button variant="primary" onClick={handleUpdateMeetingLink}>Lưu cấu hình</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClassDetailLayout;
