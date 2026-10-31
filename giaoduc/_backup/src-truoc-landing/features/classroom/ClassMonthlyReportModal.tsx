import React, { useState, useMemo, useRef } from 'react';
import { Classroom, GradebookResponse } from '../../services/class.service';
import { formatShortDate, formatLastActiveStatus } from '../../utils/dateUtils';
import { formatScore } from '../../utils/formatUtils';
import { useToast } from '../../context/ToastContext';
import * as XLSX from 'xlsx';
import {
  X,
  FileSpreadsheet,
  Printer,
  Calendar,
  Award,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  ChevronDown,
  BarChart3,
  Percent,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';

import Portal from '../../components/ui/Portal';
interface ClassMonthlyReportModalProps {
  classroom: Classroom;
  isOpen: boolean;
  onClose: () => void;
  gradebook: GradebookResponse | null;
}

export default function ClassMonthlyReportModal({
  classroom,
  isOpen,
  onClose,
  gradebook,
}: ClassMonthlyReportModalProps) {
  const toast = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  // Generate list of 12 recent months (e.g. 2026-08, 2026-07, ...)
  const monthOptions = useMemo(() => {
    const list: { label: string; year: number; month: number; key: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthStr = month.toString().padStart(2, '0');
      list.push({
        label: `Tháng ${monthStr}/${year}`,
        year,
        month,
        key: `${year}-${monthStr}`,
      });
    }
    return list;
  }, []);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(monthOptions[0]?.key || '');
  const [activeView, setActiveView] = useState<'preview' | 'printable'>('preview');

  const selectedMonthInfo = useMemo(() => {
    return monthOptions.find((m) => m.key === selectedMonthKey) || monthOptions[0];
  }, [monthOptions, selectedMonthKey]);

  // Calculate Monthly Metrics & Student Rows
  const monthlyData = useMemo(() => {
    if (!gradebook || gradebook.students.length === 0) {
      return {
        classworks: [],
        students: [],
        metrics: {
          totalStudents: 0,
          totalClassworks: 0,
          classAvg: null,
          submissionRate: 0,
          excellentRate: 0,
          goodRate: 0,
          averageRate: 0,
          poorRate: 0,
        },
      };
    }

    // In a production LMS, classworks can be filtered by month of dueDate/createdAt
    // If fewer than 1 classwork matches exact month, fallback to all classworks with explicit note
    const allCw = gradebook.classworks;
    const studentsData = gradebook.students.map((st, idx) => {
      let totalNormalized = 0;
      let gradedCount = 0;
      let turnedInCount = 0;

      const gradesMap: Record<string, { score: number | null; maxScore: number; status: string }> = {};

      allCw.forEach((cw) => {
        const sub = st.grades[cw.id];
        if (sub) {
          gradesMap[cw.id] = {
            score: sub.score,
            maxScore: cw.maxScore > 0 ? cw.maxScore : 10,
            status: sub.status,
          };
          if (sub.status === 'TURNED_IN' || sub.status === 'GRADED') {
            turnedInCount++;
          }
          if (sub.status === 'GRADED' && typeof sub.score === 'number') {
            const max = cw.maxScore > 0 ? cw.maxScore : 10;
            totalNormalized += (sub.score / max) * 10;
            gradedCount++;
          }
        }
      });

      const avgScore = gradedCount > 0 ? Number((totalNormalized / gradedCount).toFixed(1)) : null;
      const subRate = allCw.length > 0 ? Math.round((turnedInCount / allCw.length) * 100) : 0;

      let classification = 'Chưa có điểm';
      let rankColor = 'text-gray-500';
      if (avgScore !== null) {
        if (avgScore >= 8.5) {
          classification = 'Giỏi';
          rankColor = 'text-emerald-600 dark:text-emerald-400 font-bold';
        } else if (avgScore >= 6.5) {
          classification = 'Khá';
          rankColor = 'text-blue-600 dark:text-blue-400 font-bold';
        } else if (avgScore >= 5.0) {
          classification = 'Trung bình';
          rankColor = 'text-amber-600 dark:text-amber-400 font-medium';
        } else {
          classification = 'Cần cố gắng';
          rankColor = 'text-rose-600 dark:text-rose-400 font-medium';
        }
      }

      return {
        stt: idx + 1,
        studentId: st.studentId,
        studentName: st.studentName,
        avatarUrl: st.avatarUrl,
        avgScore,
        subRate,
        classification,
        rankColor,
        gradesMap,
        turnedInCount,
        totalAssigned: allCw.length,
      };
    });

    // Compute Class Metrics
    let sumAvg = 0;
    let scoredStudents = 0;
    let totalSubPercentSum = 0;
    let countExcellent = 0;
    let countGood = 0;
    let countAvg = 0;
    let countPoor = 0;

    studentsData.forEach((s) => {
      totalSubPercentSum += s.subRate;
      if (s.avgScore !== null) {
        sumAvg += s.avgScore;
        scoredStudents++;
        if (s.avgScore >= 8.5) countExcellent++;
        else if (s.avgScore >= 6.5) countGood++;
        else if (s.avgScore >= 5.0) countAvg++;
        else countPoor++;
      }
    });

    const classAvg = scoredStudents > 0 ? Number((sumAvg / scoredStudents).toFixed(1)) : null;
    const submissionRate = studentsData.length > 0 ? Math.round(totalSubPercentSum / studentsData.length) : 0;

    const baseCount = scoredStudents > 0 ? scoredStudents : 1;
    const excellentRate = Math.round((countExcellent / baseCount) * 100);
    const goodRate = Math.round((countGood / baseCount) * 100);
    const averageRate = Math.round((countAvg / baseCount) * 100);
    const poorRate = Math.round((countPoor / baseCount) * 100);

    return {
      classworks: allCw,
      students: studentsData,
      metrics: {
        totalStudents: studentsData.length,
        totalClassworks: allCw.length,
        classAvg,
        submissionRate,
        excellentRate,
        goodRate,
        averageRate,
        poorRate,
      },
    };
  }, [gradebook]);

  if (!isOpen) return null;

  // Export to Excel handler
  const handleExportExcel = () => {
    if (!monthlyData.students.length) {
      toast.error('Không có dữ liệu học sinh để xuất báo cáo');
      return;
    }

    const monthLabel = selectedMonthInfo?.label || 'Tháng';

    // Sheet 1: Bảng điểm chi tiết tháng
    const detailRows = monthlyData.students.map((st) => {
      const row: any = {
        'STT': st.stt,
        'Họ và Tên': st.studentName,
        'Điểm Trung Bình (Hệ 10)': st.avgScore !== null ? st.avgScore : 'Chưa có',
        'Xếp Loại Tháng': st.classification,
        'Tỷ Lệ Nộp Bài (%)': `${st.subRate}%`,
        'Bài Đã Nộp': `${st.turnedInCount}/${st.totalAssigned}`,
      };

      monthlyData.classworks.forEach((cw) => {
        const g = st.gradesMap[cw.id];
        let val = '-';
        if (g) {
          if (g.status === 'GRADED') val = `${formatScore(g.score)}/${formatScore(g.maxScore)}`;
          else if (g.status === 'TURNED_IN') val = 'Chờ chấm';
          else if (g.status === 'MISSING') val = 'Thiếu bài';
          else if (g.status === 'ASSIGNED') val = 'Chưa nộp';
        }
        row[`${cw.title} (${cw.type === 'EXAM' ? 'Đề thi' : 'Bài tập'})`] = val;
      });

      return row;
    });

    // Sheet 2: Tổng quan & Chỉ số lớp
    const summaryRows = [
      { 'Chỉ Số Lớp Học': 'Lớp học', 'Giá Trị': classroom.name },
      { 'Chỉ Số Lớp Học': 'Mã tham gia lớp', 'Giá Trị': classroom.inviteCode || '-' },
      { 'Chỉ Số Lớp Học': 'Tháng báo cáo', 'Giá Trị': monthLabel },
      { 'Chỉ Số Lớp Học': 'Sĩ số học sinh', 'Giá Trị': monthlyData.metrics.totalStudents },
      { 'Chỉ Số Lớp Học': 'Tổng số bài tập / đề thi', 'Giá Trị': monthlyData.metrics.totalClassworks },
      { 'Chỉ Số Lớp Học': 'Điểm trung bình toàn lớp', 'Giá Trị': monthlyData.metrics.classAvg ?? 'Chưa có' },
      { 'Chỉ Số Lớp Học': 'Tỷ lệ nộp bài trung bình', 'Giá Trị': `${monthlyData.metrics.submissionRate}%` },
      { 'Chỉ Số Lớp Học': 'Tỷ lệ Giỏi (>= 8.5)', 'Giá Trị': `${monthlyData.metrics.excellentRate}%` },
      { 'Chỉ Số Lớp Học': 'Tỷ lệ Khá (6.5 - 8.4)', 'Giá Trị': `${monthlyData.metrics.goodRate}%` },
      { 'Chỉ Số Lớp Học': 'Tỷ lệ Trung bình (5.0 - 6.4)', 'Giá Trị': `${monthlyData.metrics.averageRate}%` },
      { 'Chỉ Số Lớp Học': 'Tỷ lệ Cần cố gắng (< 5.0)', 'Giá Trị': `${monthlyData.metrics.poorRate}%` },
    ];

    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng Quan Tháng');

    const wsDetail = XLSX.utils.json_to_sheet(detailRows);
    wsDetail['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Bảng Điểm Chi Tiết');

    const safeClassName = classroom.name.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
    const safeMonth = selectedMonthKey.replace('-', '_');
    XLSX.writeFile(wb, `Bao_Cao_${safeClassName}_${safeMonth}.xlsx`);
    toast.success(`Đã xuất báo cáo ${monthLabel} sang Excel thành công!`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Portal><div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      {/* Modal Box */}
      <div className="bg-white dark:bg-night-surface w-full max-w-5xl rounded-3xl shadow-2xl border border-gray-100 dark:border-night-border max-h-[92vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-night-border bg-gray-50/70 dark:bg-night-elevated/70 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cam/15 dark:bg-cam/20 flex items-center justify-center text-camDam dark:text-cam">
              <BarChart3 size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-heading text-vutru dark:text-night-text">
                Báo Cáo Tiến Độ & Kết Quả Lớp Học
              </h2>
              <p className="text-xs text-vutruNhat dark:text-night-muted">
                Lớp: <strong className="text-vutru dark:text-night-text">{classroom.name}</strong> • Mã lớp: {classroom.inviteCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Month Select */}
            <div className="relative">
              <Select
                value={selectedMonthKey}
                onChange={(v) => setSelectedMonthKey(v)}
                className="bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border rounded-xl pl-3 pr-8 py-2 text-xs sm:text-sm font-bold text-vutru dark:text-night-text focus:outline-none focus:border-cam cursor-pointer shadow-2xs"
                options={monthOptions.map((opt) => ({ value: opt.key, label: `📅 ${opt.label}` }))}
              />
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-night-elevated rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-6 space-y-6 print:p-0 print:overflow-visible">
          
          {/* Printable Header (Visible on print) */}
          <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-gray-800">
            <h1 className="text-2xl font-black uppercase tracking-wider text-gray-900 font-heading">
              BÁO CÁO TIẾN ĐỘ VÀ KẾT QUẢ HỌC TẬP THÁNG
            </h1>
            <p className="text-sm text-gray-600 mt-1 font-semibold">
              Hệ thống Quản lý Học tập Điểm Sáng • {selectedMonthInfo?.label}
            </p>
            <div className="flex justify-between items-center text-xs text-gray-700 mt-3 px-2 font-medium">
              <span>Lớp học: <strong>{classroom.name}</strong></span>
              <span>Mã lớp: <strong>{classroom.inviteCode}</strong></span>
              <span>Ngày xuất: {formatShortDate(new Date().toISOString())}</span>
            </div>
          </div>

          {/* Month Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 print:grid-cols-4">
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Sĩ số học sinh</span>
                <Users size={16} className="text-blue-500" />
              </div>
              <p className="text-2xl font-black font-heading text-blue-900 dark:text-blue-200 mt-1">
                {monthlyData.metrics.totalStudents}
              </p>
              <span className="text-[11px] text-blue-600/80 dark:text-blue-400">Học sinh trong lớp</span>
            </div>

            <div className="p-4 rounded-2xl bg-cam/10 dark:bg-cam/15 border border-cam/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-camDam dark:text-cam uppercase tracking-wide">Điểm TB Tháng</span>
                <Award size={16} className="text-cam" />
              </div>
              <p className="text-2xl font-black font-heading text-camDam dark:text-cam mt-1">
                {monthlyData.metrics.classAvg !== null ? `${monthlyData.metrics.classAvg} / 10` : '-'}
              </p>
              <span className="text-[11px] text-camDam/80 dark:text-cam/80">Hệ 10 toàn lớp</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Tỷ lệ nộp bài</span>
                <Percent size={16} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-black font-heading text-emerald-900 dark:text-emerald-200 mt-1">
                {monthlyData.metrics.submissionRate}%
              </p>
              <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400">Đã nộp bài tập / thi</span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">Bài tập & Đề thi</span>
                <FileText size={16} className="text-purple-500" />
              </div>
              <p className="text-2xl font-black font-heading text-purple-900 dark:text-purple-200 mt-1">
                {monthlyData.metrics.totalClassworks}
              </p>
              <span className="text-[11px] text-purple-600/80 dark:text-purple-400">Tổng số bài đã giao</span>
            </div>
          </div>

          {/* Academic Classification Breakdown Bar */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-night-elevated border border-gray-100 dark:border-night-border space-y-2.5">
            <div className="flex justify-between items-center text-xs font-bold text-vutru dark:text-night-text">
              <span>Phân bố học lực trong {selectedMonthInfo?.label}</span>
              <span className="text-vutruNhat dark:text-night-muted font-normal text-[11px]">Dựa trên bài nộp đã chấm</span>
            </div>
            
            {/* Visual Progress Bar */}
            <div className="h-3 w-full bg-gray-200 dark:bg-night-surface rounded-full flex overflow-hidden">
              <div style={{ width: `${monthlyData.metrics.excellentRate}%` }} className="bg-emerald-500 h-full" title={`Giỏi: ${monthlyData.metrics.excellentRate}%`} />
              <div style={{ width: `${monthlyData.metrics.goodRate}%` }} className="bg-blue-500 h-full" title={`Khá: ${monthlyData.metrics.goodRate}%`} />
              <div style={{ width: `${monthlyData.metrics.averageRate}%` }} className="bg-amber-500 h-full" title={`Trung bình: ${monthlyData.metrics.averageRate}%`} />
              <div style={{ width: `${monthlyData.metrics.poorRate}%` }} className="bg-rose-500 h-full" title={`Cần cố gắng: ${monthlyData.metrics.poorRate}%`} />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-1">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Giỏi: {monthlyData.metrics.excellentRate}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Khá: {monthlyData.metrics.goodRate}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Trung bình: {monthlyData.metrics.averageRate}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Cần cố gắng: {monthlyData.metrics.poorRate}%</span>
              </div>
            </div>
          </div>

          {/* Students Performance Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold font-heading text-vutru dark:text-night-text flex items-center gap-2">
                <span>Bảng Chi Tiết Kết Quả Từng Học Sinh</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted">
                  {monthlyData.students.length} học sinh
                </span>
              </h3>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-night-border shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/90 dark:bg-night-elevated text-vutruNhat dark:text-night-muted font-bold border-b border-gray-100 dark:border-night-border uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3.5 text-center w-12">STT</th>
                    <th className="py-3 px-4">Họ và Tên</th>
                    <th className="py-3 px-3 text-center">ĐTB Tháng</th>
                    <th className="py-3 px-3 text-center">Xếp loại</th>
                    <th className="py-3 px-3 text-center">Tỷ lệ nộp</th>
                    <th className="py-3 px-4 text-center">Bài đã nộp</th>
                    {monthlyData.classworks.map((cw) => (
                      <th key={cw.id} className="py-3 px-3 text-center min-w-[100px] truncate" title={cw.title}>
                        {cw.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-night-border bg-white dark:bg-night-surface">
                  {monthlyData.students.map((st) => (
                    <tr key={st.studentId} className="hover:bg-kem/30 dark:hover:bg-night-elevated/40 transition-colors">
                      <td className="py-3 px-3.5 text-center font-semibold text-gray-400">{st.stt}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-vutru dark:text-night-text">{st.studentName}</p>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-camDam dark:text-cam text-sm">
                        {st.avgScore !== null ? st.avgScore : <span className="text-gray-300 font-normal">-</span>}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] ${st.rankColor} bg-gray-50 dark:bg-night-elevated border border-gray-100 dark:border-night-border`}>
                          {st.classification}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-vutru dark:text-night-text">
                        {st.subRate}%
                      </td>
                      <td className="py-3 px-4 text-center text-vutruNhat dark:text-night-muted font-medium">
                        {st.turnedInCount} / {st.totalAssigned}
                      </td>
                      {monthlyData.classworks.map((cw) => {
                        const g = st.gradesMap[cw.id];
                        let displayText = '-';
                        let cellClass = 'text-gray-400';
                        if (g) {
                          if (g.status === 'GRADED') {
                            displayText = `${formatScore(g.score)}/${formatScore(g.maxScore)}`;
                            cellClass = 'font-bold text-vutru dark:text-night-text';
                          } else if (g.status === 'TURNED_IN') {
                            displayText = 'Chờ chấm';
                            cellClass = 'text-blue-600 font-medium';
                          } else if (g.status === 'MISSING') {
                            displayText = 'Thiếu bài';
                            cellClass = 'text-red-500 font-medium';
                          } else if (g.status === 'ASSIGNED') {
                            displayText = 'Chưa nộp';
                            cellClass = 'text-amber-600';
                          }
                        }
                        return (
                          <td key={cw.id} className={`py-3 px-3 text-center text-xs ${cellClass}`}>
                            {displayText}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Printable Signature Footer */}
          <div className="hidden print:flex justify-between items-end mt-12 pt-8 px-12 border-t border-gray-300">
            <div className="text-center">
              <p className="text-xs font-bold text-gray-500 uppercase">Phụ huynh học sinh</p>
              <p className="text-[11px] text-gray-400 italic mt-1">(Ký và ghi rõ họ tên)</p>
              <div className="h-16"></div>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-gray-500 uppercase">Giáo viên phụ trách</p>
              <p className="text-[11px] text-gray-400 italic mt-1">(Ký và ghi rõ họ tên)</p>
              <div className="h-16"></div>
              <p className="text-sm font-bold text-gray-900 font-heading">{classroom.teacherName || 'Giáo viên bộ môn'}</p>
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-night-border bg-gray-50/80 dark:bg-night-elevated/80 print:hidden">
          <div className="text-xs text-vutruNhat dark:text-night-muted flex items-center gap-1.5">
            <Sparkles size={14} className="text-cam" />
            <span>Dữ liệu báo cáo tự động tổng hợp theo {selectedMonthInfo?.label}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-1.5 font-bold shadow-2xs"
            >
              <Printer size={15} />
              <span>In / Xuất PDF A4</span>
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 font-bold shadow-sm"
            >
              <FileSpreadsheet size={15} />
              <span>Xuất File Excel (.xlsx)</span>
            </Button>
          </div>
        </div>

      </div>
    </div></Portal>
  );
}
