import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import classService, { Classroom, GradebookResponse } from '../../services/class.service';
import { useToast } from '../../context/ToastContext';
import * as XLSX from 'xlsx';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import Select from '../../components/ui/Select';
import ClassMonthlyReportModal from './ClassMonthlyReportModal';
import UserAvatar from '../../components/common/UserAvatar';
import { formatScore } from '../../utils/formatUtils';
import {
  Award,
  Download,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  PenTool,
  Users,
  ArrowUpDown,
  Filter,
  ExternalLink,
  BarChart3,
} from 'lucide-react';

interface ClassContext {
  classroom: Classroom;
  isTeacher: boolean;
}

type SortOption = 'NAME_ASC' | 'NAME_DESC' | 'SCORE_DESC' | 'SCORE_ASC';
type TypeFilter = 'ALL' | 'EXAM' | 'ASSIGNMENT';

const ClassGradebook: React.FC = () => {
  const { classroom, isTeacher } = useOutletContext<ClassContext>();
  const [gradebook, setGradebook] = useState<GradebookResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('NAME_ASC');
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!isTeacher) return;
    fetchGradebook();
  }, [classroom.id, isTeacher]);

  const fetchGradebook = async () => {
    try {
      setLoading(true);
      const data = await classService.getGradebook(classroom.id);
      setGradebook(data);
    } catch (error) {
      toast.error('Không thể tải sổ điểm lớp học');
    } finally {
      setLoading(false);
    }
  };

  // Helper: Calculate average score for a student (normalized to scale 10)
  const calculateStudentAvg = (student: GradebookResponse['students'][0], classworks: GradebookResponse['classworks']) => {
    let totalNormalized = 0;
    let count = 0;

    classworks.forEach((cw) => {
      const sub = student.grades[cw.id];
      if (sub && sub.status === 'GRADED' && typeof sub.score === 'number') {
        const max = cw.maxScore > 0 ? cw.maxScore : 10;
        const normalized = (sub.score / max) * 10;
        totalNormalized += normalized;
        count++;
      }
    });

    if (count === 0) return null;
    return Number((totalNormalized / count).toFixed(1));
  };

  // Helper: Get classification label and styling based on 10-point scale
  const getScoreClassification = (score: number | null) => {
    if (score === null) return { label: 'Chưa có điểm', class: 'bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted' };
    if (score >= 8.5) return { label: 'Giỏi', class: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40' };
    if (score >= 6.5) return { label: 'Khá', class: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/40' };
    if (score >= 5.0) return { label: 'Trung bình', class: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/40' };
    return { label: 'Cần cố gắng', class: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40' };
  };

  // Class Overview Metrics
  const classMetrics = useMemo(() => {
    if (!gradebook || gradebook.students.length === 0 || gradebook.classworks.length === 0) {
      return { classAvg: null, submissionRate: 0, pendingGradingCount: 0, totalClassworks: 0 };
    }

    let totalAvgSum = 0;
    let studentsWithGrades = 0;
    let totalAssignmentsTurnedIn = 0;
    let totalSlots = gradebook.students.length * gradebook.classworks.length;
    let pendingGradingCount = 0;

    gradebook.students.forEach((student) => {
      const avg = calculateStudentAvg(student, gradebook.classworks);
      if (avg !== null) {
        totalAvgSum += avg;
        studentsWithGrades++;
      }

      gradebook.classworks.forEach((cw) => {
        const sub = student.grades[cw.id];
        if (sub) {
          if (sub.status === 'TURNED_IN' || sub.status === 'GRADED') {
            totalAssignmentsTurnedIn++;
          }
          if (sub.status === 'TURNED_IN') {
            pendingGradingCount++;
          }
        }
      });
    });

    const classAvg = studentsWithGrades > 0 ? Number((totalAvgSum / studentsWithGrades).toFixed(1)) : null;
    const submissionRate = totalSlots > 0 ? Math.round((totalAssignmentsTurnedIn / totalSlots) * 100) : 0;

    return {
      classAvg,
      submissionRate,
      pendingGradingCount,
      totalClassworks: gradebook.classworks.length,
    };
  }, [gradebook]);

  // Filtered Classworks (by type)
  const filteredClassworks = useMemo(() => {
    if (!gradebook) return [];
    if (typeFilter === 'EXAM') return gradebook.classworks.filter((cw) => cw.type === 'EXAM');
    if (typeFilter === 'ASSIGNMENT') return gradebook.classworks.filter((cw) => cw.type === 'ASSIGNMENT');
    return gradebook.classworks;
  }, [gradebook, typeFilter]);

  // Filtered and Sorted Students
  const processedStudents = useMemo(() => {
    if (!gradebook) return [];
    let list = [...gradebook.students];

    // Search by student name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => s.studentName.toLowerCase().includes(q));
    }

    // Sorting
    list.sort((a, b) => {
      if (sortOption === 'NAME_ASC') return a.studentName.localeCompare(b.studentName, 'vi');
      if (sortOption === 'NAME_DESC') return b.studentName.localeCompare(a.studentName, 'vi');
      const avgA = calculateStudentAvg(a, gradebook.classworks) ?? -1;
      const avgB = calculateStudentAvg(b, gradebook.classworks) ?? -1;
      if (sortOption === 'SCORE_DESC') return avgB - avgA;
      if (sortOption === 'SCORE_ASC') return avgA - avgB;
      return 0;
    });

    return list;
  }, [gradebook, searchQuery, sortOption]);

  const handleExportExcel = () => {
    if (!gradebook || gradebook.students.length === 0) {
      toast.info('Không có dữ liệu để xuất');
      return;
    }

    const exportData = gradebook.students.map((student, idx) => {
      const avg = calculateStudentAvg(student, gradebook.classworks);
      const row: any = {
        'STT': idx + 1,
        'Họ và Tên': student.studentName,
        'Điểm Trung Bình (Hệ 10)': avg !== null ? formatScore(avg) : 'Chưa có',
        'Xếp Loại': getScoreClassification(avg).label,
      };

      gradebook.classworks.forEach((cw) => {
        const sub = student.grades[cw.id];
        let statusText = '-';
        if (sub) {
          if (sub.status === 'ASSIGNED') statusText = 'Chưa nộp';
          else if (sub.status === 'MISSING') statusText = 'Thiếu bài';
          else if (sub.status === 'TURNED_IN') statusText = 'Chờ chấm';
          else if (sub.status === 'GRADED') statusText = `${formatScore(sub.score)} / ${formatScore(cw.maxScore)}`;
        }
        row[`${cw.title} (${cw.type === 'EXAM' ? 'Trắc nghiệm' : 'Tự luận'})`] = statusText;
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sổ Điểm');

    const max_width = gradebook.students.reduce((w, r) => Math.max(w, r.studentName.length), 22);
    worksheet['!cols'] = [{ wch: 6 }, { wch: max_width }, { wch: 22 }, { wch: 15 }];

    XLSX.writeFile(workbook, `So_Diem_${classroom.name.replace(/\s+/g, '_')}.xlsx`);
    toast.success('Đã xuất tệp Excel sổ điểm thành công');
  };

  if (!isTeacher) {
    return (
      <div className="text-center py-16 bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border p-8">
        <AlertCircle size={36} className="mx-auto mb-2 text-rose-500" />
        <h3 className="font-heading text-lg font-bold text-vutru dark:text-night-text">Quyền truy cập bị giới hạn</h3>
        <p className="text-xs text-vutruNhat dark:text-night-muted mt-1">Chỉ giáo viên phụ trách lớp học mới có quyền xem sổ điểm tổng hợp.</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingOverlay text="Đang đồng bộ dữ liệu sổ điểm..." />;
  }

  if (!gradebook) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── 1. Academic Performance Summary ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-vutruNhat uppercase tracking-wider">Điểm TB Lớp</span>
            <TrendingUp size={16} className="text-cam" />
          </div>
          <div className="font-heading text-2xl font-bold text-vutru dark:text-night-text mt-1">
            {classMetrics.classAvg !== null ? (
              <span className="text-cam">{classMetrics.classAvg}<span className="text-xs text-vutruNhat font-normal">/10</span></span>
            ) : (
              <span className="text-sm font-normal text-vutruNhat">Chưa có</span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-vutruNhat uppercase tracking-wider">Tỉ lệ nộp bài</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="font-heading text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {classMetrics.submissionRate}%
          </div>
        </div>

        <div className="bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-vutruNhat uppercase tracking-wider">Chờ chấm điểm</span>
            <Clock size={16} className="text-blue-500" />
          </div>
          <div className="font-heading text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {classMetrics.pendingGradingCount} bài
          </div>
        </div>

        <div className="bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-vutruNhat uppercase tracking-wider">Tổng cột điểm</span>
            <Award size={16} className="text-purple-500" />
          </div>
          <div className="font-heading text-2xl font-bold text-vutru dark:text-night-text mt-1">
            {classMetrics.totalClassworks} bài
          </div>
        </div>
      </div>

      {/* ── 2. Filter & Actions Toolbar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search by Name */}
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-xs focus:outline-none focus:border-cam transition-colors"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center p-0.5 bg-gray-100 dark:bg-night-elevated rounded-xl border border-gray-200 dark:border-night-border text-xs">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${typeFilter === 'ALL' ? 'bg-white dark:bg-night-surface text-cam shadow-soft' : 'text-vutruNhat hover:text-vutru'}`}
            >
              Tất cả ({gradebook.classworks.length})
            </button>
            <button
              onClick={() => setTypeFilter('EXAM')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${typeFilter === 'EXAM' ? 'bg-white dark:bg-night-surface text-cam shadow-soft' : 'text-vutruNhat hover:text-vutru'}`}
            >
              Đề thi ({gradebook.classworks.filter(c => c.type === 'EXAM').length})
            </button>
            <button
              onClick={() => setTypeFilter('ASSIGNMENT')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${typeFilter === 'ASSIGNMENT' ? 'bg-white dark:bg-night-surface text-cam shadow-soft' : 'text-vutruNhat hover:text-vutru'}`}
            >
              Tự luận ({gradebook.classworks.filter(c => c.type === 'ASSIGNMENT').length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Sorting */}
          <div className="relative">
            <Select
              value={sortOption}
              onChange={(v) => setSortOption(v as SortOption)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-xs font-semibold text-vutru dark:text-night-text focus:outline-none focus:border-cam transition-all cursor-pointer"
              options={[
                { value: 'NAME_ASC', label: 'Tên học sinh (A → Z)' },
                { value: 'NAME_DESC', label: 'Tên học sinh (Z → A)' },
                { value: 'SCORE_DESC', label: 'Điểm TB (Cao nhất)' },
                { value: 'SCORE_ASC', label: 'Điểm TB (Thấp nhất)' },
              ]}
            />
          </div>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-night-border bg-gray-50 dark:bg-night-elevated hover:bg-gray-100 text-vutru dark:text-night-text text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            title="Xuất bảng điểm toàn bộ"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Xuất Sổ Điểm</span>
          </button>

          {/* Monthly Report Button */}
          <button
            onClick={() => setIsMonthlyModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cam to-camDam hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-cam/20"
            title="Xuất báo cáo tiến độ và kết quả theo từng tháng"
          >
            <BarChart3 size={14} />
            <span>Báo Cáo Tháng</span>
          </button>
        </div>
      </div>

      {/* ── 3. Sticky Gradebook Matrix Table ── */}
      <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            {/* Table Header */}
            <thead>
              <tr className="bg-gray-50 dark:bg-night-elevated/80 border-b border-gray-200 dark:border-night-border">
                {/* Fixed Col 1: Student Name */}
                <th className="px-4 py-3.5 font-heading text-xs font-bold text-vutru dark:text-night-text sticky left-0 bg-gray-50 dark:bg-night-elevated z-20 min-w-[200px] border-r border-gray-200 dark:border-night-border">
                  Học sinh ({processedStudents.length})
                </th>

                {/* Fixed Col 2: Auto GPA */}
                <th className="px-3.5 py-3.5 font-heading text-xs font-bold text-vutru dark:text-night-text sticky left-[200px] bg-gray-50 dark:bg-night-elevated z-20 min-w-[120px] text-center border-r border-gray-200 dark:border-night-border">
                  Điểm TB (Hệ 10)
                </th>

                {/* Dynamic Columns: Classworks */}
                {filteredClassworks.map((cw) => (
                  <th
                    key={cw.id}
                    className="px-3 py-3 font-semibold text-vutru dark:text-night-text min-w-[140px] max-w-[180px] border-r border-gray-100 dark:border-night-border/60 text-center"
                  >
                    <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-vutruNhat dark:text-night-muted mb-0.5">
                      {cw.type === 'EXAM' ? (
                        <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                          <FileText size={10} /> Đề thi
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-camDam dark:text-cam">
                          <PenTool size={10} /> Tự luận
                        </span>
                      )}
                      <span>• Tối đa: {cw.maxScore}</span>
                    </div>

                    <div className="font-bold text-vutru dark:text-night-text truncate hover:whitespace-normal transition-all" title={cw.title}>
                      {cw.title}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-100 dark:divide-night-border/70">
              {processedStudents.length === 0 ? (
                <tr>
                  <td colSpan={filteredClassworks.length + 2} className="px-6 py-12 text-center text-vutruNhat dark:text-night-muted">
                    <Users size={32} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="font-semibold">Không tìm thấy học sinh phù hợp.</p>
                  </td>
                </tr>
              ) : (
                processedStudents.map((student, idx) => {
                  const avg = calculateStudentAvg(student, gradebook.classworks);
                  const classification = getScoreClassification(avg);

                  return (
                    <tr
                      key={student.studentId}
                      className="hover:bg-gray-50/80 dark:hover:bg-night-elevated/40 transition-colors group"
                    >
                      {/* Fixed Col 1: Student info */}
                      <td className="px-4 py-3 sticky left-0 bg-white dark:bg-night-surface group-hover:bg-gray-50/90 dark:group-hover:bg-night-elevated z-10 border-r border-gray-200 dark:border-night-border">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] font-bold text-vutruNhat w-4 text-center shrink-0">
                            {idx + 1}
                          </span>
                          <UserAvatar
                            fullName={student.studentName}
                            avatarUrl={student.avatarUrl}
                            size="sm"
                            className="w-7 h-7 font-bold text-xs shrink-0"
                          />
                          <span className="font-bold text-vutru dark:text-night-text truncate max-w-[130px]" title={student.studentName}>
                            {student.studentName}
                          </span>
                        </div>
                      </td>

                      {/* Fixed Col 2: GPA badge */}
                      <td className="px-3.5 py-3 sticky left-[200px] bg-white dark:bg-night-surface group-hover:bg-gray-50/90 dark:group-hover:bg-night-elevated z-10 text-center border-r border-gray-200 dark:border-night-border">
                        {avg !== null ? (
                          <div className="inline-flex flex-col items-center">
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono ${classification.class}`}>
                              {avg}
                            </span>
                            <span className="text-[9px] font-semibold text-vutruNhat mt-0.5">
                              {classification.label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-night-muted italic text-[11px]">Chưa có</span>
                        )}
                      </td>

                      {/* Dynamic Columns */}
                      {filteredClassworks.map((cw) => {
                        const submission = student.grades[cw.id];

                        if (!submission || submission.status === 'ASSIGNED') {
                          return (
                            <td key={cw.id} className="px-3 py-3 text-center border-r border-gray-100 dark:border-night-border/40">
                              <span className="text-gray-400 dark:text-night-muted text-[11px]">Chưa nộp</span>
                            </td>
                          );
                        }

                        if (submission.status === 'MISSING') {
                          return (
                            <td key={cw.id} className="px-3 py-3 text-center border-r border-gray-100 dark:border-night-border/40">
                              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
                                Thiếu bài
                              </span>
                            </td>
                          );
                        }

                        if (submission.status === 'TURNED_IN') {
                          return (
                            <td key={cw.id} className="px-3 py-3 text-center border-r border-gray-100 dark:border-night-border/40">
                              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                                Chờ chấm
                              </span>
                            </td>
                          );
                        }

                        if (submission.status === 'GRADED') {
                          const scoreVal = typeof submission.score === 'number' ? submission.score : 0;
                          const formattedScore = formatScore(scoreVal);
                          const normalized = cw.maxScore > 0 ? (scoreVal / cw.maxScore) * 10 : scoreVal;
                          const isHigh = normalized >= 8.0;
                          const isLow = normalized < 5.0;

                          return (
                            <td key={cw.id} className="px-3 py-3 text-center border-r border-gray-100 dark:border-night-border/40">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono ${
                                  isHigh
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
                                    : isLow
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40'
                                    : 'bg-camNhat/30 text-camDam dark:bg-night-elevated dark:text-cam border border-cam/20 dark:border-night-border'
                                }`}
                              >
                                {formattedScore}
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td key={cw.id} className="px-3 py-3 text-center border-r border-gray-100 dark:border-night-border/40 text-gray-300">
                            -
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Report Export & Print Modal */}
      <ClassMonthlyReportModal
        classroom={classroom}
        isOpen={isMonthlyModalOpen}
        onClose={() => setIsMonthlyModalOpen(false)}
        gradebook={gradebook}
      />
    </div>
  );
};

export default ClassGradebook;
