import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import classService, { Classroom, ClassMember } from '../../services/class.service';
import { useToast } from '../../context/ToastContext';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import AddMemberModal from './AddMemberModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import UserAvatar from '../../components/common/UserAvatar';
import { formatLastActiveStatus } from '../../utils/dateUtils';
import StudentActivityReportModal from './StudentActivityReportModal';
import * as XLSX from 'xlsx';
import {
  Users,
  UserPlus,
  Search,
  X,
  Shield,
  GraduationCap,
  Sparkles,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  Calendar,
  CheckCircle2,
  Activity,
  AlertTriangle,
  BarChart3,
  FileSpreadsheet,
  Download,
} from 'lucide-react';

interface ClassContext {
  classroom: Classroom;
  isTeacher: boolean;
}

type RoleFilter = 'ALL' | 'TEACHER' | 'TA' | 'STUDENT';

const ClassPeople: React.FC = () => {
  const { classroom, isTeacher } = useOutletContext<ClassContext>();
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');

  // Activity Report & Filter state
  const [isActivityReportOpen, setIsActivityReportOpen] = useState(false);
  const [studentActivityFilter, setStudentActivityFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Deletion state
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  useEffect(() => {
    fetchMembers();
  }, [classroom.id]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await classService.getMembers(classroom.id);
      setMembers(data);
    } catch (error) {
      toast.error('Không thể tải danh sách thành viên');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      await classService.removeMember(classroom.id, memberToDelete.id);
      toast.success(`Đã xóa thành viên ${memberToDelete.name} khỏi lớp`);
      setMembers((prev) => prev.filter((m) => m.userId !== memberToDelete.id));
      setMemberToDelete(null);
    } catch (error) {
      toast.error('Lỗi khi xóa thành viên khỏi lớp');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateRole = async (studentId: string, studentName: string, newRole: 'TA' | 'STUDENT') => {
    try {
      await classService.updateMemberRole(classroom.id, studentId, newRole);
      toast.success(
        newRole === 'TA'
          ? `Đã thăng cấp ${studentName} làm Trợ giảng (TA)!`
          : `Đã hủy vai trò Trợ giảng của ${studentName}`
      );
      setMembers((prev) =>
        prev.map((m) => (m.userId === studentId ? { ...m, role: newRole } : m))
      );
    } catch (error) {
      toast.error('Lỗi khi cập nhật vai trò');
    }
  };

  const teachers = members.filter((m) => m.role === 'TEACHER');
  const tas = members.filter((m) => m.role === 'TA');
  const students = members.filter((m) => m.role === 'STUDENT');

  const { activeStudentCount, inactiveStudentCount } = useMemo(() => {
    let active = 0;
    let inactive = 0;
    students.forEach((s) => {
      const st = formatLastActiveStatus(s.lastActiveAt);
      if (!s.lastActiveAt || st.isAtRisk || st.status === 'INACTIVE') {
        inactive++;
      } else {
        active++;
      }
    });
    return { activeStudentCount: active, inactiveStudentCount: inactive };
  }, [students]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchQuery =
        !searchQuery.trim() ||
        m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchRole = roleFilter === 'ALL' || m.role === roleFilter;

      return matchQuery && matchRole;
    });
  }, [members, searchQuery, roleFilter]);

  const displayedStudents = useMemo(() => {
    return filteredMembers
      .filter((m) => m.role === 'STUDENT')
      .filter((student) => {
        if (studentActivityFilter === 'ALL') return true;
        const st = formatLastActiveStatus(student.lastActiveAt);
        const isInactive = !student.lastActiveAt || st.isAtRisk || st.status === 'INACTIVE';
        if (studentActivityFilter === 'ACTIVE') return !isInactive;
        if (studentActivityFilter === 'INACTIVE') return isInactive;
        return true;
      });
  }, [filteredMembers, studentActivityFilter]);

  if (!isTeacher) {
    return <Navigate to={`/classes/${classroom.id}`} replace />;
  }

  if (loading) {
    return <LoadingOverlay text="Đang tải danh sách thành viên..." />;
  }

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-3 sm:px-6 space-y-8 animate-fade-in text-vutru dark:text-night-text">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-night-border">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-vutru dark:text-night-text flex items-center gap-2.5">
            <Users className="text-cam" size={28} />
            <span>Thành viên lớp học</span>
          </h1>
          <p className="text-xs sm:text-sm text-vutruNhat dark:text-night-muted mt-1">
            Quản lý danh sách giáo viên, trợ giảng và học sinh trong lớp {classroom.name}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsActivityReportOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-night-surface hover:bg-gray-50 dark:hover:bg-night-elevated text-vutru dark:text-night-text border border-gray-200 dark:border-night-border rounded-xl font-bold text-xs sm:text-sm shadow-2xs transition-all shrink-0 active:scale-95"
          >
            <BarChart3 size={16} className="text-cam" />
            <span>Báo cáo hoạt động</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-cam hover:bg-camDam text-white rounded-xl font-bold text-xs sm:text-sm shadow-soft transition-all shrink-0 active:scale-95"
          >
            <UserPlus size={16} />
            <span>Thêm thành viên</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-night-surface border border-gray-100 dark:border-night-border shadow-soft flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted">Tổng thành viên</p>
            <p className="text-xl font-heading font-extrabold text-vutru dark:text-night-text mt-0.5">{members.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-night-surface border border-gray-100 dark:border-night-border shadow-soft flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Shield size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted">Ban giảng dạy</p>
            <p className="text-xl font-heading font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">
              {teachers.length + tas.length} <span className="text-xs font-normal text-vutruNhat dark:text-night-muted">({teachers.length} GV, {tas.length} TA)</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-night-surface border border-gray-100 dark:border-night-border shadow-soft flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-camNhat/50 dark:bg-cam/20 text-cam flex items-center justify-center shrink-0">
            <GraduationCap size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted">Học sinh trong lớp</p>
            <p className="text-xl font-heading font-extrabold text-cam mt-0.5">{students.length} học sinh</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-night-surface p-3 sm:p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vutruNhat dark:text-night-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm thành viên theo tên hoặc email..."
            className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-cam focus:ring-2 focus:ring-cam/20 transition-all text-vutru dark:text-night-text"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-vutruNhat hover:text-vutru dark:hover:text-night-text rounded-full hover:bg-gray-200 dark:hover:bg-night-border transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          {[
            { key: 'ALL' as const, label: `Tất cả (${members.length})` },
            { key: 'TEACHER' as const, label: `Giáo viên (${teachers.length})` },
            { key: 'TA' as const, label: `Trợ giảng (${tas.length})` },
            { key: 'STUDENT' as const, label: `Học sinh (${students.length})` },
          ].map((pill) => (
            <button
              key={pill.key}
              onClick={() => setRoleFilter(pill.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                roleFilter === pill.key
                  ? 'bg-cam text-white shadow-soft font-extrabold'
                  : 'bg-gray-100 dark:bg-night-elevated text-vutru dark:text-night-text hover:bg-gray-200 dark:hover:bg-night-border'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Teachers Section */}
      {(roleFilter === 'ALL' || roleFilter === 'TEACHER') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-cam/30 dark:border-cam/20">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-vutru dark:text-night-text flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cam"></span>
              <span>Giáo viên</span>
              <span className="text-xs font-bold text-camDam dark:text-cam px-2 py-0.5 rounded-full bg-camNhat/60 dark:bg-cam/20 ml-1">
                {teachers.length}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex items-center justify-between p-3.5 sm:p-4 bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border hover:border-cam/30 transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <UserAvatar
                    fullName={teacher.fullName}
                    avatarUrl={teacher.avatarUrl}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-sm sm:text-base text-vutru dark:text-night-text truncate">
                      {teacher.fullName}
                    </p>
                    {teacher.email && (
                      <p className="text-xs text-vutruNhat dark:text-night-muted truncate flex items-center gap-1 mt-0.5">
                        <Mail size={12} className="shrink-0" />
                        <span>{teacher.email}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1 bg-cam/15 dark:bg-cam/20 text-camDam dark:text-cam border border-cam/30 rounded-full text-xs font-bold flex items-center gap-1">
                    <Sparkles size={12} />
                    <span>Giáo viên chính</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAs Section */}
      {(roleFilter === 'ALL' || roleFilter === 'TA') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-purple-500/30 dark:border-purple-500/20">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-vutru dark:text-night-text flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span>Trợ giảng (TA)</span>
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 ml-1">
                {tas.length}
              </span>
            </h2>
          </div>

          {tas.length === 0 ? (
            <div className="p-6 text-center bg-white dark:bg-night-surface rounded-2xl border border-dashed border-gray-200 dark:border-night-border text-vutruNhat dark:text-night-muted text-xs sm:text-sm font-medium">
              Chưa có trợ giảng nào trong lớp. Bạn có thể thăng cấp học sinh thành trợ giảng hoặc thêm trợ giảng bằng email.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {tas.map((ta) => {
                const activeStatus = formatLastActiveStatus(ta.lastActiveAt);
                return (
                  <div
                    key={ta.id}
                    className="flex items-center justify-between p-3.5 sm:p-4 bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border hover:border-purple-300 dark:hover:border-purple-800/60 transition-all shadow-2xs group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        <UserAvatar
                          fullName={ta.fullName}
                          avatarUrl={ta.avatarUrl}
                          size="md"
                        />
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-night-surface ${activeStatus.dotClass}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-vutru dark:text-night-text truncate">
                          {ta.fullName}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          {ta.email && (
                            <p className="text-xs text-vutruNhat dark:text-night-muted truncate flex items-center gap-1">
                              <Mail size={12} className="shrink-0" />
                              <span>{ta.email}</span>
                            </p>
                          )}
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-vutruNhat dark:text-night-muted">
                            <span>•</span>
                            <span>{activeStatus.label}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-flex px-2.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold border border-purple-200 dark:border-purple-800/40">
                        Trợ giảng
                      </span>

                      {isTeacher && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateRole(ta.userId, ta.fullName, 'STUDENT')}
                            className="px-2.5 py-1 text-xs font-bold text-vutruNhat hover:text-vutru dark:text-night-muted dark:hover:text-night-text bg-gray-100 hover:bg-gray-200 dark:bg-night-elevated dark:hover:bg-night-border rounded-lg transition-colors flex items-center gap-1"
                            title="Hạ cấp xuống học sinh"
                          >
                            <ArrowDownRight size={13} />
                            <span className="hidden md:inline">Hạ xuống học sinh</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMemberToDelete({ id: ta.userId, name: ta.fullName })}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                            title="Xóa khỏi lớp"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Students Section */}
      {(roleFilter === 'ALL' || roleFilter === 'STUDENT') && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b-2 border-blue-500/30 dark:border-blue-500/20">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading text-lg sm:text-xl font-bold text-vutru dark:text-night-text flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Học sinh</span>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 ml-1">
                  {students.length}
                </span>
              </h2>

              {/* Activity Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-night-elevated rounded-xl text-xs font-bold ml-1 sm:ml-2 overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setStudentActivityFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                    studentActivityFilter === 'ALL'
                      ? 'bg-white dark:bg-night-surface text-vutru dark:text-night-text shadow-2xs'
                      : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
                  }`}
                >
                  Tất cả ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStudentActivityFilter('ACTIVE')}
                  className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                    studentActivityFilter === 'ACTIVE'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                      : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
                  }`}
                >
                  Đang hoạt động ({activeStudentCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStudentActivityFilter('INACTIVE')}
                  className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
                    studentActivityFilter === 'INACTIVE'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-2xs'
                      : 'text-rose-600/80 hover:text-rose-700'
                  }`}
                >
                  <AlertTriangle size={11} />
                  <span>Không hoạt động ({inactiveStudentCount})</span>
                </button>
              </div>
            </div>

            {/* Direct Quick Export / Report */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsActivityReportOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-night-elevated dark:hover:bg-night-border text-vutru dark:text-night-text border border-gray-200 dark:border-night-border text-xs font-bold transition-all shadow-2xs active:scale-95"
                title="Xem chi tiết báo cáo và xuất Excel"
              >
                <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Báo cáo &amp; Xuất Excel</span>
              </button>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-night-surface rounded-2xl border border-dashed border-gray-200 dark:border-night-border text-vutruNhat dark:text-night-muted text-sm font-medium space-y-2">
              <GraduationCap size={32} className="mx-auto text-vutruNhat dark:text-night-muted opacity-60" />
              <p>Chưa có học sinh nào tham gia lớp học.</p>
              <p className="text-xs">
                Chia sẻ mã mời <strong className="font-mono text-cam font-bold">{classroom.inviteCode}</strong> cho học sinh để các bạn tham gia.
              </p>
            </div>
          ) : displayedStudents.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-night-surface rounded-2xl border border-dashed border-gray-200 dark:border-night-border text-vutruNhat dark:text-night-muted text-xs sm:text-sm font-medium">
              Không có học sinh nào phù hợp bộ lọc hoạt động này.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {displayedStudents.map((student) => {
                const activeStatus = formatLastActiveStatus(student.lastActiveAt);
                return (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3.5 sm:p-4 bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border hover:border-blue-300 dark:hover:border-blue-800/60 transition-all shadow-2xs group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative shrink-0">
                          <UserAvatar
                            fullName={student.fullName}
                            avatarUrl={student.avatarUrl}
                            size="md"
                          />
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-night-surface ${activeStatus.dotClass}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm sm:text-base text-vutru dark:text-night-text truncate">
                            {student.fullName}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            {student.email && (
                              <p className="text-xs text-vutruNhat dark:text-night-muted truncate flex items-center gap-1">
                                <Mail size={12} className="shrink-0" />
                                <span>{student.email}</span>
                              </p>
                            )}
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${activeStatus.badgeClass}`}>
                              <span>{activeStatus.label}</span>
                            </span>
                            {activeStatus.isAtRisk && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 animate-pulse">
                                <AlertTriangle size={10} />
                                <span>Cần nhắc nhở</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isTeacher && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setMemberToDelete({ id: student.userId, name: student.fullName })}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                            title="Xóa học sinh khỏi lớp"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Student Activity Report Modal */}
      <StudentActivityReportModal
        classroom={classroom}
        students={students}
        isOpen={isActivityReportOpen}
        onClose={() => setIsActivityReportOpen(false)}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        classId={classroom.id}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchMembers}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleConfirmRemove}
        title="Xóa thành viên khỏi lớp"
        message={
          memberToDelete
            ? `Bạn có chắc chắn muốn xóa thành viên "${memberToDelete.name}" khỏi lớp học này không? Hành động này sẽ hủy quyền truy cập bài giảng và bài tập của học viên.`
            : ''
        }
        confirmText="Xóa thành viên"
        cancelText="Hủy"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ClassPeople;
