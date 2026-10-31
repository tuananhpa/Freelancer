import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Flag, AlertTriangle, ClipboardList, GripVertical } from 'lucide-react';
import api from '../../services/api';
import DOMPurify from 'dompurify';
import { useToast } from '../../context/ToastContext';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import Button from '../../components/ui/Button';
import BackButton from '../../components/ui/BackButton';
import { sounds } from '../../utils/soundEffects';
import { useAuth } from '../../context/AuthContext';
import { getStatementLabel } from '../exam/examQuestionTypes';
import PdfViewer from '../exam/pdf-import/PdfViewer';
import { SlimAudioPlayer, ExamAudioTracksPlayer } from '../../components/common/LessonMediaPlayer';
import './ExamSplit.css';

import Portal from '../../components/ui/Portal';
/** Tỉ lệ bề ngang (%) của phần đề thi khi hiển thị 2 cột. */
const SPLIT_RATIO_KEY = 'uranus-exam-split-ratio';
const DEFAULT_SPLIT = 60;
const MIN_SPLIT = 25;
const MAX_SPLIT = 80;

interface Exam {
  id: string;
  title: string;
  durationMinutes: number;
  examType?: string;
  pdfUrl?: string;
  audioUrl?: string;
  audioTracks?: { label: string; url: string }[];
  maxAttempts: number;
  userAttemptCount?: number;
  latestResultId?: string;
  questions: Question[];
}

interface Question {
  id: string;
  content: string;
  points: number;
  questionType: string;
  groupId?: string;
  options: Option[];
}

interface Option {
  id: string;
  content: string;
}

interface PassageGroup {
  groupId: string;
  groupTitle?: string;
  passageText: string;
  audioUrl?: string;
}

