import React, { useState, useMemo } from 'react';
import { Classroom, ClassMember } from '../../services/class.service';
import { formatLastActiveStatus, formatShortDate } from '../../utils/dateUtils';
import { useToast } from '../../context/ToastContext';
import * as XLSX from 'xlsx';
import UserAvatar from '../../components/common/UserAvatar';
import {
  X,
  BarChart3,
  Users,
  CheckCircle2,
  AlertTriangle,
  UserX,
  Clock,
  Download,
  Copy,
  Search,
  FileSpreadsheet,
  Mail,
  Phone,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

import Portal from '../../components/ui/Portal';
interface StudentActivityReportModalProps {
  classroom: Classroom;
  students: ClassMember[];
  isOpen: boolean;
  onClose: () => void;
}

type ActivityFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'NEVER';

export default function StudentActivityReportModal({
  classroom,
  students,
  isOpen,
  onClose,
}: StudentActivityReportModalProps) {
  const toast = useToast();
  const [filter, setFilter] = useState<ActivityFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Format full date & time for last active
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return 'Chưa từng hoạt động';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Không xác định';
      const pad = (n: number) => n.toString().padStart(2, '0');
      const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
      return `${time} ngày ${date}`;
    } catch {
      return dateStr;
    }
  };

  // Process student stats
  const {
    totalStudents,
    activeStudents,
    inactiveStudents,
    neverActiveStudents,
    activeRate,
    inactiveRate,
    distribution,
  } = useMemo(() => {
    const total = students.length;
    let activeCount = 0;
    let inactiveCount = 0;
    let neverCount = 0;

    let onlineOrToday = 0;
    let days1to6 = 0;
    let days7to14 = 0;
    let daysOver14 = 0;

    const inactiveList: ClassMember[] = [];
    const activeList: ClassMember[] = [];
    const neverList: ClassMember[] = [];

    students.forEach((st) => {
      const status = formatLastActiveStatus(st.lastActiveAt);

      if (!st.lastActiveAt) {
        neverCount++;
        inactiveCount++;
        neverList.push(st);
        inactiveList.push(st);
      } else if (status.isAtRisk || status.status === 'INACTIVE') {
        inactiveCount++;
        inactiveList.push(st);
        if (status.daysAgo <= 14) {
          days7to14++;
        } else {
          daysOver14++;
        }
      } else {
        activeCount++;
        activeList.push(st);
        if (status.status === 'ONLINE' || status.status === 'RECENT') {
          onlineOrToday++;
        } else {
          days1to6++;
        }
      }
    });

    const activePct = total > 0 ? Math.round((activeCount / total) * 100) : 0;
    const inactivePct = total > 0 ? Math.round((inactiveCount / total) * 100) : 0;

    return {
      totalStudents: total,
      activeStudents: activeList,
      inactiveStudents: inactiveList,
      neverActiveStudents: neverList,
      activeRate: activePct,
      inactiveRate: inactivePct,
      distribution: {
        onlineOrToday,
        days1to6,
        days7to14,
        daysOver14,
        neverCount,
      },
    };
  }, [students]);

  // Filtered and searched student list
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const status = formatLastActiveStatus(st.lastActiveAt);
      const isNever = !st.lastActiveAt;
      const isInactive = isNever || status.isAtRisk || status.status === 'INACTIVE';
      const isActive = !isInactive;

      let matchFilter = true;
      if (filter === 'ACTIVE') matchFilter = isActive;
      else if (filter === 'INACTIVE') matchFilter = isInactive;
      else if (filter === 'NEVER') matchFilter = isNever;

      if (!matchFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = st.fullName.toLowerCase().includes(q);
        const matchEmail = st.email?.toLowerCase().includes(q) || false;
        const matchCode = st.studentCode?.toLowerCase().includes(q) || false;
        const matchPhone = st.phone?.toLowerCase().includes(q) || false;
        return matchName || matchEmail || matchCode || matchPhone;
      }

      return true;
    });
  }, [students, filter, searchQuery]);

  if (!isOpen) return null;

  // Copy emails of inactive students
  const handleCopyInactiveEmails = () => {
    const emails = inactiveStudents
      .map((st) => st.email)
      .filter((e): e is string => Boolean(e && e.trim()));

    if (emails.length === 0) {
      toast.info('Không có email nào để sao chép');
      return;
    }

    navigator.clipboard.writeText(emails.join(', '));
    toast.success(`Đã sao chép ${emails.length} email học sinh không hoạt động`);
  };

  // Export 1: Full report (Multi-sheet)
  const handleExportFullReport = () => {
    if (students.length === 0) {
      toast.info('Không có dữ liệu học sinh để xuất');
      return;
    }

    const nowStr = formatDateTime(new Date().toISOString());

    // Sheet 1: Tất cả học sinh
    const allRows = students.map((st, idx) => {
      const status = formatLastActiveStatus(st.lastActiveAt);
      const daysText = !st.lastActiveAt
        ? 'Chưa từng hoạt động'
        : status.daysAgo === 0
        ? '0 (Hoạt động hôm nay)'
        : `${status.daysAgo} ngày`;

      let evalStatus = 'Đang hoạt động tốt';
      if (!st.lastActiveAt) evalStatus = 'Chưa từng đăng nhập';
      else if (status.isAtRisk) evalStatus = 'Cần đôn đốc / Không hoạt động';

      return {
        'STT': idx + 1,
        'Mã Học Sinh': st.studentCode || '-',
        'Họ và Tên': st.fullName,
        'Email': st.email || '-',
        'Số Điện Thoại': st.phone || '-',
        'Ngày Tham Gia Lớp': formatShortDate(st.joinedAt),
        'Thời Gian Hoạt Động Gần Nhất': formatDateTime(st.lastActiveAt),
        'Số Ngày Vắng': daysText,
        'Đánh Giá Hoạt Động': evalStatus,
      };
    });

    // Sheet 2: Danh sách học sinh không hoạt động
    const inactiveRows = inactiveStudents.map((st, idx) => {
      const status = formatLastActiveStatus(st.lastActiveAt);
      const daysText = !st.lastActiveAt ? 'Chưa từng hoạt động' : `${status.daysAgo} ngày`;

      return {
        'STT': idx + 1,
        'Mã Học Sinh': st.studentCode || '-',
        'Họ và Tên': st.fullName,
        'Email': st.email || '-',
        'Số Điện Thoại': st.phone || '-',
        'Thời Gian Hoạt Động Gần Nhất': formatDateTime(st.lastActiveAt),
        'Số Ngày Không Hoạt Động': daysText,
        'Mức Độ Cảnh Báo': !st.lastActiveAt
          ? 'Chưa đăng nhập hệ thống'
          : status.daysAgo > 14
          ? 'Rất nghiêm trọng (>14 ngày)'
          : 'Cần nhắc nhở (>7 ngày)',
      };
    });

    // Sheet 3: Tổng quan lớp học
    const summaryRows = [
      { 'Chỉ Số Báo Cáo': 'Tên lớp học', 'Giá Trị': classroom.name },
      { 'Chỉ Số Báo Cáo': 'Mã mời lớp', 'Giá Trị': classroom.inviteCode || '-' },
      { 'Chỉ Số Báo Cáo': 'Thời điểm xuất báo cáo', 'Giá Trị': nowStr },
      { 'Chỉ Số Báo Cáo': 'Tổng sĩ số học sinh', 'Giá Trị': totalStudents },
      { 'Chỉ Số Báo Cáo': 'Số học sinh đang hoạt động', 'Giá Trị': activeStudents.length },
      { 'Chỉ Số Báo Cáo': 'Tỷ lệ học sinh đang hoạt động', 'Giá Trị': `${activeRate}%` },
      { 'Chỉ Số Báo Cáo': 'Số học sinh KHÔNG hoạt động (>7 ngày)', 'Giá Trị': inactiveStudents.length },
      { 'Chỉ Số Báo Cáo': 'Tỷ lệ học sinh không hoạt động', 'Giá Trị': `${inactiveRate}%` },
      { 'Chỉ Số Báo Cáo': 'Số học sinh chưa từng hoạt động', 'Giá Trị': neverActiveStudents.length },
    ];

    const wb = XLSX.utils.book_new();

    const wsAll = XLSX.utils.json_to_sheet(allRows);
    wsAll['!cols'] = [
      { wch: 6 }, { wch: 15 }, { wch: 25 }, { wch: 28 }, { wch: 15 },
      { wch: 16 }, { wch: 26 }, { wch: 22 }, { wch: 28 }
    ];
    XLSX.utils.book_append_sheet(wb, wsAll, 'Tất Cả Học Sinh');

    const wsInactive = XLSX.utils.json_to_sheet(inactiveRows);
    wsInactive['!cols'] = [
      { wch: 6 }, { wch: 15 }, { wch: 25 }, { wch: 28 }, { wch: 15 },
      { wch: 26 }, { wch: 24 }, { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, wsInactive, 'Học Sinh Không Hoạt Động');

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 35 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng Quan');

    const fileName = `Bao-Cao-Hoat-Dong_${classroom.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Đã xuất toàn bộ báo cáo hoạt động (Excel) thành công!');
  };

  // Export 2: Inactive only
  const handleExportInactiveOnly = () => {
    if (inactiveStudents.length === 0) {
      toast.info('Tuyệt vời! Không có học sinh nào đang ngừng hoạt động.');
      return;
    }

    const inactiveRows = inactiveStudents.map((st, idx) => {
      const status = formatLastActiveStatus(st.lastActiveAt);
      const daysText = !st.lastActiveAt ? 'Chưa từng hoạt động' : `${status.daysAgo} ngày`;

      return {
        'STT': idx + 1,
        'Mã Học Sinh': st.studentCode || '-',
        'Họ và Tên': st.fullName,
        'Email': st.email || '-',
        'Số Điện Thoại': st.phone || '-',
        'Lần Hoạt Động Gần Nhất': formatDateTime(st.lastActiveAt),
        'Số Ngày Không Hoạt Động': daysText,
        'Ghi Chú Đôn Đốc': !st.lastActiveAt
          ? 'Chưa vào hệ thống lần nào'
          : status.daysAgo > 14
          ? 'Không hoạt động trên 14 ngày (Khẩn cấp)'
          : 'Không hoạt động trên 7 ngày (Cần nhắc nhở)',
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(inactiveRows);
    ws['!cols'] = [
      { wch: 6 }, { wch: 15 }, { wch: 25 }, { wch: 28 }, { wch: 16 },
      { wch: 26 }, { wch: 24 }, { wch: 36 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'DS Không Hoạt Động');

    const fileName = `Hoc-Sinh-Khong-Hoat-Dong_${classroom.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success(`Đã xuất danh sách ${inactiveStudents.length} học sinh không hoạt động!`);
  };

  return (
    <Portal><div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-body overflow-y-auto">
      <div
        className="bg-white dark:bg-night-surface w-full max-w-5xl rounded-3xl shadow-2xl border border-gray-100 dark:border-night-border flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-night-border bg-gray-50/50 dark:bg-night-elevated/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cam/10 dark:bg-cam/20 text-cam flex items-center justify-center shrink-0">
              <BarChart3 size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold text-vutru dark:text-night-text flex items-center gap-2">
                <span>Báo cáo ngày hoạt động học sinh</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold">
                  {classroom.name}
                </span>
              </h2>
              <p className="text-xs text-vutruNhat dark:text-night-muted mt-0.5">
                Theo dõi chuyên cần, phát hiện học sinh ngừng tương tác và xuất file Excel hỗ trợ đôn đốc
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-vutruNhat hover:text-vutru dark:text-night-muted dark:hover:text-night-text hover:bg-gray-100 dark:hover:bg-night-elevated transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Modal Scrollable Body ── */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. Key Metric KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Total Students */}
            <div className="p-4 rounded-2xl bg-white dark:bg-night-elevated border border-gray-100 dark:border-night-border shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-vutruNhat dark:text-night-muted">
                <span className="text-xs font-semibold">Tổng sĩ số</span>
                <Users size={18} className="text-blue-500" />
              </div>
              <div className="mt-2.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-vutru dark:text-night-text font-heading">
                  {totalStudents}
                </div>
                <div className="text-[11px] text-vutruNhat dark:text-night-muted mt-0.5">
                  Học viên trong lớp
                </div>
              </div>
            </div>

            {/* Active Students */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                <span className="text-xs font-bold">Đang hoạt động</span>
                <CheckCircle2 size={18} className="text-emerald-500" />
              </div>
              <div className="mt-2.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 font-heading flex items-baseline gap-2">
                  <span>{activeStudents.length}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                    {activeRate}%
                  </span>
                </div>
                <div className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 mt-0.5">
                  Tương tác trong 7 ngày qua
                </div>
              </div>
            </div>

            {/* Inactive / At Risk Students */}
            <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
                <span className="text-xs font-bold">Không hoạt động</span>
                <AlertTriangle size={18} className="text-rose-500" />
              </div>
              <div className="mt-2.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-rose-700 dark:text-rose-400 font-heading flex items-baseline gap-2">
                  <span>{inactiveStudents.length}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40">
                    {inactiveRate}%
                  </span>
                </div>
                <div className="text-[11px] text-rose-800/80 dark:text-rose-400/80 mt-0.5">
                  Vắng mặt &gt; 7 ngày / Chưa tương tác
                </div>
              </div>
            </div>

            {/* Never Active Students */}
            <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-night-elevated border border-gray-100 dark:border-night-border shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-vutruNhat dark:text-night-muted">
                <span className="text-xs font-semibold">Chưa từng vào lớp</span>
                <UserX size={18} className="text-gray-400" />
              </div>
              <div className="mt-2.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-vutru dark:text-night-text font-heading">
                  {neverActiveStudents.length}
                </div>
                <div className="text-[11px] text-vutruNhat dark:text-night-muted mt-0.5">
                  Chưa có lịch sử hoạt động
                </div>
              </div>
            </div>
          </div>

          {/* 2. Visual Activity Distribution Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-night-elevated border border-gray-100 dark:border-night-border space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-vutru dark:text-night-text">
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-cam" /> Phân bổ mức độ hoạt động gần nhất
              </span>
              <span className="text-vutruNhat dark:text-night-muted font-normal text-[11px]">
                Căn cứ theo mốc tương tác cuối cùng
              </span>
            </div>

            {/* Segmented Bar */}
            <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-night-surface overflow-hidden flex shadow-inner">
              {totalStudents > 0 ? (
                <>
                  <div
                    style={{ width: `${(distribution.onlineOrToday / totalStudents) * 100}%` }}
                    className="bg-emerald-500 h-full transition-all"
                    title={`Vừa online / Hôm nay: ${distribution.onlineOrToday} em`}
                  />
                  <div
                    style={{ width: `${(distribution.days1to6 / totalStudents) * 100}%` }}
                    className="bg-blue-400 h-full transition-all"
                    title={`1 - 6 ngày trước: ${distribution.days1to6} em`}
                  />
                  <div
                    style={{ width: `${(distribution.days7to14 / totalStudents) * 100}%` }}
                    className="bg-amber-400 h-full transition-all"
                    title={`7 - 14 ngày trước: ${distribution.days7to14} em`}
                  />
                  <div
                    style={{ width: `${(distribution.daysOver14 / totalStudents) * 100}%` }}
                    className="bg-rose-500 h-full transition-all"
                    title={`> 14 ngày trước: ${distribution.daysOver14} em`}
                  />
                  <div
                    style={{ width: `${(distribution.neverCount / totalStudents) * 100}%` }}
                    className="bg-gray-300 dark:bg-gray-600 h-full transition-all"
                    title={`Chưa từng hoạt động: ${distribution.neverCount} em`}
                  />
                </>
              ) : (
                <div className="w-full bg-gray-200 h-full" />
              )}
            </div>

            {/* Legend Chips */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Hôm nay: <strong>{distribution.onlineOrToday}</strong></span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>1 - 6 ngày: <strong>{distribution.days1to6}</strong></span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>7 - 14 ngày: <strong>{distribution.days7to14}</strong></span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>&gt; 14 ngày: <strong>{distribution.daysOver14}</strong></span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span>Chưa có dữ liệu: <strong>{distribution.neverCount}</strong></span>
              </span>
            </div>
          </div>

          {/* 3. Actions & Exports Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/70 dark:bg-night-elevated/40 p-3.5 rounded-2xl border border-gray-100 dark:border-night-border">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Export Full Excel */}
              <button
                type="button"
                onClick={handleExportFullReport}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95"
              >
                <FileSpreadsheet size={15} />
                <span>Xuất toàn bộ báo cáo (.xlsx)</span>
              </button>

              {/* Export Inactive Only */}
              <button
                type="button"
                onClick={handleExportInactiveOnly}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95"
              >
                <Download size={15} />
                <span>Xuất DS học sinh không hoạt động ({inactiveStudents.length})</span>
              </button>
            </div>

            {/* Quick Copy Action */}
            {inactiveStudents.length > 0 && (
              <button
                type="button"
                onClick={handleCopyInactiveEmails}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-vutruNhat hover:text-vutru dark:text-night-muted dark:hover:text-night-text bg-white dark:bg-night-surface rounded-xl border border-gray-200 dark:border-night-border transition-colors shadow-2xs self-start sm:self-auto"
                title="Sao chép toàn bộ email các học sinh không hoạt động"
              >
                <Copy size={13} />
                <span>Copy email học sinh không hoạt động</span>
              </button>
            )}
          </div>

          {/* 4. Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-night-elevated rounded-xl self-start sm:self-auto text-xs font-bold overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  filter === 'ALL'
                    ? 'bg-white dark:bg-night-surface text-vutru dark:text-night-text shadow-2xs'
                    : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
                }`}
              >
                Tất cả ({totalStudents})
              </button>

              <button
                type="button"
                onClick={() => setFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  filter === 'ACTIVE'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                    : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
                }`}
              >
                Đang hoạt động ({activeStudents.length})
              </button>

              <button
                type="button"
                onClick={() => setFilter('INACTIVE')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
                  filter === 'INACTIVE'
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-2xs'
                    : 'text-rose-600/80 hover:text-rose-700'
                }`}
              >
                <AlertTriangle size={12} />
                <span>Không hoạt động ({inactiveStudents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilter('NEVER')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  filter === 'NEVER'
                    ? 'bg-white dark:bg-night-surface text-vutru dark:text-night-text shadow-2xs'
                    : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
                }`}
              >
                Chưa hoạt động ({neverActiveStudents.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-vutruNhat dark:text-night-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên, email, mã HS..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cam/30 text-vutru dark:text-night-text"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* 5. Detailed Student Roster Table */}
          <div className="rounded-2xl border border-gray-100 dark:border-night-border overflow-hidden bg-white dark:bg-night-surface shadow-2xs">
            <div className="overflow-x-auto max-h-[380px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 dark:bg-night-elevated sticky top-0 z-10 text-vutruNhat dark:text-night-muted uppercase text-[10px] tracking-wider border-b border-gray-100 dark:border-night-border">
                  <tr>
                    <th className="px-4 py-3 font-bold w-12 text-center">STT</th>
                    <th className="px-4 py-3 font-bold">Học sinh</th>
                    <th className="px-4 py-3 font-bold">Thông tin liên hệ</th>
                    <th className="px-4 py-3 font-bold">Lần hoạt động cuối</th>
                    <th className="px-4 py-3 font-bold">Số ngày vắng</th>
                    <th className="px-4 py-3 font-bold text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-night-border">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-vutruNhat dark:text-night-muted">
                        Không tìm thấy học sinh nào phù hợp bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st, idx) => {
                      const status = formatLastActiveStatus(st.lastActiveAt);
                      const isInactive = !st.lastActiveAt || status.isAtRisk || status.status === 'INACTIVE';

                      return (
                        <tr
                          key={st.id}
                          className={`hover:bg-gray-50/80 dark:hover:bg-night-elevated/50 transition-colors ${
                            isInactive ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-center text-vutruNhat dark:text-night-muted font-medium">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5 min-w-[180px]">
                              <div className="relative shrink-0">
                                <UserAvatar fullName={st.fullName} avatarUrl={st.avatarUrl} size="sm" />
                                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white dark:border-night-surface ${status.dotClass}`} />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-vutru dark:text-night-text truncate">
                                  {st.fullName}
                                </div>
                                {st.studentCode && (
                                  <div className="text-[10px] font-mono text-vutruNhat dark:text-night-muted">
                                    Mã: {st.studentCode}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-0.5 min-w-[160px]">
                              {st.email ? (
                                <div className="text-vutruNhat dark:text-night-muted flex items-center gap-1.5 truncate">
                                  <Mail size={11} className="shrink-0 text-gray-400" />
                                  <span className="truncate">{st.email}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-[11px]">-</span>
                              )}
                              {st.phone && (
                                <div className="text-vutruNhat dark:text-night-muted flex items-center gap-1.5">
                                  <Phone size={11} className="shrink-0 text-gray-400" />
                                  <span>{st.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-vutru dark:text-night-text font-medium">
                              {formatDateTime(st.lastActiveAt)}
                            </div>
                            <div className="text-[10px] text-vutruNhat dark:text-night-muted">
                              {status.label}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium">
                            {!st.lastActiveAt ? (
                              <span className="text-gray-400 italic">Chưa hoạt động</span>
                            ) : status.daysAgo === 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Hôm nay</span>
                            ) : status.daysAgo > 7 ? (
                              <span className="text-rose-600 dark:text-rose-400 font-bold">
                                {status.daysAgo} ngày
                              </span>
                            ) : (
                              <span className="text-vutruNhat dark:text-night-muted">
                                {status.daysAgo} ngày trước
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${status.badgeClass}`}>
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-night-border bg-gray-50/50 dark:bg-night-elevated/30 flex items-center justify-between text-xs text-vutruNhat dark:text-night-muted">
          <span>
            Hiển thị <strong>{filteredStudents.length}</strong> / <strong>{totalStudents}</strong> học sinh
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-night-elevated dark:hover:bg-night-border text-vutru dark:text-night-text rounded-xl font-bold transition-colors active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </div></Portal>
  );
}
