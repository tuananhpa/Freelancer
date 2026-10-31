import { getApiErrorMessage } from '../../services/api';
import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell
} from "recharts";
import {
  Download, Users, TrendingUp, Award, Target,
  RefreshCw, AlertTriangle, CheckCircle, XCircle, Trash2,
  Search, Filter, Trophy, HelpCircle, ChevronUp, ChevronDown
} from "lucide-react";
import api from "../../services/api";
import { classExamApi, ClassExamResponse } from '../../services/classExamApi';
import classService, { Classroom, ClassMember } from '../../services/class.service';
import BackButton from '../../components/ui/BackButton';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import { useToast } from '../../context/ToastContext';
import EssayReviewPanel from './EssayReviewPanel';
import { downloadExamWord } from '../../utils/examExport';

interface ScoreBucket { label: string; count: number; percentage: number; }
interface OptionStats { optionId: string; content: string; isCorrect: boolean; selectedCount: number; selectedRate: number; }
interface QuestionAnalytics {
  questionId: string; orderIndex: number; questionContent: string; skillTag: string;
  points: number; correctRate: number; correctCount: number; totalAnswered: number;
  optionStats: OptionStats[];
}
interface SkillAnalytics { skillTag: string; skillLabel: string; averageCorrectRate: number; totalQuestions: number; }
interface StudentScoreRow {
  resultId: string; studentId: string; studentName: string; studentEmail: string;
  totalScore: number; maxScore: number; scorePercentage: number; isPassed: boolean;
  timeTakenSeconds: number; cheatWarningCount: number; cheatDetails?: string; submittedAt: string;
  attemptNumber?: number;
}
interface AnalyticsData {
  examId: string; examTitle: string; examCode: string;
  totalSubmissions: number; averageScore: number; averagePercentage: number;
  maxScore: number; minScore: number; passCount: number; failCount: number;
  passRate: number; maxPossibleScore: number;
  scoreDistribution: ScoreBucket[];
  questionAnalytics: QuestionAnalytics[];
  skillAnalytics: SkillAnalytics[];
  studentScores: StudentScoreRow[];
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}p ${s}s`;
};

const parseCheatDetails = (detailsStr?: string) => {
  let tabCount = 0;
  let fullscreenCount = 0;
  if (!detailsStr) return { tabCount, fullscreenCount };
  try {
    const logs = JSON.parse(detailsStr);
    if (Array.isArray(logs)) {
      logs.forEach(log => {
        if (log.includes('Rời khỏi tab') || log.includes('Chuyển cửa sổ') || log.includes('Blur')) tabCount++;
        if (log.includes('Thoát toàn màn hình')) fullscreenCount++;
      });
    }
  } catch (e) {}
  return { tabCount, fullscreenCount };
};

const StudentScoreRowGroup = ({
  attempts,
  idx,
  examId,
  onDeleted
}: {
  attempts: StudentScoreRow[];
  idx: number;
  examId: string;
  onDeleted: () => void;
}) => {
  const toast = useToast();
  const [selectedIndex, setSelectedIndex] = useState(attempts.length - 1);
  const s = attempts[selectedIndex];
  const cheatInfo = parseCheatDetails(s.cheatDetails);

  const handleDelete = async () => {
    const confirmed = await toast.confirm("Bạn có chắc chắn muốn xóa kết quả thi này?", {
      title: "Xác nhận xóa kết quả",
      confirmLabel: "Xóa",
    });
    if (!confirmed) return;
    try {
      await api.delete(`/exams/${examId}/results/${s.resultId}`);
      toast.success("Đã xóa kết quả thi");
      onDeleted();
    } catch (err) {
      toast.error(getApiErrorMessage(err) || "Lỗi khi xóa kết quả");
    }
  };

  return (
    <tr className="hover:bg-gray-50/50 dark:hover:bg-night-elevated/40 transition-colors">
      <td className="px-4 py-3.5 font-bold text-gray-400 dark:text-night-muted tabular-nums">{idx + 1}</td>
      <td className="px-4 py-3.5">
        <p className="font-semibold text-vutru dark:text-night-text">{s.studentName}</p>
        <p className="text-xs text-vutruNhat dark:text-night-muted">{s.studentEmail}</p>
      </td>
      <td className="px-4 py-3.5 font-bold text-vutru dark:text-night-text tabular-nums">
        {s.totalScore.toFixed(2)}
        <span className="text-gray-400 dark:text-night-muted font-normal">/{s.maxScore.toFixed(2)}</span>
      </td>
      <td className="px-4 py-3.5 font-bold text-cam tabular-nums">{s.scorePercentage.toFixed(1)}%</td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
          s.isPassed 
            ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-800/30" 
            : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800/30"
        }`}>
          {s.isPassed ? <CheckCircle size={12} aria-hidden="true" /> : <XCircle size={12} aria-hidden="true" />}
          {s.isPassed ? "ĐẠT" : "TRƯỢT"}
        </span>
      </td>
      <td className="px-4 py-3.5 text-vutruNhat dark:text-night-muted tabular-nums">{formatTime(s.timeTakenSeconds)}</td>
      <td className="px-4 py-3.5">
        {cheatInfo.fullscreenCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-bold text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 px-2 py-1 rounded-full tabular-nums">
            <AlertTriangle size={12} aria-hidden="true" /> {cheatInfo.fullscreenCount}
          </span>
        ) : <span className="text-gray-400 dark:text-night-muted">-</span>}
      </td>
      <td className="px-4 py-3.5">
        {cheatInfo.tabCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-bold text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 px-2 py-1 rounded-full tabular-nums">
            <AlertTriangle size={12} aria-hidden="true" /> {cheatInfo.tabCount}
          </span>
        ) : <span className="text-gray-400 dark:text-night-muted">-</span>}
      </td>
      <td className="px-4 py-3.5 text-vutruNhat dark:text-night-muted text-xs tabular-nums">
        {s.submittedAt ? new Date(s.submittedAt).toLocaleString('vi-VN') : "-"}
      </td>
      <td className="px-4 py-3.5">
        {attempts.length > 1 ? (
          <Select
            className="text-xs font-bold border border-gray-300 dark:border-night-border dark:bg-night-surface dark:text-night-text rounded-lg px-2 py-1 focus:ring-2 focus:ring-cam focus:border-cam"
            value={String(selectedIndex)}
            onChange={(v) => setSelectedIndex(Number(v))}
            options={attempts.map((att, i) => ({ value: String(i), label: `Lần ${att.attemptNumber || i + 1}` }))}
          />
        ) : (
          <span className="text-xs text-gray-500 dark:text-night-muted font-bold px-2">Lần {s.attemptNumber || 1}</span>
        )}
      </td>
      <td className="px-4 py-3.5 text-right flex items-center justify-end gap-2">
        <Link 
          to={`/exams/results/${s.resultId}`} 
          className="text-sm font-bold text-cam hover:underline px-2.5 py-1 rounded-lg hover:bg-cam/10 transition-colors"
        >
          Chi tiết
        </Link>
        <button 
          type="button"
          onClick={handleDelete} 
          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 p-1.5 rounded-lg transition-colors" 
          title="Xóa kết quả"
          aria-label="Xóa kết quả thi của thí sinh"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
};