const ExamTake = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const libraryResourceId = searchParams.get('libraryResourceId') || undefined;
  const fromParam = searchParams.get('from') || undefined;
  const returnUrl = fromParam || (libraryResourceId ? `/library/resources/${libraryResourceId}` : undefined);
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [passageGroups, setPassageGroups] = useState<Record<string, PassageGroup>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [fontSize, setFontSize] = useState<number>(0); // 0: normal, 1: large, 2: x-large
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [showQuestionPanel, setShowQuestionPanel] = useState(true);
  const [showAnswerSheet, setShowAnswerSheet] = useState(true);
  const [showMobilePalette, setShowMobilePalette] = useState(false);

  const [accessCode, setAccessCode] = useState('');
  const [isPromptingAccessCode, setIsPromptingAccessCode] = useState(false);
  const [accessError, setAccessError] = useState('');

  // Anti-cheat state
  const [showCheatModal, setShowCheatModal] = useState(false);
  const cheatDataRef = useRef({ count: 0, details: [] as string[] });
  const submittingRef = useRef(false);

  // ── Thanh kéo chỉnh tỉ lệ: phần đề thi (trái) / phần chọn đáp án (phải) ──
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    try {
      const stored = Number(localStorage.getItem(SPLIT_RATIO_KEY));
      if (Number.isFinite(stored) && stored >= MIN_SPLIT && stored <= MAX_SPLIT) return stored;
    } catch { /* localStorage có thể bị chặn */ }
    return DEFAULT_SPLIT;
  });
  const [isResizing, setIsResizing] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(SPLIT_RATIO_KEY, String(Math.round(splitRatio))); } catch { /* bỏ qua */ }
  }, [splitRatio]);

  const clampRatio = (value: number) => Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, value));

  const handleResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = splitContainerRef.current;
    if (!container) return;
    e.preventDefault();

    const handle = e.currentTarget;
    const pointerId = e.pointerId;
    handle.setPointerCapture(pointerId);
    setIsResizing(true);
    document.body.classList.add('exam-resizing');

    const onMove = (ev: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      setSplitRatio(clampRatio(((ev.clientX - rect.left) / rect.width) * 100));
    };
    const onEnd = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
      try { handle.releasePointerCapture(pointerId); } catch { /* con trỏ đã nhả */ }
      setIsResizing(false);
      document.body.classList.remove('exam-resizing');
    };

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
  }, []);

  // Dùng phím mũi tên khi thanh kéo đang được focus (hỗ trợ bàn phím)
  const handleResizeKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft') { e.preventDefault(); setSplitRatio((r) => clampRatio(r - step)); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setSplitRatio((r) => clampRatio(r + step)); }
    else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); setSplitRatio(DEFAULT_SPLIT); }
  }, []);

  // Dọn class trên body nếu component bị unmount giữa lúc đang kéo
  useEffect(() => () => { document.body.classList.remove('exam-resizing'); }, []);

  // Ref to track latest answers
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const fetchExamInfo = useCallback(async (code?: string) => {
    try {
      setLoading(true);
      setAccessError('');
      const res = await api.get(`/exams/${id}`, { params: { accessCode: code, libraryResourceId } });
      if (res.data.locked) {
        setShowAccessDenied(true);
        setLoading(false);
        return;
      }
      setExam(res.data);
      setIsPromptingAccessCode(false);
        setTimeLeft(res.data.durationMinutes * 60);
    } catch (err: any) {
      if (err.response?.data?.errorCode === 'ACCESS_CODE_REQUIRED' || err.response?.data?.errorCode === 'INVALID_ACCESS_CODE') {
        setIsPromptingAccessCode(true);
        if (code) {
          setAccessError('Mã truy cập không chính xác. Vui lòng thử lại.');
        }
      } else if (err.response?.status === 403) {
        setShowAccessDenied(true);
      } else {
        setError(err.response?.data?.message || 'Lỗi khi tải thông tin bài thi');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load exam info only initially
  useEffect(() => {
    if (id) fetchExamInfo();
  }, [id, fetchExamInfo]);

  const hasAutoStartedRef = useRef(false);
  useEffect(() => {
    if (
      libraryResourceId &&
      exam &&
      !hasStarted &&
      !starting &&
      !isPromptingAccessCode &&
      !showAccessDenied &&
      !hasAutoStartedRef.current
    ) {
      hasAutoStartedRef.current = true;
      handleStartExam();
    }
  }, [libraryResourceId, exam, hasStarted, starting, isPromptingAccessCode, showAccessDenied]);

  const handleStartExam = async () => {
    setStarting(true);
    try {
      const res = await api.post(`/exams/${id}/start`, null, { params: { accessCode: accessCode || undefined, libraryResourceId } });
      const data = res.data; // OngoingExamResponse

      if (data.examSnapshot) {
        const snapshot = data.examSnapshot;
        // Parse passage groups từ snapshot
        if (snapshot.groups && snapshot.groups.length > 0) {
          const groupMap: Record<string, PassageGroup> = {};
          snapshot.groups.forEach((g: any) => {
            groupMap[g.groupId] = {
              groupId: g.groupId,
              groupTitle: g.groupTitle,
              passageText: g.passageText || '',
              audioUrl: g.audioUrl || undefined,
            };
          });
          setPassageGroups(groupMap);
        }
        setExam({
          id: snapshot.examId,
          title: snapshot.examTitle,
          durationMinutes: snapshot.durationMinutes,
          examType: snapshot.examType,
          pdfUrl: snapshot.pdfUrl,
          audioUrl: snapshot.audioUrl,
          audioTracks: snapshot.audioTracks || [],
          maxAttempts: 0,
          questions: snapshot.questions.map((q: any) => ({
            id: q.questionId,
            content: q.content,
            points: q.points,
            questionType: q.questionType,
            groupId: q.groupId,
            options: (q.options || []).map((o: any) => ({
              id: o.optionId,
              content: o.content
            }))
          }))
        });
      }

      if (data.answers) {
        setAnswers(data.answers);
        answersRef.current = data.answers;
      }

      if (data.cheatWarningCount > 0) {
        cheatDataRef.current.count = data.cheatWarningCount;
        try {
          cheatDataRef.current.details = JSON.parse(data.cheatDetails || '[]');
        } catch (e) {
          cheatDataRef.current.details = [];
        }
      }

      if (data.elapsedSeconds > 0 && exam) {
        const remaining = exam.durationMinutes * 60 - data.elapsedSeconds;
        setTimeLeft(remaining > 0 ? remaining : 0);
      } else if (exam) {
        setTimeLeft(exam.durationMinutes * 60);
      }

      setHasStarted(true);
      
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.warn('Không thể bật full-screen:', err));
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setShowAccessDenied(true);
      } else {
        toast.error(err.response?.data?.message || 'Không thể bắt đầu bài thi. Vui lòng thử lại.');
      }
    } finally {
      setStarting(false);
    }
  };

  // Exam focus mode on document
  useEffect(() => {
    if (!hasStarted) return;
    document.documentElement.classList.add('exam-focus-mode');
    return () => document.documentElement.classList.remove('exam-focus-mode');
  }, [hasStarted]);

  // Anti-cheat & fullscreen
  useEffect(() => {
    if (!exam || loading || !hasStarted) return;

    let isWarning = false;

    const addCheatWarning = (reason: string) => {
      if (submittingRef.current || isWarning) return;
      isWarning = true;
      const now = new Date().toLocaleTimeString();
      cheatDataRef.current.count += 1;
      cheatDataRef.current.details.push(`[${now}] ${reason}`);
      setShowCheatModal(true);
      api.post(`/exams/${id}/draft`, {
        answers: answersRef.current,
        cheatWarningCount: cheatDataRef.current.count,
        cheatDetails: JSON.stringify(cheatDataRef.current.details),
      }).catch(() => {});
      setTimeout(() => { isWarning = false; }, 1000);
    };

    const onVisibilityChange = () => { if (document.hidden) addCheatWarning('Rời khỏi tab/trình duyệt'); };
    const onFullscreenChange = () => { if (!document.fullscreenElement && hasStarted && !submittingRef.current) addCheatWarning('Thoát toàn màn hình'); };
    const onBlur = () => { if (hasStarted && !submittingRef.current) addCheatWarning('Chuyển cửa sổ (Blur)'); };

    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [exam, loading, hasStarted]);

  // Timer
  useEffect(() => {
    if (!exam || loading || !hasStarted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          doSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam, loading, hasStarted]);

  // Auto-save
  useEffect(() => {
    if (!exam || !hasStarted) return;
    const autoSave = setInterval(async () => {
      try {
        await api.post(`/exams/${id}/draft`, {
          answers: answersRef.current,
          cheatWarningCount: cheatDataRef.current.count,
          cheatDetails: JSON.stringify(cheatDataRef.current.details),
        });
      } catch (e) { console.error('Lỗi auto-save', e); }
    }, 30000);
    return () => clearInterval(autoSave);
  }, [exam, id, hasStarted]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers(prev => {
      const next = { ...prev, [questionId]: optionId };
      answersRef.current = next;
      return next;
    });
  };

  const handleTextResponse = (questionId: string, text: string) => {
    setAnswers(prev => {
      const next = { ...prev, [questionId]: text };
      answersRef.current = next;
      return next;
    });
  };

  const handleStatementAnswer = (questionId: string, optionId: string, isTrue: boolean) => {
    setAnswers((prev) => {
      let current: Record<string, boolean> = {};
      try {
        const raw = prev[questionId];
        if (raw && raw.trim().startsWith('{')) current = JSON.parse(raw);
      } catch {
        current = {};
      }
      const next = {
        ...prev,
        [questionId]: JSON.stringify({ ...current, [optionId]: isTrue }),
      };
      answersRef.current = next;
      return next;
    });
  };

  const getStatementAnswers = (questionId: string): Record<string, boolean> => {
    try {
      const raw = answers[questionId];
      if (raw && raw.trim().startsWith('{')) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return {};
  };

  const isQuestionAnswered = (q: Question) => {
    const raw = answers[q.id];
    if (!raw) return false;
    if (q.questionType === 'TRUE_FALSE') {
      // Multi-statement: phải trả lời đủ tất cả các ý
      try {
        const map = JSON.parse(raw) as Record<string, boolean>;
        return q.options.every((o) => typeof map[o.id] === 'boolean');
      } catch {
        return false;
      }
    }
    return !!raw.trim();
  };

  const toggleFlag = (questionId: string) => {
    setFlagged(prev => {
      const next = new Set(prev);
      next.has(questionId) ? next.delete(questionId) : next.add(questionId);
      return next;
    });
  };

  // Keyboard shortcuts for exam taking (A/B/C/D, 1/2/3/4, F for flag, Left/Right arrow for questions)
  useEffect(() => {
    if (!hasStarted || showConfirmSubmit || showCheatModal || isPromptingAccessCode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const q = exam?.questions?.[currentIdx];
      if (!q) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIdx((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIdx((prev) => Math.min((exam?.questions?.length || 1) - 1, prev + 1));
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFlag(q.id);
      } else if (q.questionType !== 'ESSAY' && q.questionType !== 'SHORT_ANSWER' && q.questionType !== 'TRUE_FALSE') {
        const key = e.key.toUpperCase();
        let optIndex = -1;
        if (key === 'A' || key === '1') optIndex = 0;
        else if (key === 'B' || key === '2') optIndex = 1;
        else if (key === 'C' || key === '3') optIndex = 2;
        else if (key === 'D' || key === '4') optIndex = 3;
        else if (key === 'E' || key === '5') optIndex = 4;
        else if (key === 'F' || key === '6') optIndex = 5;

        if (optIndex >= 0 && optIndex < (q.options?.length || 0)) {
          e.preventDefault();
          handleSelectOption(q.id, q.options[optIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, showConfirmSubmit, showCheatModal, isPromptingAccessCode, exam, currentIdx]);

  const doSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await api.post(`/exams/${id}/submit`, {
        answers: answersRef.current,
        cheatWarningCount: cheatDataRef.current.count,
        cheatDetails: JSON.stringify(cheatDataRef.current.details),
      });
      sounds.submit();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      const params = new URLSearchParams();
      if (libraryResourceId) params.set('libraryResourceId', libraryResourceId);
      if (fromParam) params.set('from', fromParam);
      const qs = params.toString() ? `?${params.toString()}` : '';
      navigate(`/exams/results/${res.data}${qs}`, { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi nộp bài');
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [id, navigate]);

  const handleSubmitClick = () => {
    setShowConfirmSubmit(true);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  if (loading) return <LoadingOverlay text="Đang tải đề thi..." />;

  if (showAccessDenied) return (
    <Portal><div className="fixed inset-0 z-[99999] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
      <div className="bg-white dark:bg-night-surface w-full max-w-md rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center animate-fade-in">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <AlertTriangle size={40} />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-3">Truy cập bị chặn</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed font-medium">
          Bạn không có quyền truy cập bài thi này do bài thi không thuộc lớp của bạn.
        </p>
        <Button 
          onClick={() => navigate(returnUrl || '/')} 
          className="w-full py-3.5 text-lg rounded-2xl shadow-lg shadow-cam/20 font-bold"
          size="lg"
        >
          {returnUrl ? 'Quay lại' : 'Quay về màn hình chính'}
        </Button>
      </div>
    </div></Portal>
  );

  if (!exam && !isPromptingAccessCode) return <div className="p-8 text-center text-red-500">{error || 'Không tìm thấy bài thi'}</div>;

  if (isPromptingAccessCode) {
    return (
      <Portal><div className="fixed inset-0 z-[100] bg-kem dark:bg-night-page flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-night-surface rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-night-border text-center">
          <div className="w-20 h-20 bg-cam/10 text-cam rounded-full flex items-center justify-center mx-auto mb-6">
            <ClipboardList size={40} />
          </div>
          <h2 className="text-2xl font-bold text-vutru mb-2">Đề thi được bảo vệ</h2>
          <p className="text-vutruNhat text-sm mb-8">Bạn cần nhập mã truy cập để có thể làm bài thi này.</p>
          <form onSubmit={(e) => { e.preventDefault(); fetchExamInfo(accessCode); }} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Nhập mã truy cập..."
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full px-4 py-4 rounded-2xl border-2 border-gray-100 dark:border-night-border focus:border-cam outline-none text-center font-bold tracking-widest text-lg bg-gray-50 dark:bg-night-elevated"
                autoFocus
              />
              {accessError && <p className="text-red-500 text-sm mt-2 text-left font-medium">{accessError}</p>}
            </div>
            <button type="submit" disabled={!accessCode.trim()} className="btn btn-chinh w-full py-4 justify-center text-lg shadow-xl shadow-cam/20 rounded-2xl">
              Xác nhận
            </button>
          </form>
          <button onClick={() => returnUrl ? navigate(returnUrl) : navigate(-1)} className="text-sm font-bold text-gray-500 hover:text-gray-700 mt-6">
            Quay lại
          </button>
        </div>
      </div></Portal>
    );
  }

  if (!exam) return null;

  const questions = exam.questions;
  const totalCount = questions.length;
  const answeredCount = questions.filter((q) => isQuestionAnswered(q)).length;
  const currentQ = questions[currentIdx] || null;
  const unansweredCount = totalCount - answeredCount;

  // Bố cục 2 cột: bên trái là đề (PDF hoặc đoạn đọc), bên phải là phiếu trả lời.
  const hasPdfPanel = exam?.examType === 'ANSWER_SHEET' && !!exam?.pdfUrl;
  const hasPassagePanel = !!(currentQ?.groupId && passageGroups[currentQ.groupId]);
  const hasSidePanel = hasPdfPanel || hasPassagePanel;
  // Chỉ cho kéo khi đúng 1 khung đề ở bên trái và phiếu trả lời đang hiện.
  const canResizeSplit = showAnswerSheet && hasPdfPanel !== hasPassagePanel;

  if (libraryResourceId && !hasStarted && !isPromptingAccessCode && !showAccessDenied) {
    return (
      <Portal><div className="fixed inset-0 z-[100] bg-kem dark:bg-night-page flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-cam border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-vutru dark:text-night-text mb-1">Đang vào phòng thi...</h2>
        <p className="text-xs text-vutruNhat dark:text-night-muted">Hệ thống đang chuẩn bị đề thi từ kho học liệu</p>
      </div></Portal>
    );
  }

  return (
    <>
      {!hasStarted && (
        <Portal><div className="fixed inset-0 z-[100] bg-kem dark:bg-night-page overflow-y-auto flex flex-col pointer-events-auto">
          {/* Header */}
          <header className="px-6 py-3 border-b border-gray-200 dark:border-night-border bg-white dark:bg-night-surface flex justify-between items-center sticky top-0 z-10 shadow-sm">
            <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
              <img src="/logo.svg" alt="Logo Điểm Sáng" className="w-8 h-8 rounded-lg object-contain shrink-0" />
              <span className="text-2xl font-extrabold theme-logo tracking-tight hidden sm:block">Điểm Sáng</span>
            </Link>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Bài thi hệ thống</div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            {/* Left Column */}
            <div className="lg:col-span-3 space-y-4 animate-fade-in">
              <div className="flex items-start gap-4 pt-2">
                <BackButton to={returnUrl} fallbackUrl={returnUrl || '/exams'} />
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-4xl font-heading font-extrabold text-vutru dark:text-night-text line-clamp-2 leading-normal py-1">{exam.title}</h1>
                </div>
              </div>
              
              {/* Student Info */}
              <div className="space-y-3 bg-white dark:bg-night-elevated p-4 rounded-3xl border border-gray-100 dark:border-night-border shadow-sm">
                <div className="bg-gray-50 dark:bg-night-surface px-4 py-3 rounded-2xl border border-gray-100 dark:border-night-border font-bold text-vutru dark:text-night-text text-base">
                  {user?.fullName || 'Học viên'}
                </div>
                <div className="bg-gray-50 dark:bg-night-surface px-4 py-3 rounded-2xl border border-gray-100 dark:border-night-border font-bold text-gray-600 dark:text-night-muted text-sm">
                  {user?.email || 'email@example.com'}
                </div>
              </div>

              {/* Exam Info & Options */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-3xl text-center border border-blue-100 dark:border-blue-800/30 flex flex-col justify-center">
                  <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">{exam.durationMinutes > 0 ? exam.durationMinutes : '∞'}</div>
                  <div className="text-xs font-bold text-blue-500 uppercase tracking-wider">Phút làm bài</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-3xl text-center border border-orange-100 dark:border-orange-800/30 flex flex-col justify-center">
                  <div className="text-3xl font-black text-cam mb-1">{exam.questions?.length || 0}</div>
                  <div className="text-xs font-bold text-orange-500 uppercase tracking-wider">Câu hỏi</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-3xl text-center border border-green-100 dark:border-green-800/30 col-span-2 lg:col-span-1 flex flex-col justify-center">
                  <div className="text-3xl font-black text-green-600 dark:text-green-400 mb-1">
                    {exam.maxAttempts > 0 
                      ? `${Math.max(0, exam.maxAttempts - (exam.userAttemptCount || 0))}`
                      : '∞'}
                  </div>
                  <div className="text-xs font-bold text-green-500 uppercase tracking-wider">Lần thi còn lại</div>
                </div>
              </div>
              
              {/* Warnings */}
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-3xl">
                <h3 className="font-bold text-red-800 dark:text-red-400 flex items-center gap-2 mb-2">
                  <AlertTriangle size={18} />
                  Lưu ý quan trọng
                </h3>
                <ul className="text-sm font-medium text-red-700 dark:text-red-300 space-y-1 ml-7 list-disc">
                  <li>Bài thi sẽ được mở ở chế độ toàn màn hình.</li>
                  <li><strong>Không chuyển tab, không mở cửa sổ khác</strong> trong lúc làm bài. Hệ thống sẽ ghi nhận vi phạm.</li>
                  <li>Hết thời gian bài thi sẽ tự động nộp.</li>
                </ul>
              </div>

              {/* Consent Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-night-elevated rounded-2xl transition-colors border border-transparent hover:border-gray-100">
                <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                  <input 
                    type="checkbox" 
                    checked={hasAgreed} 
                    onChange={e => setHasAgreed(e.target.checked)} 
                    className="w-5 h-5 accent-cam cursor-pointer" 
                  />
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-relaxed select-none">
                  Tôi đã đọc và hiểu các quy định thi. Tôi đồng ý rằng khi bắt đầu làm bài, tôi không thể rời khỏi màn hình này hoặc mở tab/cửa sổ khác.
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-1">
                {(exam.maxAttempts === 0 || (exam.userAttemptCount || 0) < exam.maxAttempts) ? (
                  <Button 
                    onClick={handleStartExam}
                    disabled={starting || !hasAgreed}
                    isLoading={starting}
                    className="flex-1 text-lg py-3 shadow-xl shadow-cam/20 hover:shadow-2xl hover:shadow-cam/40 transition-all duration-300 rounded-2xl disabled:opacity-50 disabled:shadow-none"
                    size="lg"
                  >
                    Bắt đầu làm bài
                  </Button>
                ) : (
                  <div className="flex-1 p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl text-center border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 font-bold">Bạn đã hết số lần làm bài cho phép.</p>
                  </div>
                )}
                
                {exam.latestResultId && (
                  <Button
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (libraryResourceId) params.set('libraryResourceId', libraryResourceId);
                      if (fromParam) params.set('from', fromParam);
                      const qs = params.toString() ? `?${params.toString()}` : '';
                      navigate(`/exams/results/${exam.latestResultId}${qs}`);
                    }}
                    variant="outline"
                    className="flex-1 text-lg py-3 rounded-2xl border-2 border-cam text-cam hover:bg-cam/5"
                    size="lg"
                  >
                    Xem kết quả lần trước
                  </Button>
                )}
              </div>
            </div>
            
            {/* Right Column: Illustration */}
            <div className="hidden lg:flex lg:col-span-2 justify-center items-center">
               <div className="relative w-full max-w-xs aspect-square bg-gradient-to-br from-orange-100 to-cam/20 dark:from-orange-900/20 dark:to-cam/10 rounded-full flex items-center justify-center shadow-inner">
                 <div className="absolute inset-4 bg-white/40 dark:bg-black/20 rounded-full backdrop-blur-sm animate-pulse"></div>
                 <div className="relative z-10 w-48 h-48 bg-white dark:bg-night-surface rounded-3xl shadow-2xl rotate-3 flex flex-col p-6 border border-gray-100 dark:border-night-border">
                    <div className="flex gap-2 mb-4 border-b pb-4 dark:border-night-border">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 font-bold flex items-center justify-center shrink-0">1</div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600"></div><div className="h-2 bg-gray-200 dark:bg-gray-700 w-1/2 rounded"></div></div>
                      <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-cam flex items-center justify-center text-white text-[10px]">✓</div><div className="h-2 bg-gray-200 dark:bg-gray-700 w-2/3 rounded"></div></div>
                      <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600"></div><div className="h-2 bg-gray-200 dark:bg-gray-700 w-1/3 rounded"></div></div>
                    </div>
                    <div className="mt-4 pt-4 border-t dark:border-night-border flex justify-end">
                      <div className="w-16 h-6 bg-cam rounded-lg"></div>
                    </div>
                 </div>
                 {/* Floating accents */}
                 <div className="absolute -top-4 right-10 w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl -rotate-12 shadow-lg border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-500 animate-bounce-sm"><AlertTriangle size={24}/></div>
                 <div className="absolute bottom-10 -left-6 w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-2xl rotate-12 shadow-lg border border-green-200 dark:border-green-800 flex items-center justify-center text-green-600 text-2xl font-black">A+</div>
                 <div className="absolute top-1/2 -right-8 w-14 h-14 bg-yellow-100 dark:bg-yellow-900/50 rounded-full shadow-lg border border-yellow-200 dark:border-yellow-800 flex items-center justify-center text-yellow-600"><Flag size={20}/></div>
               </div>
            </div>
          </main>
        </div></Portal>
      )}

      <div className={`exam-focus-shell min-h-screen flex flex-col select-none text-vutru bg-kem dark:bg-night transition-all duration-500 ${!hasStarted ? 'pointer-events-none h-screen overflow-hidden' : ''}`}>

      {/* ── HEADER ── */}
      <div className="exam-focus-header border-b bg-white dark:bg-night-surface border-gray-200 dark:border-night-border px-4 md:px-6 py-3 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="exam-focus-badge text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cam/20 text-cam border border-cam/30">
                Focus Mode
              </span>
            </div>
            <h2 className="font-extrabold text-base md:text-lg line-clamp-1">{exam.title}</h2>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs font-medium opacity-70">
                Đã làm: <span className="text-cam font-bold">{answeredCount}/{totalCount}</span>
              </span>
              {cheatDataRef.current.count > 0 && (
                <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full animate-pulse">
                  <AlertTriangle size={16} className="inline mr-1" /> Vi phạm: {cheatDataRef.current.count}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Button
              onClick={async () => {
                const ok = await toast.confirm('Bạn có chắc chắn muốn thoát? Bài làm sẽ không được nộp nếu bạn chưa bấm nộp bài.', { title: 'Thoát bài thi', confirmLabel: 'Thoát', cancelLabel: 'Ở lại' });
                if (ok) {
                  submittingRef.current = true; // prevent cheat warning
                  if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                  }
                  navigate(returnUrl || '/dashboard', { replace: true });
                }
              }}
              variant="outline"
              size="sm"
              className="!px-3 text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
            >
              Thoát
            </Button>
            
            <Button
                onClick={() => setShowQuestionPanel(!showQuestionPanel)}
                variant="secondary"
                size="sm"
                className="!px-3 hidden sm:flex"
                title={showQuestionPanel ? "Ẩn danh sách câu" : "Hiện danh sách câu"}
              >
                {showQuestionPanel ? 'Ẩn DS câu' : 'Hiện DS câu'}
              </Button>

              {exam?.examType === 'ANSWER_SHEET' && exam?.pdfUrl && (
                <Button
                  onClick={() => setShowAnswerSheet(!showAnswerSheet)}
                  variant="secondary"
                  size="sm"
                  className="!px-3 hidden sm:flex"
                  title={showAnswerSheet ? "Ẩn phiếu trả lời" : "Hiện phiếu trả lời"}
                >
                  {showAnswerSheet ? 'Ẩn phiếu TL' : 'Hiện phiếu TL'}
                </Button>
              )}

            <div className="hidden sm:flex bg-gray-100 dark:bg-night-border rounded-xl p-1 sm:mr-2 border border-gray-200 dark:border-night-elevated">
              <button onClick={() => setFontSize(Math.max(0, fontSize - 1))} className="px-3 py-1 font-bold hover:bg-white dark:hover:bg-night-surface rounded-lg transition-colors text-vutru dark:text-night-text text-sm">A-</button>
              <button onClick={() => setFontSize(Math.min(2, fontSize + 1))} className="px-3 py-1 font-bold hover:bg-white dark:hover:bg-night-surface rounded-lg transition-colors text-vutru dark:text-night-text text-base">A+</button>
            </div>
            <div className={`font-mono text-base sm:text-xl font-bold px-2.5 sm:px-4 py-1.5 rounded-xl transition-colors ${
              timeLeft <= 60 
                ? 'bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/40 animate-pulse' 
                : timeLeft <= 300 
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                : 'bg-cam/15 text-cam border border-cam/30'
            }`}>
              {formatTime(timeLeft)}
            </div>
            <Button
              onClick={handleSubmitClick}
              disabled={submitting}
              isLoading={submitting}
              variant="primary"
              size="sm"
              className="!px-3 sm:!px-4"
            >
              <span className="sm:hidden">Nộp</span>
              <span className="hidden sm:inline">Nộp Bài</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── SIDEBAR: Bảng câu hỏi ── */}
        {showQuestionPanel && (
        <div className="hidden lg:flex flex-col w-72 exam-focus-panel border-r bg-white dark:bg-night-surface border-gray-200 dark:border-night-border p-5 overflow-y-auto shrink-0">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-60">Danh sách câu hỏi</h3>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-green-500 inline-block"></span>Đã làm</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-yellow-400 inline-block"></span>Đánh dấu</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-gray-200 inline-block"></span>Chưa làm</span>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {questions.map((q, idx) => {
              const isAnswered = isQuestionAnswered(q);
              const isFlagged = flagged.has(q.id);
              const isCurrent = idx === currentIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  title={`Câu ${idx + 1}`}
                  className={`
                    w-9 h-9 rounded-lg text-xs font-bold transition-all border-2
                    ${isCurrent ? 'border-camDam scale-110 shadow-md' : 'border-transparent'}
                    ${isFlagged ? 'bg-yellow-400 text-white' : isAnswered ? 'bg-green-500 text-white' : 'bg-gray-100 text-vutruNhat hover:bg-gray-200'}
                  `}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-sm space-y-1 text-vutruNhat">
            <div className="flex justify-between"><span>Tổng số câu:</span><span className="font-bold text-vutru">{totalCount}</span></div>
            <div className="flex justify-between"><span>Đã trả lời:</span><span className="font-bold text-green-600">{answeredCount}</span></div>
            <div className="flex justify-between"><span>Chưa làm:</span><span className="font-bold text-gray-500">{unansweredCount}</span></div>
            <div className="flex justify-between"><span>Đánh dấu:</span><span className="font-bold text-yellow-600">{flagged.size}</span></div>
          </div>
        </div>
        )}

        {/* ── QUESTION AREA ── */}
        <div className="flex-1 overflow-y-auto relative">
          <div
            ref={splitContainerRef}
            style={canResizeSplit ? ({ ['--exam-split' as any]: `${splitRatio}%` } as React.CSSProperties) : undefined}
            className={`${hasSidePanel ? (showQuestionPanel ? 'max-w-[1600px]' : 'max-w-none') + ' w-full flex flex-col xl:flex-row gap-6' : 'max-w-7xl'} ${canResizeSplit ? 'exam-split' : ''} ${isResizing ? 'exam-split-dragging' : ''} mx-auto p-4 md:p-8 pb-32 transition-all duration-300`}
          >

            {/* PDF Viewer (nếu có) */}
            {exam?.examType === 'ANSWER_SHEET' && exam?.pdfUrl && (
              <div className="exam-split-left flex-1 flex flex-col gap-3 mb-6 xl:mb-0 xl:sticky xl:top-4 xl:h-[calc(100vh-140px)]">
                {exam.audioTracks && exam.audioTracks.length > 0 ? (
                  <div className="shrink-0">
                    <ExamAudioTracksPlayer tracks={exam.audioTracks} className="w-full" />
                  </div>
                ) : exam.audioUrl && (
                  <div className="shrink-0">
                    <SlimAudioPlayer url={exam.audioUrl} className="w-full" />
                  </div>
                )}
                <div className="flex-1 bg-white dark:bg-night-elevated border-gray-200 dark:border-night-border shadow-sm rounded-2xl p-2 md:p-4 border overflow-hidden exam-focus-card custom-scrollbar min-h-0">
                  <PdfViewer url={exam.pdfUrl} />
                </div>
              </div>
            )}

            {/* Audio riêng của exam (DETAILED, không chia part) — chỉ hiện khi part hiện tại không có audio riêng */}
            {exam?.examType !== 'ANSWER_SHEET' && exam?.audioUrl &&
              !(currentQ?.groupId && passageGroups[currentQ.groupId]?.audioUrl) && (
              <div className="w-full mb-4">
                <SlimAudioPlayer url={exam.audioUrl} className="w-full" />
              </div>
            )}

            {/* Passage Panel (nếu có) */}
            {currentQ?.groupId && passageGroups[currentQ.groupId] && (
              <div className={`exam-split-left flex-1 bg-white dark:bg-night-elevated border-gray-200 dark:border-night-border shadow-sm rounded-2xl p-6 md:p-8 mb-6 xl:mb-0 border overflow-y-auto xl:sticky xl:top-4 xl:h-[calc(100vh-140px)] exam-focus-card custom-scrollbar ${fontSize === 0 ? 'text-base' : fontSize === 1 ? 'text-lg' : 'text-xl'}`}>
                <h3 className="text-lg font-bold text-camDam mb-4 pb-2 border-b border-gray-100">
                  {passageGroups[currentQ.groupId].groupTitle || 'Đoạn đọc'}
                </h3>
                {passageGroups[currentQ.groupId].audioUrl && (
                  <div className="mb-4" key={`audio-${currentQ.groupId}`}>
                    <SlimAudioPlayer url={passageGroups[currentQ.groupId].audioUrl!} className="w-full" />
                  </div>
                )}
                <div
                  className="prose dark:prose-invert max-w-none tiptap-content text-vutru leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(passageGroups[currentQ.groupId].passageText) }}
                />
              </div>
            )}

            {/* ── Thanh kéo chỉnh tỉ lệ đề thi / phiếu trả lời ── */}
            {canResizeSplit && (
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Kéo để chỉnh độ rộng phần đề thi"
                aria-valuenow={Math.round(splitRatio)}
                aria-valuemin={MIN_SPLIT}
                aria-valuemax={MAX_SPLIT}
                tabIndex={0}
                onPointerDown={handleResizeStart}
                onKeyDown={handleResizeKeyDown}
                onDoubleClick={() => setSplitRatio(DEFAULT_SPLIT)}
                title="Kéo để chỉnh độ rộng · nhấn đúp để đặt lại"
                className={`exam-split-divider group relative -mx-3 w-6 shrink-0 cursor-col-resize select-none items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-cam xl:sticky xl:top-4 xl:h-[calc(100vh-140px)] ${isResizing ? 'z-20' : ''}`}
              >
                <div className={`h-full w-1 rounded-full transition-colors ${isResizing ? 'bg-cam' : 'bg-gray-200 dark:bg-night-border group-hover:bg-cam/60'}`} />
                <div className={`absolute flex h-12 w-6 items-center justify-center rounded-full border shadow-sm transition-colors ${isResizing ? 'border-cam bg-cam text-white' : 'border-gray-200 bg-white text-gray-400 group-hover:border-cam/50 group-hover:text-cam dark:border-night-border dark:bg-night-surface'}`}>
                  <GripVertical size={14} />
                </div>
              </div>
            )}

            {/* Answer Sheet Wrapper */}
            {showAnswerSheet && (
            <div className={`exam-split-right flex flex-col min-w-0 ${hasSidePanel ? (showQuestionPanel ? 'xl:w-[500px] shrink-0' : 'xl:w-1/3 shrink-0') : 'w-full'} transition-all duration-300`}>
              {/* Question Card */}
              {currentQ ? (
              <div className={`exam-focus-card bg-white dark:bg-night-elevated border-gray-200 dark:border-night-border shadow-sm rounded-2xl p-6 md:p-8 animate-fade-in border ${fontSize === 0 ? 'text-base' : fontSize === 1 ? 'text-lg' : 'text-xl'}`}>

              {/* Question Header */}
              <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
                <div className="flex gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-cam/10 text-camDam font-extrabold flex items-center justify-center shrink-0 text-lg">
                    {currentIdx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`prose dark:prose-invert max-w-none text-vutru tiptap-content ${fontSize === 0 ? 'text-xl md:text-2xl' : fontSize === 1 ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'}`}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentQ.content) }}
                    />
                    <div className="mt-2 text-xs font-bold text-gray-400 bg-gray-50 inline-block px-2 py-1 rounded">
                      {currentQ.points} Điểm
                    </div>
                  </div>
                </div>

                {/* Flag button */}
                <button
                  onClick={() => toggleFlag(currentQ.id)}
                  title={flagged.has(currentQ.id) ? 'Bỏ đánh dấu' : 'Đánh dấu câu này'}
                  className={`shrink-0 w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all
                    ${flagged.has(currentQ.id) ? 'bg-yellow-400 border-yellow-500 text-white' : 'border-gray-200 text-gray-400 hover:border-yellow-400 hover:text-yellow-500'}`}
                >
                  <Flag size={16} strokeWidth={2.5} fill={flagged.has(currentQ.id) ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Options or Essay Input */}
              <div className="space-y-3">
                {currentQ.questionType === 'ESSAY' || currentQ.questionType === 'SHORT_ANSWER' ? (
                  <textarea
                    placeholder={
                      currentQ.questionType === 'SHORT_ANSWER'
                        ? 'Nhập đáp án ngắn của bạn...'
                        : 'Nhập câu trả lời của bạn vào đây...'
                    }
                    className={`w-full p-5 border-2 border-gray-200 rounded-xl focus:border-cam outline-none resize-y text-lg text-vutru ${
                      currentQ.questionType === 'SHORT_ANSWER' ? 'min-h-[96px]' : 'min-h-[200px]'
                    }`}
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleTextResponse(currentQ.id, e.target.value)}
                  />
                ) : currentQ.questionType === 'TRUE_FALSE' ? (
                  // Multi-statement TRUE_FALSE (dạng ý a/b/c/d)
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 mb-1">Với mỗi ý, chọn Đúng hoặc Sai:</p>
                    {currentQ.options.map((opt, oIndex) => {
                      const selected = getStatementAnswers(currentQ.id)[opt.id];
                      return (
                        <div
                          key={opt.id}
                          className="border-2 border-gray-100 rounded-xl p-4 bg-white dark:bg-night-elevated dark:border-night-border"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <span className="font-extrabold text-camDam shrink-0">
                              {getStatementLabel(oIndex)})
                            </span>
                            <div
                              className="flex-1 tiptap-content text-sm md:text-base"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(opt.content) }}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleStatementAnswer(currentQ.id, opt.id, true)}
                              className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                                selected === true
                                  ? 'bg-green-500 border-green-500 text-white shadow-sm shadow-green-200/50'
                                  : 'border-gray-200 dark:border-night-border text-gray-500 hover:border-green-300 hover:bg-green-50/50'
                              }`}
                            >
                              ✓ Đúng
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatementAnswer(currentQ.id, opt.id, false)}
                              className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                                selected === false
                                  ? 'bg-red-500 border-red-500 text-white shadow-sm shadow-red-200/50'
                                  : 'border-gray-200 dark:border-night-border text-gray-500 hover:border-red-300 hover:bg-red-50/50'
                              }`}
                            >
                              ✗ Sai
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  currentQ.options.map((opt, optIdx) => {
                    const isSelected = answers[currentQ.id] === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(currentQ.id, opt.id)}
                        className={`group flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all
                          ${isSelected
                            ? 'border-cam bg-cam/5 shadow-sm'
                            : 'border-gray-100 hover:border-cam/30 hover:bg-gray-50'
                          }`}
                      >
                        <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-cam bg-cam text-white' : 'border-gray-300 bg-white group-hover:border-cam text-gray-500'}`}>
                          <span className="font-bold text-xs md:text-sm">{String.fromCharCode(65 + optIdx)}</span>
                        </div>
                        <div className="flex-1 tiptap-content text-sm md:text-base" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(opt.content) }} />
                      </div>
                    );
                  })
                )}
              </div>
              </div>
              ) : (
                <div className="exam-focus-card bg-white dark:bg-night-elevated border-gray-200 dark:border-night-border shadow-sm rounded-2xl p-8 text-center text-gray-500">
                  Đề thi này chưa có câu hỏi nào.
                </div>
              )}

            {/* Navigation */}
            <div className="sticky bottom-4 z-20 bg-white/90 dark:bg-night-elevated/90 backdrop-blur-xl p-3 sm:p-4 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-night-border flex items-center justify-between gap-2 sm:gap-4 mt-8">
              <Button
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                variant="secondary"
                size="md"
                className="!px-3 sm:!px-6"
              >
                <span className="sm:hidden">←</span>
                <span className="hidden sm:inline">← Câu trước</span>
              </Button>

              {/* Mobile: current index button that opens palette modal */}
              <button
                type="button"
                onClick={() => setShowMobilePalette(true)}
                className="flex lg:hidden items-center justify-center px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-night-surface hover:bg-cam/10 dark:hover:bg-cam/20 border border-gray-200 dark:border-night-border transition-colors min-w-0"
                title="Xem toàn bộ câu hỏi"
              >
                <span className="text-xs font-bold text-vutru dark:text-night-text whitespace-nowrap flex items-center gap-1.5">
                  <ClipboardList size={14} className="text-cam" />
                  <span>Câu {currentIdx + 1} / {totalCount}</span>
                </span>
              </button>

              <Button
                onClick={() => setCurrentIdx(prev => Math.min(totalCount - 1, prev + 1))}
                disabled={currentIdx === totalCount - 1}
                variant="primary"
                size="md"
                className="!px-3 sm:!px-6"
              >
                <span className="sm:hidden">→</span>
                <span className="hidden sm:inline">Câu tiếp →</span>
              </Button>
            </div>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE QUESTION PALETTE DRAWER ── */}
      {showMobilePalette && (
        <Portal><div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-xs flex flex-col justify-end lg:hidden animate-fade-in">
          <div className="bg-white dark:bg-night-surface rounded-t-3xl p-5 border-t border-gray-200 dark:border-night-border max-h-[75vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-night-border">
              <div>
                <h3 className="font-heading font-bold text-base text-vutru dark:text-night-text">Danh sách câu hỏi</h3>
                <p className="text-xs text-vutruNhat dark:text-night-muted">Chạm vào số câu để chuyển đến câu đó</p>
              </div>
              <button
                onClick={() => setShowMobilePalette(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted flex items-center justify-center hover:bg-gray-200 dark:hover:bg-night-border text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between py-3 text-xs text-vutruNhat dark:text-night-muted border-b border-gray-100 dark:border-night-border">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Đã làm ({answeredCount})</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> Đánh dấu ({flagged.size})</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700"></span> Chưa làm ({unansweredCount})</span>
            </div>

            <div className="overflow-y-auto py-4 grid grid-cols-5 sm:grid-cols-6 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = isQuestionAnswered(q);
                const isFlagged = flagged.has(q.id);
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIdx(idx);
                      setShowMobilePalette(false);
                    }}
                    className={`
                      h-10 rounded-xl text-xs font-bold transition-all border-2 flex items-center justify-center
                      ${isCurrent ? 'border-cam shadow-md scale-105' : 'border-transparent'}
                      ${isFlagged ? 'bg-yellow-400 text-white' : isAnswered ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-night-elevated text-vutru dark:text-night-text'}
                    `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div></Portal>
      )}

      {/* ── CONFIRM SUBMIT MODAL ── */}
      {showConfirmSubmit && (
        <Portal><div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-night-surface rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-gray-100 dark:border-night-border animate-fade-in">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">📋</div>
              <h2 className="text-2xl font-extrabold font-heading text-vutru dark:text-night-text mb-2">Xác nhận nộp bài</h2>
              <p className="text-sm text-vutruNhat dark:text-night-muted leading-relaxed">
                Bạn đã trả lời <strong className="text-green-600 dark:text-green-400 font-bold">{answeredCount}/{totalCount}</strong> câu hỏi.
              </p>
            </div>

            {/* Unanswered list */}
            {unansweredCount > 0 && (
              <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-4 mb-5">
                <p className="font-bold text-xs sm:text-sm text-orange-700 dark:text-orange-300 flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-orange-500 shrink-0" />
                  Còn <strong>{unansweredCount}</strong> câu chưa trả lời:
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto hide-scrollbar">
                  {questions.map((q, idx) =>
                    !answers[q.id] ? (
                      <button
                        key={q.id}
                        onClick={() => { setShowConfirmSubmit(false); setCurrentIdx(idx); }}
                        className="w-8 h-8 rounded-lg bg-orange-200 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200 font-bold text-xs hover:bg-orange-300 dark:hover:bg-orange-800 transition-colors"
                        title={`Đi tới câu ${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    ) : null
                  )}
                </div>
                <p className="text-[11px] text-orange-600 dark:text-orange-400 mt-2">Bấm vào số câu để quay lại hoàn thành câu đó.</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirmSubmit(false)}
                variant="secondary"
                className="flex-1 rounded-2xl"
              >
                Làm tiếp
              </Button>
              <Button
                onClick={() => { setShowConfirmSubmit(false); doSubmit(); }}
                variant="primary"
                className="flex-1 rounded-2xl shadow-soft"
              >
                Nộp bài ngay
              </Button>
            </div>
          </div>
        </div></Portal>
      )}

      {/* ── CHEAT WARNING MODAL ── */}
      {showCheatModal && (
        <Portal><div className="fixed inset-0 z-[99999] bg-red-600/95 flex flex-col items-center justify-center p-6 text-center text-white backdrop-blur-md">
          <div className="flex justify-center"><AlertTriangle size={80} className="mb-6 text-yellow-500 animate-bounce" /></div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase tracking-wider">Cảnh báo vi phạm!</h2>
          <p className="text-xl md:text-2xl font-medium max-w-2xl mb-8 leading-relaxed">
            Bạn vừa rời khỏi màn hình làm bài (chuyển tab, cửa sổ hoặc thoát toàn màn hình).
            <br /><br />
            <strong>Hành động này đã được ghi nhận vào hệ thống.</strong> Vui lòng tập trung làm bài!
          </p>
          <button
            onClick={() => {
              setShowCheatModal(false);
              const elem = document.documentElement;
              if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
            }}
            className="px-8 py-4 bg-white text-red-600 font-extrabold rounded-2xl text-xl shadow-2xl hover:scale-105 transition-transform uppercase tracking-wider"
          >
            Tôi Đã Hiểu & Quay Lại
          </button>
        </div></Portal>
      )}

    </div>
    </>
  );
};

export default ExamTake;