const ExamAnalytics = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ['overview', 'questions', 'students', 'essays'] as const;
  type TabType = typeof validTabs[number];

  const tabParam = searchParams.get('tab') as TabType | null;
  const activeTab: TabType = tabParam && validTabs.includes(tabParam) ? tabParam : 'overview';

  const handleTabChange = (nextTab: TabType) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (nextTab === 'overview') {
        next.delete('tab');
      } else {
        next.set('tab', nextTab);
      }
      return next;
    }, { replace: true });
  };

  const toast = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof StudentScoreRow; direction: 'asc' | 'desc' } | null>(null);

  const [assignedClasses, setAssignedClasses] = useState<(ClassExamResponse & { className: string })[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [classMembers, setClassMembers] = useState<ClassMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submissionStatusTab, setSubmissionStatusTab] = useState<'submitted' | 'missing'>('submitted');

  // Search & Filter states
  const [studentSearch, setStudentSearch] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState<'ALL' | 'PASSED' | 'FAILED' | 'CHEAT'>('ALL');
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState<'ALL' | 'HARD' | 'MEDIUM' | 'EASY'>('ALL');
  const [questionSkillFilter, setQuestionSkillFilter] = useState<string>('ALL');

  useEffect(() => {
    if (selectedClassId === "all") {
      setClassMembers([]);
      setSubmissionStatusTab('submitted');
      return;
    }
    let mounted = true;
    setLoadingMembers(true);
    classService.getMembers(selectedClassId).then(members => {
      if (mounted) setClassMembers(members);
    }).catch(console.error).finally(() => {
      if (mounted) setLoadingMembers(false);
    });
    return () => { mounted = false; };
  }, [selectedClassId]);

  const groupedStudents = useMemo(() => {
    if (!data?.studentScores) return [];
    
    const groups: Record<string, StudentScoreRow[]> = {};
    data.studentScores.forEach(s => {
      if (!groups[s.studentId]) groups[s.studentId] = [];
      groups[s.studentId].push(s);
    });
    
    Object.values(groups).forEach(attempts => {
      attempts.sort((a, b) => new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime());
    });
    
    let sortableItems = Object.values(groups);
    if (sortConfig !== null) {
      sortableItems.sort((aGroup, bGroup) => {
        let a = aGroup[aGroup.length - 1];
        let b = bGroup[bGroup.length - 1];
        
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const filteredGroupedStudents = useMemo(() => {
    let result = groupedStudents;

    // Filter by class
    if (selectedClassId !== "all") {
      const studentUserIds = new Set(classMembers.filter(m => m.role === 'STUDENT').map(m => m.userId));
      result = result.filter(attempts => studentUserIds.has(attempts[0].studentId));
    }

    // Filter by search keyword (name / email)
    if (studentSearch.trim()) {
      const q = studentSearch.trim().toLowerCase();
      result = result.filter(attempts => {
        const latest = attempts[attempts.length - 1];
        return (
          latest.studentName.toLowerCase().includes(q) ||
          latest.studentEmail.toLowerCase().includes(q)
        );
      });
    }

    // Filter by status (Passed / Failed / Cheat)
    if (studentStatusFilter === 'PASSED') {
      result = result.filter(attempts => attempts[attempts.length - 1].isPassed);
    } else if (studentStatusFilter === 'FAILED') {
      result = result.filter(attempts => !attempts[attempts.length - 1].isPassed);
    } else if (studentStatusFilter === 'CHEAT') {
      result = result.filter(attempts => {
        const latest = attempts[attempts.length - 1];
        const cheat = parseCheatDetails(latest.cheatDetails);
        return (latest.cheatWarningCount > 0 || cheat.tabCount > 0 || cheat.fullscreenCount > 0);
      });
    }

    return result;
  }, [groupedStudents, selectedClassId, classMembers, studentSearch, studentStatusFilter]);

  const missingStudents = useMemo(() => {
    if (selectedClassId === "all") return [];
    const submittedUserIds = new Set(groupedStudents.map(attempts => attempts[0].studentId));
    let result = classMembers.filter(m => m.role === 'STUDENT' && !submittedUserIds.has(m.userId));
    if (studentSearch.trim()) {
      const q = studentSearch.trim().toLowerCase();
      result = result.filter(m => m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
    }
    return result;
  }, [groupedStudents, selectedClassId, classMembers, studentSearch]);

  // Filter questions by difficulty & skill
  const filteredQuestions = useMemo(() => {
    if (!data?.questionAnalytics) return [];
    let list = data.questionAnalytics;

    if (questionDifficultyFilter === 'HARD') {
      list = list.filter(q => q.correctRate < 40);
    } else if (questionDifficultyFilter === 'MEDIUM') {
      list = list.filter(q => q.correctRate >= 40 && q.correctRate < 70);
    } else if (questionDifficultyFilter === 'EASY') {
      list = list.filter(q => q.correctRate >= 70);
    }

    if (questionSkillFilter !== 'ALL') {
      list = list.filter(q => q.skillTag === questionSkillFilter);
    }

    return list;
  }, [data?.questionAnalytics, questionDifficultyFilter, questionSkillFilter]);

  // Top performers & most difficult question
  const topStudents = useMemo(() => {
    if (!groupedStudents.length) return [];
    return [...groupedStudents]
      .map(attempts => attempts[attempts.length - 1])
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 3);
  }, [groupedStudents]);

  const mostDifficultQuestion = useMemo(() => {
    if (!data?.questionAnalytics || data.questionAnalytics.length === 0) return null;
    return [...data.questionAnalytics].sort((a, b) => a.correctRate - b.correctRate)[0];
  }, [data?.questionAnalytics]);

  const handleSort = (key: keyof StudentScoreRow) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/exams/${id}/analytics`);
      setData(res.data);
      
      try {
        const [classExams, myClasses] = await Promise.all([
          classExamApi.getClassExamsByExamId(id),
          classService.getMyClasses()
        ]);
        const classes = myClasses.content || (myClasses as any).data?.content || [];
        const enriched = classExams.map(ce => {
          const cls = classes.find((c: Classroom) => c.id === ce.classroomId);
          return { ...ce, className: cls?.name || "Lớp học ẩn" };
        });
        setAssignedClasses(enriched);
      } catch (e) {
        console.error("Lỗi tải thông tin lớp học", e);
      }
      
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Không thể tải dữ liệu báo cáo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const [regrading, setRegrading] = useState(false);
  const handleRegradeShortAnswers = async () => {
    const ok = await toast.confirm(
      "Chấm lại toàn bộ câu trả lời ngắn / điền khuyết của các bài đã nộp? Đáp án sẽ được so khớp không phân biệt hoa thường và bỏ qua dấu câu ở đầu/cuối.",
      { title: "Chấm lại câu trả lời ngắn", confirmLabel: "Chấm lại" }
    );
    if (!ok) return;
    setRegrading(true);
    try {
      const res = await api.post(`/exams/${id}/regrade-short-answers`);
      toast.success(res.data?.data || "Đã chấm lại");
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không chấm lại được. Thử lại nhé."));
    } finally {
      setRegrading(false);
    }
  };

  const handleExportExcel = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/exams/${id}/export-excel`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `bangdiem_${data?.examCode}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Lỗi khi tải file Excel");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <LoadingOverlay text="Đang tải báo cáo phân tích..." />;

  if (error || !data) return (
    <div className="max-w-lg mx-auto mt-20 text-center p-8 bg-white dark:bg-night-surface rounded-3xl shadow-sm border border-gray-100 dark:border-night-border">
      <p className="text-red-500 mb-4 font-semibold">{error}</p>
      <Link to="/exams" className="btn btn-chinh">Quay lại danh sách đề thi</Link>
    </div>
  );

  const tabs = [
    { id: "overview", label: "Tổng quan" },
    { id: "questions", label: `Câu hỏi (${data.questionAnalytics.length})` },
    { id: "students", label: `Học sinh (${data.totalSubmissions})` },
    { id: "essays", label: "Chấm bài luận (AI)" },
  ];

  return (
    <div className="min-h-screen bg-kem dark:bg-night-page animate-fade-in pb-10 w-full overflow-y-auto -mx-3 sm:-mx-6 -my-4 sm:-my-6 sm:w-[calc(100%+3rem)] w-[calc(100%+1.5rem)] text-vutru dark:text-night-text">
      <main className="mx-auto p-4 sm:p-6 pb-20 w-full max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <BackButton fallbackUrl="/exams" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-vutru dark:text-night-text font-heading leading-tight">{data.examTitle}</h1>
              <p className="text-sm text-vutruNhat dark:text-night-muted mt-1 flex items-center gap-2">
                <span>Mã đề:</span>
                <span className="font-bold text-gray-700 dark:text-night-text bg-gray-100 dark:bg-night-elevated px-2 py-0.5 rounded-md border border-gray-200 dark:border-night-border">{data.examCode}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button onClick={fetchData} variant="outline" className="flex-1 md:flex-none bg-white dark:bg-night-surface border-gray-200 dark:border-night-border text-vutru dark:text-night-text hover:border-cam/50">
              <RefreshCw size={15} aria-hidden="true" /> Làm mới
            </Button>
            <Button onClick={handleRegradeShortAnswers} isLoading={regrading} disabled={data.totalSubmissions === 0} variant="outline" className="flex-1 md:flex-none bg-white dark:bg-night-surface border-gray-200 dark:border-night-border text-vutru dark:text-night-text hover:border-cam/50" title="Chấm lại câu trả lời ngắn / điền khuyết theo quy tắc so khớp mới">
              <CheckCircle size={15} aria-hidden="true" /> Chấm lại câu ngắn
            </Button>
            <Button onClick={() => downloadExamWord(id!).catch(() => toast.error('Không tải được đề'))} variant="outline" className="flex-1 md:flex-none bg-white dark:bg-night-surface border-gray-200 dark:border-night-border text-vutru dark:text-night-text hover:border-cam/50" title="Tải đề và đáp án dạng Word">
              <Download size={15} aria-hidden="true" /> Tải đề Word
            </Button>
            <Button onClick={handleExportExcel} isLoading={downloading} disabled={data.totalSubmissions === 0} variant="primary" className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 border-green-600 text-white shadow-soft">
              <Download size={15} aria-hidden="true" /> Xuất Excel
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-gray-100 dark:bg-night-elevated rounded-2xl p-1 mb-6 w-fit border border-gray-200 dark:border-night-border" role="tablist" aria-label="Phân mục báo cáo">
          {tabs.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => handleTabChange(t.id as TabType)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === t.id
                  ? "bg-white dark:bg-night-surface shadow-sm text-vutru dark:text-night-text border border-gray-100 dark:border-night-border"
                  : "text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {data.totalSubmissions === 0 && (
          <div className="bg-cam/5 dark:bg-cam/10 border border-cam/20 rounded-2xl p-8 text-center mb-6">
            <p className="font-bold text-camDam dark:text-cam">Chưa có học sinh nào nộp bài</p>
            <p className="text-camDam/70 dark:text-cam/80 text-sm mt-1">Báo cáo sẽ hiển thị đầy đủ ngay sau khi có học sinh nộp bài.</p>
          </div>
        )}

        {/* ── TAB 1: TỔNG QUAN ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Users, label: "Đã nộp bài", value: data.totalSubmissions },
                { icon: TrendingUp, label: "Điểm TB", value: `${data.averageScore.toFixed(2)} (${data.averagePercentage.toFixed(1)}%)` },
                { icon: Award, label: "Tỉ lệ đạt", value: `${data.passRate.toFixed(1)}%`, sub: `${data.passCount} đạt / ${data.failCount} trượt` },
                { icon: Target, label: "Điểm cao nhất", value: data.maxScore.toFixed(2), sub: `Thấp nhất: ${data.minScore.toFixed(2)}` },
              ].map(({ icon: Icon, label, value, sub }) => (
                <div key={label} className="bg-white dark:bg-night-surface rounded-2xl p-5 border border-gray-100 dark:border-night-border shadow-sm">
                  <div className="w-10 h-10 bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border text-vutru dark:text-night-text rounded-xl flex items-center justify-center mb-3">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <p className="text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-xl font-black text-vutru dark:text-night-text tabular-nums">{value}</p>
                  {sub && <p className="text-xs text-gray-400 dark:text-night-muted mt-0.5 tabular-nums">{sub}</p>}
                </div>
              ))}
            </div>

            {/* Quick Highlights / Insights Box */}
            {data.totalSubmissions > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Performers Banner */}
                {topStudents.length > 0 && (
                  <div className="bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                    <div className="p-3 bg-gray-100 dark:bg-night-elevated text-vutru dark:text-night-text rounded-2xl shrink-0 border border-gray-200 dark:border-night-border">
                      <Trophy size={22} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-vutru dark:text-night-text">Top điểm cao nhất</h4>
                      <div className="mt-2 space-y-1.5">
                        {topStudents.map((st, i) => (
                          <div key={st.resultId} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 truncate max-w-[200px]">
                              <span className="w-5 h-5 rounded-md bg-gray-100 dark:bg-night-elevated border border-gray-200 dark:border-night-border text-[10px] font-bold text-vutruNhat dark:text-night-muted flex items-center justify-center shrink-0">
                                #{i + 1}
                              </span>
                              <span className="font-semibold text-vutru dark:text-night-text truncate">
                                {st.studentName}
                              </span>
                            </div>
                            <span className="font-bold text-cam tabular-nums">
                              {st.totalScore.toFixed(2)}đ ({st.scorePercentage.toFixed(1)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Most Challenging Question Banner */}
                {mostDifficultQuestion && (
                  <div className="bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                    <div className="p-3 bg-gray-100 dark:bg-night-elevated text-vutru dark:text-night-text rounded-2xl shrink-0 border border-gray-200 dark:border-night-border">
                      <HelpCircle size={22} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-vutru dark:text-night-text">Câu hỏi phân hóa cao nhất</h4>
                      <p className="text-xs text-vutruNhat dark:text-night-muted mt-1 line-clamp-1">
                        Câu {mostDifficultQuestion.orderIndex + 1}: {mostDifficultQuestion.questionContent || 'Xem chi tiết trong tab Câu hỏi'}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-bold bg-gray-100 dark:bg-night-elevated text-vutru dark:text-night-text border border-gray-200 dark:border-night-border px-2.5 py-0.5 rounded-full tabular-nums">
                          Chỉ {mostDifficultQuestion.correctRate.toFixed(1)}% làm đúng ({mostDifficultQuestion.correctCount}/{mostDifficultQuestion.totalAnswered} học sinh)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Charts Section: Distribution + Question Difficulty + Radar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score Distribution */}
              <div className="bg-white dark:bg-night-surface rounded-2xl p-6 border border-gray-100 dark:border-night-border shadow-sm">
                <h3 className="font-bold text-vutru dark:text-night-text mb-4">Phân phối phổ điểm</h3>
                {data.totalSubmissions > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data.scoreDistribution} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                        formatter={(v: any) => [`${v} học sinh`, "Số lượng"]} 
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {data.scoreDistribution.map((_, i) => (
                          <Cell key={i} fill={i >= 6 ? "#22c55e" : i >= 5 ? "#f97316" : "#ef4444"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-gray-400 dark:text-night-muted text-sm">Chưa có dữ liệu</div>
                )}
              </div>

              {/* Question Difficulty */}
              <div className="bg-white dark:bg-night-surface rounded-2xl p-6 border border-gray-100 dark:border-night-border shadow-sm">
                <h3 className="font-bold text-vutru dark:text-night-text mb-4">Tỷ lệ làm đúng từng câu hỏi (%)</h3>
                {data.questionAnalytics.length > 0 && data.totalSubmissions > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={data.questionAnalytics.map(q => ({ name: `C${q.orderIndex + 1}`, rate: Math.round(q.correctRate) }))}
                      margin={{ top: 5, right: 5, bottom: 5, left: -10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#888' }} unit="%" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                        formatter={(v: any) => [`${v}%`, 'Tỷ lệ đúng']} 
                      />
                      <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                        {data.questionAnalytics.map((q, i) => (
                          <Cell key={i} fill={q.correctRate >= 60 ? "#22c55e" : q.correctRate >= 40 ? "#f97316" : "#ef4444"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-gray-400 dark:text-night-muted text-sm">Chưa có dữ liệu</div>
                )}
              </div>
            </div>

            {/* Radar Skill Analytics */}
            {data.skillAnalytics && data.skillAnalytics.length > 0 && (
              <div className="bg-white dark:bg-night-surface rounded-2xl p-6 border border-gray-100 dark:border-night-border shadow-sm">
                <h3 className="font-bold text-vutru dark:text-night-text mb-4">Ma trận Kỹ năng & Dạng bài (%)</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  <div className="lg:col-span-2 h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.skillAnalytics.map(s => ({
                        skill: s.skillLabel || s.skillTag,
                        rate: Math.round(s.averageCorrectRate),
                      }))}>
                        <PolarGrid stroke="#e5e7eb" opacity={0.6} />
                        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#888' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#aaa' }} />
                        <Radar name="Tỷ lệ đúng" dataKey="rate" stroke="#f97316" fill="#f97316" fillOpacity={0.4} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                          formatter={(v: any) => [`${v}%`, 'Đúng TB']}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted">
                      Chi tiết kỹ năng ({data.skillAnalytics.length})
                    </h4>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {data.skillAnalytics.map(s => (
                        <div key={s.skillTag} className="p-2.5 rounded-xl bg-gray-50 dark:bg-night-elevated border border-gray-100 dark:border-night-border flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-vutru dark:text-night-text">{s.skillLabel || s.skillTag}</span>
                            <span className="text-vutruNhat dark:text-night-muted ml-1.5">({s.totalQuestions} câu)</span>
                          </div>
                          <span className={`font-bold tabular-nums ${s.averageCorrectRate >= 60 ? 'text-green-600 dark:text-green-400' : s.averageCorrectRate >= 40 ? 'text-cam' : 'text-red-500'}`}>
                            {s.averageCorrectRate.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: CÂU HỎI ── */}
        {activeTab === "questions" && (
          <div className="space-y-4">
            {/* Filter Bar for Questions */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted flex items-center gap-1">
                  <Filter size={14} aria-hidden="true" /> Lọc độ khó:
                </span>
                {[
                  { key: 'ALL', label: `Tất cả (${data.questionAnalytics.length})` },
                  { key: 'HARD', label: `Khó <40% (${data.questionAnalytics.filter(q => q.correctRate < 40).length})` },
                  { key: 'MEDIUM', label: `Vừa 40-70% (${data.questionAnalytics.filter(q => q.correctRate >= 40 && q.correctRate < 70).length})` },
                  { key: 'EASY', label: `Dễ >70% (${data.questionAnalytics.filter(q => q.correctRate >= 70).length})` },
                ].map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setQuestionDifficultyFilter(f.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      questionDifficultyFilter === f.key
                        ? 'bg-cam text-white shadow-soft'
                        : 'bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Skill Filter */}
              {data.skillAnalytics && data.skillAnalytics.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-vutruNhat dark:text-night-muted">Kỹ năng:</span>
                  <Select
                    value={questionSkillFilter}
                    onChange={(v) => setQuestionSkillFilter(v)}
                    className="text-xs font-bold border border-gray-300 dark:border-night-border dark:bg-night-elevated dark:text-night-text rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-cam focus:border-cam"
                    options={[
                      { value: 'ALL', label: 'Tất cả kỹ năng' },
                      ...data.skillAnalytics.map(s => ({ value: s.skillTag, label: s.skillLabel || s.skillTag })),
                    ]}
                  />
                </div>
              )}
            </div>

            {/* Questions List */}
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map(q => (
                <div key={q.questionId} className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-sm overflow-hidden transition-all hover:border-cam/30">
                  <div className="flex items-start gap-4 p-5 border-b border-gray-50 dark:border-night-border">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 text-sm shadow-soft ${
                      q.correctRate >= 60 ? "bg-green-500" : q.correctRate >= 40 ? "bg-orange-400" : "bg-red-500"
                    }`}>
                      {q.orderIndex + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-vutru dark:text-night-text line-clamp-2 text-sm leading-relaxed">
                        {q.questionContent || "(Câu hỏi trắc nghiệm/hình ảnh)"}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs font-bold bg-gray-100 dark:bg-night-elevated text-gray-600 dark:text-night-muted px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-night-border">
                          {q.skillTag}
                        </span>
                        <span className="text-xs font-bold text-cam tabular-nums bg-cam/10 px-2.5 py-0.5 rounded-full">
                          {q.points} điểm
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full tabular-nums ${
                          q.correctRate >= 60 
                            ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" 
                            : q.correctRate >= 40 
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400" 
                            : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                        }`}>
                          Tỉ lệ đúng: {q.correctRate.toFixed(1)}% ({q.correctCount}/{q.totalAnswered})
                        </span>
                      </div>
                    </div>
                  </div>

                  {q.optionStats.length > 0 && (
                    <div className="p-5 space-y-2.5 bg-gray-50/50 dark:bg-night-elevated/20">
                      {q.optionStats.map((opt, oIdx) => (
                        <div key={opt.optionId} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${
                            opt.isCorrect 
                              ? "bg-green-500 text-white" 
                              : "bg-gray-200 dark:bg-night-elevated text-gray-600 dark:text-night-muted"
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </div>
                          <div className="flex-1 relative">
                            <div className="h-8 bg-gray-100 dark:bg-night-elevated rounded-xl overflow-hidden">
                              <div 
                                className={`h-full rounded-xl transition-all ${opt.isCorrect ? "bg-green-400 dark:bg-green-500" : "bg-blue-300 dark:bg-blue-500"}`}
                                style={{ width: `${Math.max(opt.selectedRate, 0)}%`, opacity: 0.6 }} 
                              />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-between px-3">
                              <span className="text-xs font-semibold text-gray-700 dark:text-night-text truncate max-w-sm">
                                {opt.content || "..."}
                              </span>
                              <span className="text-xs font-bold text-gray-600 dark:text-night-muted ml-2 shrink-0 tabular-nums">
                                {opt.selectedCount} ({opt.selectedRate.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                          {opt.isCorrect && <CheckCircle size={16} className="text-green-500 shrink-0" aria-hidden="true" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-12 text-center bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border text-vutruNhat">
                Không tìm thấy câu hỏi phù hợp với bộ lọc.
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: HỌC SINH ── */}
        {activeTab === "students" && (
          <div className="space-y-4">
            {/* Action & Filter Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                {/* Class selector */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted">Lớp:</label>
                  <Select
                    className="text-xs font-bold border border-gray-300 dark:border-night-border dark:bg-night-elevated dark:text-night-text rounded-xl px-3 py-2 focus:ring-2 focus:ring-cam focus:border-cam"
                    value={selectedClassId}
                    onChange={(v) => setSelectedClassId(v)}
                    options={[
                      { value: 'all', label: `Tất cả học sinh (${groupedStudents.length})` },
                      ...assignedClasses.map(c => ({ value: c.classroomId, label: c.className })),
                    ]}
                  />
                </div>

                {/* Status Pills */}
                <div className="flex items-center gap-1.5">
                  {[
                    { key: 'ALL', label: 'Tất cả' },
                    { key: 'PASSED', label: 'Đạt' },
                    { key: 'FAILED', label: 'Trượt' },
                    { key: 'CHEAT', label: 'Cảnh báo vi phạm' },
                  ].map(st => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setStudentStatusFilter(st.key as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                        studentStatusFilter === st.key
                          ? 'bg-cam text-white shadow-soft'
                          : 'bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text'
                      }`}
                    >
                      {st.key === 'CHEAT' && <AlertTriangle size={13} aria-hidden="true" />}
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Search input */}
                <div className="relative flex-1 sm:w-64">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Tìm tên, email học sinh…"
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl focus:outline-none focus:border-cam focus:ring-2 focus:ring-cam/10 text-vutru dark:text-night-text"
                  />
                </div>

                {/* Sub-tab if specific class selected */}
                {selectedClassId !== "all" && (
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-night-elevated p-1 rounded-xl">
                    <button 
                      type="button"
                      onClick={() => setSubmissionStatusTab('submitted')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                        submissionStatusTab === 'submitted' 
                          ? 'bg-white dark:bg-night-surface text-cam shadow-sm' 
                          : 'text-gray-500 dark:text-night-muted hover:text-gray-700'
                      }`}
                    >
                      Đã làm ({filteredGroupedStudents.length})
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSubmissionStatusTab('missing')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                        submissionStatusTab === 'missing' 
                          ? 'bg-white dark:bg-night-surface text-cam shadow-sm' 
                          : 'text-gray-500 dark:text-night-muted hover:text-gray-700'
                      }`}
                    >
                      Chưa làm ({missingStudents.length})
                    </button>
                  </div>
                )}
              </div>
            </div>

            {selectedClassId !== "all" && loadingMembers ? (
              <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-4 border-cam border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : submissionStatusTab === 'missing' && selectedClassId !== "all" ? (
              <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-night-elevated border-b border-gray-100 dark:border-night-border">
                      <tr>
                        <th className="text-left px-4 py-3 font-bold text-vutruNhat dark:text-night-muted text-xs uppercase tracking-wider w-16">STT</th>
                        <th className="text-left px-4 py-3 font-bold text-vutruNhat dark:text-night-muted text-xs uppercase tracking-wider">Học sinh</th>
                        <th className="text-left px-4 py-3 font-bold text-vutruNhat dark:text-night-muted text-xs uppercase tracking-wider">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-night-border">
                      {missingStudents.length > 0 ? (
                        missingStudents.map((student, idx) => (
                          <tr key={student.userId} className="hover:bg-gray-50/50 dark:hover:bg-night-elevated/40 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-gray-400 dark:text-night-muted tabular-nums">{idx + 1}</td>
                            <td className="px-4 py-3.5">
                              <p className="font-semibold text-vutru dark:text-night-text">{student.fullName}</p>
                              <p className="text-xs text-vutruNhat dark:text-night-muted">{student.email}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-night-elevated text-gray-600 dark:text-night-muted border border-gray-200 dark:border-night-border">
                                Chưa nộp bài
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-12 text-center text-gray-500 dark:text-night-muted">
                            Tất cả học sinh trong lớp đã hoàn thành bài thi.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-night-elevated border-b border-gray-100 dark:border-night-border">
                      <tr>
                        <th className="text-left px-4 py-3 font-bold text-vutruNhat dark:text-night-muted text-xs uppercase tracking-wider w-12">STT</th>
                        <th 
                          className="text-left px-4 py-3 font-bold text-vutruNhat dark:text-night-muted text-xs uppercase tracking-wider cursor-pointer hover:text-cam select-none"
                          onClick={() => handleSort('studentName')}
                          aria-sort={sortConfig?.key === 'studentName' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <div className="flex items-center gap-1">
                            <span>Học sinh</span>
                            {sortConfig?.key === 'studentName' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                          </div>
                        </th>
                        <th 
                          className="text-left px-4 py-3 font-bold text-vutruNhat dark:text-night-muted text-xs uppercase tracking-wider cursor-pointer hover:text-cam select-none"
                          onClick={() => handleSort('totalScore')}
                          aria-sort={sortConfig?.key === 'totalScore' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <div className="flex items-center gap-1">
                            <span>Điểm</span>
                            {sortConfig?.key === 'totalScore' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                          </div>
                        </th>
                        <th 
                          className="text-left px-4 py-3 font-bold text-vutruNhat dark:text-night-muted text-xs uppercase tracking-wider cursor-pointer hover:text-cam select-none"
                          onClick={() => handleSort('scorePercentage')}
                          aria-sort={sortConfig?.key === 'scorePercentage' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <div className="flex items-center gap-1">
                            <span>%</span>
                            {sortConfig?.key === 'scorePercentage' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                          </div>
                        </th>
                        <th className="text-left px-4 py-3 font-bold text-vutruNhat dark:text-night-muted text-xs uppercase tracking-wider">Kết quả</th>
                        <th 
                          className="text-left px-4 py-3 font-bold text-vutruNhat dark:text-night-muted text-xs uppercase tracking-wider cursor-pointer hover:text-cam select-none"
                          onClick={() => handleSort('timeTakenSeconds')}
                          aria-sort={sortConfig?.key === 'timeTakenSeconds' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <div className="flex items-center gap-1">
                            <span>Thời gian</span>
                            {sortConfig?.key === 'timeTakenSeconds' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                          </div>
                        </th>
                        <th className="text-left px-4 py-3 font-bold text-vutruNhat dark:text-night-muted text-xs uppercase tracking-wider">Thoát MH</th>
                        <th className="text-left px-4 py-3 font-bold text-vutruNhat dark:text-night-muted text-xs uppercase tracking-wider">Chuyển Tab</th>
                        <th 
                          className="text-left px-4 py-3 font-bold text-vutruNhat dark:text-night-muted text-xs uppercase tracking-wider cursor-pointer hover:text-cam select-none"
                          onClick={() => handleSort('submittedAt')}
                          aria-sort={sortConfig?.key === 'submittedAt' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <div className="flex items-center gap-1">
                            <span>Nộp lúc</span>
                            {sortConfig?.key === 'submittedAt' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                          </div>
                        </th>
                        <th className="text-left px-4 py-3 font-bold text-vutruNhat dark:text-night-muted text-xs uppercase tracking-wider">Lần thi</th>
                        <th className="text-right px-4 py-3 font-bold text-vutruNhat dark:text-night-muted text-xs uppercase tracking-wider">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-night-border">
                      {filteredGroupedStudents.length > 0 ? (
                        filteredGroupedStudents.map((attempts, idx) => (
                          <StudentScoreRowGroup
                            key={attempts[0].studentId}
                            attempts={attempts}
                            idx={idx}
                            examId={id!}
                            onDeleted={fetchData}
                          />
                        ))
                      ) : (
                        <tr>
                          <td colSpan={11} className="px-4 py-12 text-center text-gray-500 dark:text-night-muted">
                            {studentSearch ? 'Không tìm thấy học sinh nào khớp với từ khóa.' : 'Chưa có học sinh nào nộp bài.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: CHẤM BÀI LUẬN (AI) ── */}
        {activeTab === "essays" && id && (
          <EssayReviewPanel examId={id} />
        )}
      </main>
    </div>
  );
};

export default ExamAnalytics;